"use server";

import type { PDFExtractionResult } from '@/lib/pdfParser';

const MIN_SUCCESS_LENGTH = 50;
const MIN_PARTIAL_LENGTH = 15;

function cleanExtractedText(text: string): string {
  if (!text) return '';

  let cleaned = text
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\t+/g, ' ')
    .trim();

  cleaned = cleaned.replace(/\b([A-Z])\s+(?=[A-Z]\b)/g, '$1');
  cleaned = cleaned.replace(/\b([a-z])\s+(?=[a-z]\b)/g, '$1');
  cleaned = cleaned.replace(/([A-Za-z])\s+(?=[A-Za-z]\s+[A-Za-z])/g, '$1');

  return cleaned;
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

    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng');
    const {
      data: { text, confidence },
    } = await worker.recognize(buffer);
    await worker.terminate();

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
