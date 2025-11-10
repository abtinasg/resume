/**
 * Robust PDF Parser for Resume Extraction
 *
 * Gracefully handles all types of resume PDFs including:
 * - Text-based PDFs (Word, Google Docs exports)
 * - Design-based PDFs (Canva, Enhancv, Resume.io)
 * - Scanned/image-based PDFs
 *
 * Features:
 * - Multi-stage extraction with fallbacks
 * - Intelligent text cleaning and normalization
 * - OCR for image-based content
 * - Never throws errors - always returns structured response
 * - Detailed logging for debugging
 */

import { createWorker } from "tesseract.js";

// Constants
const MIN_TEXT_LENGTH = 100; // Minimum characters for successful extraction
const METADATA_MIN_LENGTH = 200; // Minimum for metadata fallback warning
const PREVIEW_LENGTH = 250; // Characters to show in logs

// Response types
export interface PDFExtractionResult {
  status: "success" | "warning";
  message: string;
  text: string;
  method?: "pdf-parse" | "pdfjs" | "ocr" | "metadata";
  characterCount?: number;
}

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
  // More aggressive: catches all spaced-out words
  cleaned = cleaned.replace(/\b([A-Z])\s+(?=[A-Z]\b)/g, "$1");
  cleaned = cleaned.replace(/\b([a-z])\s+(?=[a-z]\b)/g, "$1");

  // Handle mixed case spaced letters
  cleaned = cleaned.replace(/([A-Za-z])\s+(?=[A-Za-z]\s+[A-Za-z])/g, "$1");

  return cleaned;
}

/**
 * Extract text from metadata/info objects as fallback
 */
function extractMetadataText(data: any): string {
  const parts: string[] = [];

  try {
    // Extract from metadata
    if (data.metadata) {
      Object.entries(data.metadata).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          // Skip common non-content metadata
          if (!["producer", "creator", "creationdate", "moddate"].includes(key.toLowerCase())) {
            parts.push(value.trim());
          }
        }
      });
    }

    // Extract from info
    if (data.info) {
      Object.entries(data.info).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim().length > 0) {
          // Skip common non-content metadata
          if (!["producer", "creator", "creationdate", "moddate"].includes(key.toLowerCase())) {
            parts.push(value.trim());
          }
        }
      });
    }

    // Try textContent if available
    if (data.textContent && typeof data.textContent === "string") {
      parts.push(data.textContent);
    }
  } catch (err) {
    console.warn("[PDF Parser] Error extracting metadata:", err);
  }

  return parts.join(" ").trim();
}

/**
 * Fallback 2: Use PDF.js for deep text extraction
 * Accesses low-level text content items and rebuilds text manually
 */
async function extractWithPDFJS(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log("[PDF Parser] Attempting PDF.js deep extraction...");

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

      // Build text from items
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both text items and whitespace items
          if ("str" in item) {
            return item.str;
          }
          return "";
        })
        .join(" ");

      textParts.push(pageText);
    }

    const fullText = textParts.join("\n");
    console.log(`[PDF Parser] PDF.js extracted ${fullText.length} characters`);

    return fullText;
  } catch (error) {
    console.error("[PDF Parser] PDF.js extraction failed:", error);
    return "";
  }
}

/**
 * Fallback 3: OCR extraction using Tesseract.js
 * Last resort for scanned or image-based PDFs
 */
async function extractWithOCR(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log("[PDF Parser] Attempting OCR extraction...");

    // Convert PDF to images first (requires pdf.js)
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = await import("canvas");

    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    // Create Tesseract worker
    const worker = await createWorker("eng");

    const textParts: string[] = [];

    // Process first 3 pages only (OCR is slow and expensive)
    const maxPages = Math.min(pdf.numPages, 3);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

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
        const { data: { text } } = await worker.recognize(imageBuffer);
        textParts.push(text);

        console.log(`[PDF Parser] OCR page ${pageNum}/${maxPages}: ${text.length} characters`);
      } catch (pageError) {
        console.error(`[PDF Parser] OCR failed on page ${pageNum}:`, pageError);
      }
    }

    await worker.terminate();

    const fullText = textParts.join("\n");
    console.log(`[PDF Parser] OCR extracted ${fullText.length} characters total`);

    return fullText;
  } catch (error) {
    console.error("[PDF Parser] OCR extraction failed:", error);
    return "";
  }
}

/**
 * Main extraction function with all fallbacks
 * Always resolves with a PDFExtractionResult (never throws)
 */
