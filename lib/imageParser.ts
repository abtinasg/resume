"use server";

import type { PDFExtractionResult } from '@/lib/pdfParser';
import { cleanExtractedText } from '@/lib/textCleanup';

const MIN_SUCCESS_LENGTH = 50;
const MIN_PARTIAL_LENGTH = 15;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // matches the upload limit in /api/analyze
const OCR_TIMEOUT_MS = 30_000;

/**
 * Formats tesseract can read, identified by their leading bytes so a renamed
 * or malformed file is rejected before OCR starts.
 */
function isSupportedImage(buffer: Buffer): boolean {
  const startsWith = (bytes: number[], offset = 0) =>
    bytes.every((byte, i) => buffer[offset + i] === byte);

  return (
    startsWith([0xff, 0xd8, 0xff]) || // JPEG
    startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
    (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) || // WEBP
    startsWith([0x47, 0x49, 0x46, 0x38]) || // GIF
    startsWith([0x42, 0x4d]) // BMP
  );
}

function failed(message: string): PDFExtractionResult {
  return { status: 'failed', message, text: '', method: 'fallback', characterCount: 0 };
}

export async function extractTextFromBase64Image(
  base64String: string
): Promise<PDFExtractionResult> {
  try {
    const base64Data = base64String.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

    if (!base64Data || base64Data.length === 0) {
      return {
        status: 'failed',
        message: 'Invalid or empty image data provided.',
        text: '',
        method: 'fallback',
        characterCount: 0,
      };
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      return {
        status: 'failed',
        message: 'Failed to decode image data. Please retake the photo.',
        text: '',
        method: 'fallback',
        characterCount: 0,
      };
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
      return failed(`This image is larger than ${MAX_IMAGE_BYTES / (1024 * 1024)}MB. Please retake the photo at a lower resolution.`);
    }
    if (!isSupportedImage(buffer)) {
      return failed('Unsupported image format. Please use a JPEG or PNG photo.');
    }

    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let recognized;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`OCR timed out after ${OCR_TIMEOUT_MS}ms`)), OCR_TIMEOUT_MS);
      });
      recognized = await Promise.race([worker.recognize(buffer), timeout]);
    } finally {
      clearTimeout(timer);
      // Terminating also stops a recognize call that timed out.
      await worker.terminate();
    }
    const { text, confidence } = recognized.data;

    const cleanedText = cleanExtractedText(text);
    const characterCount = cleanedText.length;

    let status: PDFExtractionResult['status'];
    let message: string;

    if (characterCount >= MIN_SUCCESS_LENGTH) {
      status = 'success';
      message = 'Text extracted successfully from image.';
    } else if (characterCount >= MIN_PARTIAL_LENGTH) {
      status = 'partial';
      message = `Limited text extracted from image (${characterCount} characters).`;
    } else {
      status = 'failed';
      message = 'Unable to extract enough text from the image. Please try again with better lighting.';
    }

    return {
      status,
      message,
      text: cleanedText,
      method: 'ocr',
      confidence: typeof confidence === 'number' ? confidence / 100 : undefined,
      characterCount,
    };
  } catch (error) {
    console.error('[Image Parser] Extraction failed:', error);
    return {
      status: 'failed',
      message: 'Failed to process the captured image.',
      text: '',
      method: 'fallback',
      characterCount: 0,
    };
  }
}
