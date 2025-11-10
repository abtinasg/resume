/**
 * PDF Parser with dynamic import for Next.js compatibility
 * Uses pdf-parse to extract text from PDF buffers
 *
 * Features:
 * - Multi-column layout handling
 * - Aggressive whitespace cleaning
 * - Metadata fallback for problematic PDFs
 * - Broken spacing auto-merge
 * - Safe error handling with fallback messages
 * - Debug logging for QA
 */

const MIN_TEXT_LENGTH = 30;
const FALLBACK_MESSAGE = "[Empty or non-readable PDF file — please upload a text-based resume]";

/**
 * Clean extracted text by removing layout artifacts and excessive whitespace
 */
function cleanExtractedText(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Remove invisible/non-printable characters (keep basic ASCII + newline/return)
    .replace(/[^\x20-\x7E\n\r]/g, "")
    // Collapse multiple whitespace characters into single space
    .replace(/\s+/g, " ")
    // Collapse multiple newlines
    .replace(/\n+/g, " ")
    // Remove tabs
    .replace(/\t+/g, " ")
    // Trim
    .trim();

  // Fix broken spacing (e.g., "R e s u m e" -> "Resume")
  // Only merge single spaces between individual letters
  cleaned = cleaned.replace(/\b([a-zA-Z])\s(?=[a-zA-Z]\b)/g, "$1");

  return cleaned;
}

/**
 * Extract text from metadata/info objects as fallback
 */
function extractMetadataText(data: any): string {
  const parts: string[] = [];

  try {
    // Try to extract from metadata
    if (data.metadata) {
      Object.values(data.metadata).forEach((value) => {
        if (typeof value === "string" && value.trim().length > 0) {
          parts.push(value.trim());
        }
      });
    }

    // Try to extract from info
    if (data.info) {
      Object.values(data.info).forEach((value) => {
        if (typeof value === "string" && value.trim().length > 0) {
          parts.push(value.trim());
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
 * Extract text from PDF buffer with robust error handling
 * Always returns a string (never throws)
 */
export async function extractTextFromBuffer(
  pdfBuffer: Buffer
): Promise<string> {
  try {
    // Dynamic import to avoid Next.js build issues with pdf-parse
    const pdfParse = (await import("pdf-parse")).default;

    const data = await pdfParse(pdfBuffer);

    // Extract and clean primary text
    let cleanText = cleanExtractedText(data.text || "");

    console.log(`[PDF Parser] Initial extraction: ${cleanText.length} characters`);

    // If text is too short, try metadata fallback
    if (cleanText.length < MIN_TEXT_LENGTH) {
      console.log("[PDF Parser] Text too short, trying metadata fallback...");

      const metadataText = extractMetadataText(data);
      const cleanedMetadata = cleanExtractedText(metadataText);

      if (cleanedMetadata.length > 0) {
        // Combine main text with metadata
        cleanText = `${cleanText} ${cleanedMetadata}`.trim();
        console.log(`[PDF Parser] After metadata fallback: ${cleanText.length} characters`);
      }
    }

    // Final check: if still too short, return fallback message
    if (cleanText.length < MIN_TEXT_LENGTH) {
      console.warn("[PDF Parser] Extracted text still too short, using fallback");
      console.log(`[PDF Parser Sample] "${cleanText}"`);
      return FALLBACK_MESSAGE;
    }

    // Success! Log sample for debugging
    console.log(`[PDF Parser] Extracted ${cleanText.length} characters`);
    console.log(`[PDF Parser Sample] ${cleanText.substring(0, 250)}...`);

    return cleanText;
  } catch (error) {
    // Never throw - always return a usable string
    console.error("[PDF Parser] Extraction error:", error);
    if (error instanceof Error) {
      console.error("[PDF Parser] Error details:", error.message);
    }
    return FALLBACK_MESSAGE;
  }
}

/**
 * Extract text from base64-encoded PDF string
 */
export async function extractTextFromBase64PDF(
  base64String: string
): Promise<string> {
  try {
    // Remove data URI prefix if present
    const base64Data = base64String.replace(
      /^data:application\/pdf;base64,/,
      ""
    );

    // Validate base64 string
    if (!base64Data || base64Data.length === 0) {
      console.error("[PDF Parser] Invalid or empty base64 string");
      return FALLBACK_MESSAGE;
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0) {
      console.error("[PDF Parser] Failed to decode base64 PDF data");
      return FALLBACK_MESSAGE;
    }

    return await extractTextFromBuffer(buffer);
  } catch (error) {
    console.error("[PDF Parser] Base64 conversion error:", error);
    return FALLBACK_MESSAGE;
  }
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use extractTextFromBuffer instead
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<string> {
  return extractTextFromBuffer(pdfBuffer);
}
