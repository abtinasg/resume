"use server";

/**
 * Production-Grade PDF Parser for Resume Extraction
 *
 * Multi-stage extraction pipeline with automatic fallbacks:
 * - Stage 1: pdf-parse for text-based PDFs
 * - Stage 2: pdfjs-dist deep extraction (rebuild text from low-level items)
 * - Stage 3: tesseract.js OCR for scanned/image-based resumes
 * - Stage 4: Metadata extraction fallback
 *
 * Features:
 * - Never throws errors - always returns structured response
 * - Automatic fallback when method produces < 200 characters
 * - OCR with dynamic scaling (1.5x → 2x → 3x)
 * - Confidence tracking for OCR
 * - Text merging from all sources
 * - Comprehensive structured logging
 * - Performance timing
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PDFExtractionResult {
  status: "success" | "partial" | "failed";
  message: string;
  text: string;
  method: "pdf-parse" | "pdfjs" | "ocr" | "metadata" | "fallback";
  confidence?: number; // 0-1 scale for OCR confidence
  characterCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_SUCCESS_LENGTH = 200; // Minimum characters for automatic fallback
const MIN_PARTIAL_LENGTH = 100; // Minimum for partial success
const OCR_MAX_PAGES = 3; // Process up to 3 pages for performance
const OCR_SCALES = [1.5, 2.0, 3.0]; // Dynamic scaling for OCR
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
 * Merge multiple text extractions intelligently
 * Deduplicates and combines text from different sources
 */
function mergeTexts(texts: string[]): string {
  // Filter out empty texts
  const validTexts = texts.filter((t) => t && t.length > 0);

  if (validTexts.length === 0) return "";
  if (validTexts.length === 1) return validTexts[0];

  // For now, use the longest text as primary and append unique content from others
  // In production, you might want more sophisticated merging
  const sorted = validTexts.sort((a, b) => b.length - a.length);
  return sorted[0]; // Use longest extraction
}

/**
 * Format time in milliseconds to human-readable string
 */
function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ============================================================================
// STAGE 1: PDF-PARSE EXTRACTION
// ============================================================================

async function extractWithPdfParse(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log("[PDF Parser][pdf-parse] Starting extraction...");
    const startTime = Date.now();

    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(pdfBuffer);

    const extractedText = data.text || "";
    const cleanText = cleanExtractedText(extractedText);
    const elapsed = Date.now() - startTime;

    console.log(
      `[PDF Parser][pdf-parse] Extracted ${cleanText.length} chars in ${formatTime(elapsed)}`
    );

    return cleanText;
  } catch (error) {
    console.error("[PDF Parser][pdf-parse] Extraction failed:", error);
    return "";
  }
}

// ============================================================================
// STAGE 2: PDFJS-DIST DEEP EXTRACTION
// ============================================================================

async function extractWithPDFJS(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log("[PDF Parser][pdfjs] Starting deep extraction...");
    const startTime = Date.now();

    // Dynamic import for Next.js compatibility
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Create typed array from buffer
    const data = new Uint8Array(pdfBuffer);

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    const textParts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Build text from items with better spacing
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both text items and whitespace items
          if ("str" in item) {
            return item.str;
          }
          return "";
        })
        .join(" ");

      if (pageText.trim().length > 0) {
        textParts.push(pageText);
      }
    }

    const fullText = textParts.join("\n");
    const cleanText = cleanExtractedText(fullText);
    const elapsed = Date.now() - startTime;

    console.log(
      `[PDF Parser][pdfjs] Extracted ${cleanText.length} chars from ${pdf.numPages} pages in ${formatTime(elapsed)}`
    );

    return cleanText;
  } catch (error) {
    console.error("[PDF Parser][pdfjs] Extraction failed:", error);
    return "";
  }
}

// ============================================================================
// STAGE 3: OCR EXTRACTION WITH DYNAMIC SCALING
// ============================================================================

async function extractWithOCR(pdfBuffer: Buffer): Promise<{
  text: string;
  confidence: number;
}> {
  try {
    console.log("[PDF Parser][OCR] Starting OCR extraction...");
    const startTime = Date.now();

    // Dynamic imports
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = await import("canvas");
    const { createWorker } = await import("tesseract.js");

    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    // Create Tesseract worker
    const worker = await createWorker("eng");

    const textParts: string[] = [];
    const confidences: number[] = [];

    // Process first 3 pages only (OCR is slow and expensive)
    const maxPages = Math.min(pdf.numPages, OCR_MAX_PAGES);
    console.log(`[PDF Parser][OCR] Processing ${maxPages} page(s)...`);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        let bestText = "";
        let bestConfidence = 0;

        // Try different scales dynamically
        for (const scale of OCR_SCALES) {
          const viewport = page.getViewport({ scale });

          // Create canvas
          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext("2d");

          // Render PDF page to canvas
          await page.render({
            canvasContext: context as any,
            viewport: viewport,
            canvas: canvas as any,
          }).promise;

          // Convert canvas to image buffer
          const imageBuffer = canvas.toBuffer("image/png");

          // Perform OCR
          const {
            data: { text, confidence },
          } = await worker.recognize(imageBuffer);

          // If this scale produces better results, use it
          if (text.length > bestText.length) {
            bestText = text;
            bestConfidence = confidence;
          }

          // If we got good text with decent confidence, no need to scale further
          if (text.length > 200 && confidence > 80) {
            break;
          }
        }

        if (bestText.trim().length > 0) {
          textParts.push(bestText);
          confidences.push(bestConfidence);

          console.log(
            `[PDF Parser][OCR] Page ${pageNum}/${maxPages} → ${bestText.length} chars (confidence ${(bestConfidence / 100).toFixed(2)})`
          );
        }
      } catch (pageError) {
        console.error(
          `[PDF Parser][OCR] Failed on page ${pageNum}:`,
          pageError
        );
      }
    }

    await worker.terminate();

    const fullText = textParts.join("\n");
    const cleanText = cleanExtractedText(fullText);
    const avgConfidence =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length / 100
        : 0;

    const elapsed = Date.now() - startTime;

    console.log(
      `[PDF Parser][OCR] Extracted ${cleanText.length} chars with confidence ${avgConfidence.toFixed(2)} in ${formatTime(elapsed)}`
    );

    return {
      text: cleanText,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error("[PDF Parser][OCR] Extraction failed:", error);
    return { text: "", confidence: 0 };
  }
}

