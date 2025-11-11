'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ResumePreviewProps {
  pdfUrl?: string;
}

export default function ResumePreview({ pdfUrl }: ResumePreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError('');
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  }

  // If no PDF URL provided, show placeholder
  if (!pdfUrl) {
    return (
      <div className="bg-gray-50 rounded-xl shadow-inner h-[90vh] max-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <svg
            className="w-20 h-20 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">No PDF Preview Available</h3>
            <p className="text-sm text-gray-500">
              Upload a PDF resume to see the preview here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl shadow-inner overflow-hidden h-[90vh] max-h-[80vh] flex flex-col">
      {/* Header with controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Resume Preview</h3>
        {numPages > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-600 font-medium min-w-[60px] text-center">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="text-sm text-gray-500">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3 max-w-sm">
              <svg
                className="w-16 h-16 mx-auto text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-800">Failed to Load PDF</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error=""
          className="flex flex-col items-center gap-4"
        >
          {numPages > 1 ? (
            <Page
              pageNumber={pageNumber}
              width={Math.min(450, window.innerWidth - 100)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg rounded-lg overflow-hidden bg-white"
            />
          ) : (
            // Render all pages if single page or loading complete
            Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={Math.min(450, window.innerWidth - 100)}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg rounded-lg overflow-hidden bg-white"
              />
            ))
          )}
        </Document>
      </div>
    </div>
  );
}
