'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  onTextPaste: (text: string) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  onFileSelect,
  onTextPaste,
}) => {
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError('');

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Please upload a PDF file only.');
        } else if (rejection.errors[0]?.code === 'file-too-large') {
          setError('File size must be less than 5MB.');
        } else {
          setError('Failed to upload file. Please try again.');
        }
        return;
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Double-check file size
        if (file.size > MAX_FILE_SIZE) {
          setError('File size must be less than 5MB.');
          return;
        }

        setIsUploading(true);

        // Simulate processing delay (in real app, this would be actual processing)
        setTimeout(() => {
          onFileSelect(file);
          setIsUploading(false);
        }, 1000);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isUploading,
  });

  const handleTextSubmit = () => {
    if (!pastedText.trim()) {
      setError('Please paste some text first.');
      return;
    }

    setError('');
    setIsUploading(true);

    setTimeout(() => {
      onTextPaste(pastedText);
      setIsUploading(false);
    }, 500);
  };

  const handleTryExample = () => {
    const exampleResume = `John Doe
Senior Software Engineer
john.doe@email.com | (555) 123-4567

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020-Present
- Led development of microservices architecture serving 1M+ users
- Reduced API response time by 40% through optimization
- Mentored team of 5 junior engineers

Software Engineer | StartupXYZ | 2018-2020
- Built and maintained React-based web applications
- Implemented CI/CD pipelines reducing deployment time by 60%
- Collaborated with cross-functional teams on product features

EDUCATION
Bachelor of Science in Computer Science | University Name | 2018

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker`;

    setPastedText(exampleResume);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#111827]">
            Upload Your Resume
          </h2>
          <p className="text-sm text-gray-600">
            Get instant AI-powered feedback to improve your resume
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert message={error} mode="error" />
        )}

        {/* Dropzone Area */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${
              isDragActive
                ? 'border-[#3B82F6] bg-blue-50 scale-[1.02]'
                : 'border-gray-300 hover:border-[#3B82F6] hover:bg-gray-50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <svg
                  className="animate-spin h-10 w-10 text-[#3B82F6]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <p className="text-[#3B82F6] font-medium">Processing...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Document Icon */}
              <div className="flex justify-center">
                <svg
                  className="w-12 h-12 text-[#3B82F6]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              {/* Text */}
              <div className="space-y-1">
                <p className="text-[#111827] font-medium">
                  {isDragActive ? (
                    'Drop your resume here'
                  ) : (
                    <>
                      <span className="text-[#3B82F6]">Click to upload</span> or
                      drag & drop
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500">PDF only (Max 5MB)</p>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              or paste your resume below
            </span>
          </div>
        </div>

        {/* Textarea */}
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value);
              setError('');
            }}
            placeholder="Paste your resume text here..."
            disabled={isUploading}
            className="w-full min-h-[200px] max-h-[400px] px-4 py-3 border border-gray-300 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-[#111827] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleTextSubmit}
              disabled={isUploading || !pastedText.trim()}
              className="flex-1"
            >
              {isUploading ? 'Processing...' : 'Analyze Resume'}
            </Button>

            <Button
              variant="secondary"
              onClick={handleTryExample}
              disabled={isUploading}
            >
              Try Example
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
