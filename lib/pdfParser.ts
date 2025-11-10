/**
 * PDF Parser with dynamic import for Next.js compatibility
 * Uses pdf-parse to extract text from PDF buffers
 */

export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<string> {
  try {
    // Dynamic import to avoid Next.js build issues with pdf-parse
    const pdfParse = (await import('pdf-parse')).default;

    const data = await pdfParse(pdfBuffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    return data.text.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
    throw new Error('PDF parsing failed: Unknown error');
  }
}

export async function extractTextFromBase64PDF(
  base64String: string
): Promise<string> {
  try {
    // Remove data URI prefix if present
    const base64Data = base64String.replace(
      /^data:application\/pdf;base64,/,
      ''
    );

    // Validate base64 string
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Invalid or empty base64 string');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length === 0) {
      throw new Error('Failed to decode base64 PDF data');
    }

    return await extractTextFromPDF(buffer);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Base64 PDF parsing failed: ${error.message}`);
    }
    throw new Error('Base64 PDF parsing failed: Unknown error');
  }
}
