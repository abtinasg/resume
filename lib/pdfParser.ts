"use server";

/**
 * Simplified PDF Parser for Resume Extraction
 *
 * Uses pdf-parse for reliable, cross-platform PDF text extraction.
 * This is a pure JavaScript solution with no native dependencies.
 *
 * Features:
 * - Never throws errors - always returns structured response
 * - Pure JavaScript (no native dependencies like canvas)
 * - Works across all platforms
 * - Comprehensive structured logging
 * - Performance timing
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Result type for both PDF and image text extraction.
 * 
 * Methods:
 * - 'pdf-parse': Used by extractTextFromBuffer for PDF files
 * - 'ocr': Used by imageParser.ts for mobile camera captures
 * - 'fallback': Used when extraction fails
 */
export interface PDFExtractionResult {
  status: "success" | "partial" | "failed";
  message: string;
  text: string;
  method: "pdf-parse" | "ocr" | "fallback";
  confidence?: number;
  characterCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_SUCCESS_LENGTH = 50; // Minimum characters for success
const MIN_PARTIAL_LENGTH = 15; // Minimum for partial success
const PREVIEW_LENGTH = 150; // Characters to show in logs

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clean extracted text by removing layout artifacts and excessive whitespace
 * Fixes common issues like broken spacing ("T R A V E L" → "TRAVEL")
 */
function cleanExtractedText(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Remove invisible/non-printable characters (keep basic ASCII + newline/return/tab)
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    // Normalize line breaks
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive newlines (more than 2 consecutive)
    .replace(/\n{3,}/g, "\n\n")
    // Collapse multiple spaces but preserve single newlines
    .replace(/ +/g, " ")
    // Collapse spaces around newlines
    .replace(/ *\n */g, "\n")
    // Remove tabs
    .replace(/\t+/g, " ")
    .trim();

  // Fix broken spacing between individual characters
  // Pattern: single letter followed by space and another single letter
  // Example: "T R A V E L" → "TRAVEL"
  cleaned = cleaned.replace(/\b([A-Z])\s+(?=[A-Z]\b)/g, "$1");
  cleaned = cleaned.replace(/\b([a-z])\s+(?=[a-z]\b)/g, "$1");

  // Handle mixed case spaced letters
  cleaned = cleaned.replace(/([A-Za-z])\s+(?=[A-Za-z]\s+[A-Za-z])/g, "$1");

  return cleaned;
}

/**
 * Format time in milliseconds to human-readable string
 */
function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ============================================================================
// PDF-PARSE EXTRACTION
// ============================================================================

/**
 * Extract text from PDF buffer using pdf-parse
 * Pure JavaScript implementation - no native dependencies
 */
async function extractWithPdfParse(pdfBuffer: Buffer): Promise<string> {
  try {
    const startTime = Date.now();

    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(pdfBuffer);

    const extractedText = data.text || "";
    const cleanText = cleanExtractedText(extractedText);
    const elapsed = Date.now() - startTime;

    console.log(
      `[PDF Parser] Extracted ${cleanText.length} chars via pdf-parse (${elapsed}ms)`
    );

    return cleanText;
  } catch (error) {
    console.error("[PDF Parser][pdf-parse] Extraction failed:", error);
    return "";
  }
}

/**
 * Extract metadata from PDF as fallback
 */
async function extractMetadata(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(pdfBuffer);

    const parts: string[] = [];

    // Extract from metadata
    if (data.metadata) {
      Object.entries(data.metadata).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          // Skip common non-content metadata
          const skipKeys = [
            "producer",
            "creator",
            "creationdate",
            "moddate",
            "pdfformatversion",
          ];
          if (!skipKeys.includes(key.toLowerCase())) {
            parts.push(value.trim());
          }
        }
      });
    }

    // Extract from info
    if (data.info) {
      Object.entries(data.info).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          const skipKeys = [
            "producer",
            "creator",
            "creationdate",
            "moddate",
            "pdfformatversion",
          ];
          if (!skipKeys.includes(key.toLowerCase())) {
            parts.push(value.trim());
          }
        }
      });
    }

    const metadataText = parts.join(" ").trim();
    return cleanExtractedText(metadataText);
  } catch (error) {
    console.error("[PDF Parser][metadata] Extraction failed:", error);
    return "";
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main extraction function - uses pdf-parse only
 * Always resolves with a PDFExtractionResult (never throws)
 */
export async function extractTextFromBuffer(
  pdfBuffer: Buffer
): Promise<PDFExtractionResult> {
  const overallStartTime = Date.now();

  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║           PDF PARSER - EXTRACTION START                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(`[PDF Parser] Buffer size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`[PDF Parser] Start time: ${new Date().toISOString()}\n`);

    let finalText = "";
    let finalMethod: PDFExtractionResult["method"] = "fallback";

    // ===== PRIMARY: PDF-PARSE =====
    const pdfParseText = await extractWithPdfParse(pdfBuffer);
    if (pdfParseText.length > 0) {
      finalText = pdfParseText;
      finalMethod = "pdf-parse";
    }

    // ===== FALLBACK: METADATA (if text extraction failed) =====
    if (finalText.length < MIN_SUCCESS_LENGTH) {
      console.log(
        `[PDF Parser] Text too short (${finalText.length} chars), trying metadata fallback...`
      );
      const metadataText = await extractMetadata(pdfBuffer);
      if (metadataText.length > finalText.length) {
        finalText = metadataText;
        // Keep method as pdf-parse since metadata also uses it
      }
    }

    const characterCount = finalText.length;

    // ===== DETERMINE FINAL STATUS =====
    let status: PDFExtractionResult["status"];
    let message: string;

    if (characterCount >= MIN_SUCCESS_LENGTH) {
      status = "success";
      message = "Text extracted successfully.";
    } else if (characterCount >= MIN_PARTIAL_LENGTH) {
      status = "partial";
      message = `Limited text extracted (${characterCount} characters). This may be a design-heavy or scanned PDF. For best results, use a text-based PDF or paste your resume text directly.`;
    } else if (characterCount > 0) {
      status = "partial";
      message = `Very limited text extracted (${characterCount} characters). Please try uploading a text-based PDF or paste your resume content directly.`;
    } else {
      status = "failed";
      message = "Unable to extract text from this PDF. Please ensure your PDF contains selectable text (not a scanned image). Try pasting your resume text instead.";
    }

    // ===== FINAL LOGGING =====
    const totalTime = Date.now() - overallStartTime;

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║           PDF PARSER - EXTRACTION COMPLETE                 ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(`[PDF Parser] Status: ${status.toUpperCase()}`);
    console.log(`[PDF Parser] Method: ${finalMethod}`);
    console.log(`[PDF Parser] Character count: ${characterCount}`);
    console.log(`[PDF Parser] Total time: ${formatTime(totalTime)}`);

    if (finalText.length > 0) {
      const preview = finalText.substring(0, PREVIEW_LENGTH).replace(/\n/g, " ");
      console.log(
        `[PDF Parser] Preview: "${preview}${finalText.length > PREVIEW_LENGTH ? "..." : ""}"`
      );
    }

    console.log(`[PDF Parser] End time: ${new Date().toISOString()}\n`);

    return {
      status,
      message,
      text: finalText,
      method: finalMethod,
      characterCount,
    };
  } catch (error) {
    // Ultimate fallback - should never throw
    const totalTime = Date.now() - overallStartTime;

    console.error("\n[PDF Parser] ✗ UNEXPECTED ERROR:", error);
    console.log(`[PDF Parser] Failed after ${formatTime(totalTime)}\n`);

    return {
      status: "failed",
      message: "An unexpected error occurred while processing the PDF. Please try pasting your resume text instead.",
      text: "",
      method: "fallback",
      characterCount: 0,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR DIFFERENT INPUT FORMATS
// ============================================================================

/**
 * Extract text from base64-encoded PDF string
 * Returns structured result object
 */
export async function extractTextFromBase64PDF(
  base64String: string
): Promise<PDFExtractionResult> {
  try {
    // Remove data URI prefix if present
    const base64Data = base64String.replace(
      /^data:application\/pdf;base64,/,
      ""
    );

    // Validate base64 string
    if (!base64Data || base64Data.length === 0) {
      console.error("[PDF Parser] Invalid or empty base64 string");
      return {
        status: "failed",
        message: "Invalid or empty PDF data provided.",
        text: "",
        method: "fallback",
        characterCount: 0,
      };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0) {
      console.error("[PDF Parser] Failed to decode base64 PDF data");
      return {
        status: "failed",
        message: "Failed to decode PDF data. Please check the file format.",
        text: "",
        method: "fallback",
        characterCount: 0,
      };
    }

    return await extractTextFromBuffer(buffer);
  } catch (error) {
    console.error("[PDF Parser] Base64 conversion error:", error);
    return {
      status: "failed",
      message: "Failed to process base64 PDF data.",
      text: "",
      method: "fallback",
      characterCount: 0,
    };
  }
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use extractTextFromBuffer instead (now returns PDFExtractionResult)
 * This version returns just the text string for backward compatibility
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<string> {
  const result = await extractTextFromBuffer(pdfBuffer);
  return result.text;
}