export async function extractTextFromBuffer(
  pdfBuffer: Buffer
): Promise<PDFExtractionResult> {
  try {
    console.log("\n=== PDF Parser: Starting Extraction ===");
    console.log(`[PDF Parser] Buffer size: ${pdfBuffer.length} bytes`);

    // ===== PRIMARY: pdf-parse =====
    let cleanText = "";
    let extractedText = "";
    let method: PDFExtractionResult["method"] = "pdf-parse";

    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(pdfBuffer);

      extractedText = data.text || "";
      cleanText = cleanExtractedText(extractedText);

      console.log(`[PDF Parser] pdf-parse: ${extractedText.length} raw → ${cleanText.length} cleaned characters`);

      // ===== FALLBACK 1: Metadata Merge =====
      if (cleanText.length < MIN_TEXT_LENGTH) {
        console.log("[PDF Parser] Text too short, trying metadata fallback...");

        const metadataText = extractMetadataText(data);
        const cleanedMetadata = cleanExtractedText(metadataText);

        if (cleanedMetadata.length > 0) {
          cleanText = `${cleanText} ${cleanedMetadata}`.trim();
          console.log(`[PDF Parser] After metadata merge: ${cleanText.length} characters`);
          method = "metadata";
        }

        if (cleanText.length < METADATA_MIN_LENGTH && cleanText.length >= MIN_TEXT_LENGTH) {
          console.warn(`[PDF Parser] Warning: Only ${cleanText.length} characters extracted from metadata`);
        }
      }
    } catch (parseError) {
      console.error("[PDF Parser] pdf-parse failed:", parseError);
    }

    // ===== FALLBACK 2: PDF.js Deep Extraction =====
    if (cleanText.length < MIN_TEXT_LENGTH) {
      const pdfjsText = await extractWithPDFJS(pdfBuffer);
      const cleanedPdfjsText = cleanExtractedText(pdfjsText);

      if (cleanedPdfjsText.length > cleanText.length) {
        cleanText = cleanedPdfjsText;
        method = "pdfjs";
        console.log(`[PDF Parser] PDF.js improved result: ${cleanText.length} characters`);
      }
    }

    // ===== FALLBACK 3: OCR (Last Resort) =====
    if (cleanText.length < MIN_TEXT_LENGTH) {
      console.log("[PDF Parser] Attempting OCR as last resort...");
      const ocrText = await extractWithOCR(pdfBuffer);
      const cleanedOcrText = cleanExtractedText(ocrText);

      if (cleanedOcrText.length > cleanText.length) {
        cleanText = cleanedOcrText;
        method = "ocr";
        console.log(`[PDF Parser] OCR improved result: ${cleanText.length} characters`);
      }
    }

    // ===== FINAL VALIDATION =====
    if (cleanText.length < MIN_TEXT_LENGTH) {
      console.warn(`[PDF Parser] All methods failed. Final text: ${cleanText.length} characters`);
      console.log(`[PDF Parser] Sample: "${cleanText}"`);

      return {
        status: "warning",
        message: "This PDF seems to be a design-based or scanned resume. Please export it as a text-based PDF (e.g. from Word or Google Docs).",
        text: "",
        method,
        characterCount: 0,
      };
    }

    // ===== SUCCESS =====
    const preview = cleanText.substring(0, PREVIEW_LENGTH);
    console.log(`[PDF Parser] ✅ Success with ${method}: ${cleanText.length} characters`);
    console.log(`[PDF Parser] Preview: ${preview}${cleanText.length > PREVIEW_LENGTH ? "..." : ""}`);
    console.log("=== PDF Parser: Extraction Complete ===\n");

    return {
      status: "success",
      message: "Text extracted successfully.",
      text: cleanText,
      method,
      characterCount: cleanText.length,
    };

  } catch (error) {
    // Ultimate fallback - should never throw
    console.error("[PDF Parser] Unexpected error:", error);

    return {
      status: "warning",
      message: "An unexpected error occurred while processing the PDF. Please try again or use a different file format.",
      text: "",
      characterCount: 0,
    };
  }
}

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
        status: "warning",
        message: "Invalid or empty PDF data provided.",
        text: "",
        characterCount: 0,
      };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0) {
      console.error("[PDF Parser] Failed to decode base64 PDF data");
      return {
        status: "warning",
        message: "Failed to decode PDF data. Please check the file format.",
        text: "",
        characterCount: 0,
      };
    }

    return await extractTextFromBuffer(buffer);
  } catch (error) {
    console.error("[PDF Parser] Base64 conversion error:", error);
    return {
      status: "warning",
      message: "Failed to process base64 PDF data.",
      text: "",
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
