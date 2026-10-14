"use server";

/**
 * Simplified PDF Parser for Resume Extraction
 *
 * Uses pdf.js for cross-platform PDF text extraction, with caps on file
 * size, pages read and parse time.
 * This is a pure JavaScript solution with no native dependencies.
 *
 * Features:
 * - Never throws errors - always returns structured response
 * - Pure JavaScript (no native dependencies like canvas)
 * - Works across all platforms
 * - Comprehensive structured logging
 * - Performance timing
 */

import { cleanExtractedText } from "@/lib/textCleanup";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Result type for both PDF and image text extraction.
 * 
 * Methods:
 * - 'pdfjs': Used by extractTextFromBuffer for PDF files
 * - 'ocr': Used by imageParser.ts for mobile camera captures
 * - 'fallback': Used when extraction fails
 */
export interface PDFExtractionResult {
  status: "success" | "partial" | "failed";
  message: string;
  text: string;
  method: "pdfjs" | "ocr" | "fallback";
  confidence?: number;
  characterCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_SUCCESS_LENGTH = 50; // Minimum characters for success
const MIN_PARTIAL_LENGTH = 15; // Minimum for partial success

// Resource caps. A resume is a few pages; anything far beyond that is either
// not a resume or an attempt to tie up the server.
const MAX_PDF_BYTES = 5 * 1024 * 1024; // matches the upload limit in /api/analyze
const MAX_PDF_PAGES = 10; // pages beyond this are not read
const PARSE_TIMEOUT_MS = 15_000;

// Info-dictionary keys that describe the file, not the resume
const SKIP_METADATA_KEYS = ["producer", "creator", "creationdate", "moddate", "pdfformatversion"];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format time in milliseconds to human-readable string
 */
function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * A PDF starts with "%PDF-"; the spec lets it appear anywhere in the first 1KB.
 */
function looksLikePdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 1024).includes("%PDF-");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`PDF parsing timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function failed(message: string): PDFExtractionResult {
  return { status: "failed", message, text: "", method: "fallback", characterCount: 0 };
}

// ============================================================================
// PDF-PARSE EXTRACTION
// ============================================================================

interface ParsedPdf {
  text: string;
  metadataText: string;
}

/**
 * Read the page text and the descriptive metadata (title, subject, ...),
 * which is the fallback when a PDF has no text layer.
 *
 * Uses the pdf.js legacy (CommonJS, Node 18+) build, the same pdf.js version
 * react-pdf ships to the browser. `isEvalSupported: false` is the upstream
 * mitigation for CVE-2024-4367 on pdf.js versions before 4.2.67.
 */
async function parsePdf(pdfBuffer: Buffer): Promise<ParsedPdf> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  });

  try {
    return await withTimeout(
      (async () => {
        const doc = await loadingTask.promise;
        const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);

        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
          const page = await doc.getPage(pageNumber);
          const content = await page.getTextContent();
          let pageText = "";
          for (const item of content.items) {
            if ("str" in item) pageText += item.str + (item.hasEOL ? "\n" : "");
          }
          pages.push(pageText);
          page.cleanup();
        }

        const metadata = await doc.getMetadata().catch(() => null);
        const metadataParts: string[] = [];
        const sources = [metadata?.info, metadata?.metadata?.getAll()];
        for (const source of sources) {
          if (!source || typeof source !== "object") continue;
          for (const [key, value] of Object.entries(source)) {
            if (
              typeof value === "string" &&
              value.trim().length > 0 &&
              !SKIP_METADATA_KEYS.includes(key.toLowerCase())
            ) {
              metadataParts.push(value.trim());
            }
          }
        }

        return {
          text: cleanExtractedText(pages.join("\n\n")),
          metadataText: cleanExtractedText(metadataParts.join(" ")),
        };
      })(),
      PARSE_TIMEOUT_MS
    );
  } finally {
    // Also stops parsing that is still running after a timeout.
    await loadingTask.destroy();
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main extraction function
 * Always resolves with a PDFExtractionResult (never throws)
 */
export async function extractTextFromBuffer(
  pdfBuffer: Buffer
): Promise<PDFExtractionResult> {
  const overallStartTime = Date.now();

  try {
    console.log(`[PDF Parser] Buffer size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    if (pdfBuffer.length > MAX_PDF_BYTES) {
      return failed(`This PDF is larger than ${MAX_PDF_BYTES / (1024 * 1024)}MB. Please upload a smaller file or paste your resume text.`);
    }
    if (!looksLikePdf(pdfBuffer)) {
      return failed("This file is not a valid PDF. Please upload a PDF or paste your resume text.");
    }

    let parsed: ParsedPdf;
    try {
      parsed = await parsePdf(pdfBuffer);
    } catch (error) {
      // Corrupt, encrypted or too slow to parse. Log the reason, never the content.
      console.error("[PDF Parser] pdf.js failed:", error instanceof Error ? error.message : error);
      return failed("Unable to read this PDF. Please ensure it is not password-protected or damaged, or paste your resume text instead.");
    }

    let finalText = parsed.text;

    // ===== FALLBACK: METADATA (if the PDF has little or no text layer) =====
    if (finalText.length < MIN_SUCCESS_LENGTH && parsed.metadataText.length > finalText.length) {
      console.log(`[PDF Parser] Text too short (${finalText.length} chars), using metadata`);
      finalText = parsed.metadataText;
    }

    const characterCount = finalText.length;
    const finalMethod: PDFExtractionResult["method"] = characterCount > 0 ? "pdfjs" : "fallback";

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

    console.log(`[PDF Parser] Status: ${status.toUpperCase()}`);
    console.log(`[PDF Parser] Method: ${finalMethod}`);
    console.log(`[PDF Parser] Character count: ${characterCount}`);
    console.log(`[PDF Parser] Total time: ${formatTime(totalTime)}`);

    // Never log extracted text: a resume's first lines are name, email and phone.

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
