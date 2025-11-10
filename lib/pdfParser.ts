import { PDFParse } from 'pdf-parse';

export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<string> {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();

    if (!result.text || result.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    return result.text.trim();
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
    const base64Data = base64String.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    return await extractTextFromPDF(buffer);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Base64 PDF parsing failed: ${error.message}`);
    }
    throw new Error('Base64 PDF parsing failed: Unknown error');
  }
}