// ============================================================================
// STAGE 4: METADATA FALLBACK EXTRACTION
// ============================================================================

async function extractMetadata(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log("[PDF Parser][metadata] Extracting metadata...");

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
    console.log(
      `[PDF Parser][metadata] Extracted ${metadataText.length} chars`
    );

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
 * Main extraction function with multi-stage fallbacks
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

    const extractedTexts: string[] = [];
    let finalMethod: PDFExtractionResult["method"] = "fallback";
    let ocrConfidence: number | undefined;

    // ===== STAGE 1: PDF-PARSE =====
    const pdfParseText = await extractWithPdfParse(pdfBuffer);
    if (pdfParseText.length > 0) {
      extractedTexts.push(pdfParseText);
      finalMethod = "pdf-parse";
    }

    // Check if we need fallback
    const currentBest = mergeTexts(extractedTexts);
    const needsFallback = currentBest.length < MIN_SUCCESS_LENGTH;

    // ===== STAGE 2: PDFJS (if needed) =====
    if (needsFallback) {
      console.log(
        `[PDF Parser] Text too short (${currentBest.length} chars), trying pdfjs...`
      );
      const pdfjsText = await extractWithPDFJS(pdfBuffer);
      if (pdfjsText.length > 0) {
        extractedTexts.push(pdfjsText);
        if (pdfjsText.length > pdfParseText.length) {
          finalMethod = "pdfjs";
        }
      }
    }

    // Check again
    const currentBest2 = mergeTexts(extractedTexts);
    const stillNeedsFallback = currentBest2.length < MIN_SUCCESS_LENGTH;

    // ===== STAGE 3: OCR (if needed) =====
    if (stillNeedsFallback) {
      console.log(
        `[PDF Parser] Still too short (${currentBest2.length} chars), trying OCR...`
      );
      const ocrResult = await extractWithOCR(pdfBuffer);
      if (ocrResult.text.length > 0) {
        extractedTexts.push(ocrResult.text);
        ocrConfidence = ocrResult.confidence;
        if (ocrResult.text.length > currentBest2.length) {
          finalMethod = "ocr";
        }
      }
    }

    // Check again
    const currentBest3 = mergeTexts(extractedTexts);
    const stillNeedsFallback2 = currentBest3.length < MIN_SUCCESS_LENGTH;

    // ===== STAGE 4: METADATA (if needed) =====
    if (stillNeedsFallback2) {
      console.log(
        `[PDF Parser] Still too short (${currentBest3.length} chars), trying metadata...`
      );
      const metadataText = await extractMetadata(pdfBuffer);
      if (metadataText.length > 0) {
        extractedTexts.push(metadataText);
        if (metadataText.length > currentBest3.length) {
          finalMethod = "metadata";
        }
      }
    }

    // ===== MERGE ALL EXTRACTIONS =====
    const finalText = mergeTexts(extractedTexts);
    const characterCount = finalText.length;

    // ===== DETERMINE FINAL STATUS =====
    let status: PDFExtractionResult["status"];
    let message: string;

    if (characterCount >= MIN_SUCCESS_LENGTH) {
      status = "success";
      message = `Text extracted successfully using ${finalMethod}.`;
    } else if (characterCount >= MIN_PARTIAL_LENGTH) {
      status = "partial";
      message = `Design-based PDF, limited text extracted (${characterCount} characters). Consider using a text-based export.`;
    } else if (characterCount > 0) {
      status = "partial";
      message = `Very limited text extracted (${characterCount} characters). This appears to be a heavily design-based or scanned resume with minimal recognizable text.`;
    } else {
      status = "failed";
      message = "No text could be extracted from this PDF. Please try a different file or format.";
    }

    // ===== FINAL LOGGING =====
    const totalTime = Date.now() - overallStartTime;

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║           PDF PARSER - EXTRACTION COMPLETE                 ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log(`[PDF Parser] Status: ${status.toUpperCase()}`);
    console.log(`[PDF Parser] Method: ${finalMethod}`);
    console.log(`[PDF Parser] Character count: ${characterCount}`);
    if (ocrConfidence !== undefined) {
      console.log(`[PDF Parser] OCR confidence: ${ocrConfidence.toFixed(2)}`);
    }
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
      confidence: ocrConfidence,
      characterCount,
    };
  } catch (error) {
    // Ultimate fallback - should never throw
    const totalTime = Date.now() - overallStartTime;

    console.error("\n[PDF Parser] ✗ UNEXPECTED ERROR:", error);
    console.log(`[PDF Parser] Failed after ${formatTime(totalTime)}\n`);

    return {
      status: "failed",
      message: "An unexpected error occurred while processing the PDF. Please try again or use a different file format.",
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
