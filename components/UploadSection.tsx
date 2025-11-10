'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
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
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      <div className="relative">
        {/* Blue glow effect behind the card */}
        <div className="absolute inset-0 bg-blue-100/40 blur-3xl opacity-50 rounded-3xl" />

        {/* Main card */}
        <div className="relative bg-white shadow-lg rounded-2xl p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
              Upload Your Resume
            </h2>
            <p className="text-sm md:text-base text-gray-500 leading-relaxed">
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
              relative border-2 border-dashed rounded-2xl p-8 md:p-10 text-center cursor-pointer
              transition-all duration-300 ease-out
              ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50/40 scale-[1.02] shadow-md'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />

            {isUploading ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <svg
                    className="animate-spin h-12 w-12 text-blue-500"
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
                <p className="text-blue-500 font-medium">Processing...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Document Icon with hover animation */}
                <motion.div
                  className="flex justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <svg
                    className="w-14 h-14 text-blue-500"
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
                </motion.div>

                {/* Text */}
                <div className="space-y-1">
                  <p className="text-gray-900 font-medium text-base md:text-lg">
                    {isDragActive ? (
                      'Drop your resume here'
                    ) : (
                      <>
                        <span className="text-blue-500">Click to upload</span> or
                        drag & drop
                      </>
                    )}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">PDF only (Max 5MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                or paste your resume below
              </span>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-4">
            <textarea
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                setError('');
              }}
              placeholder="Paste your resume text here..."
              disabled={isUploading}
              className="w-full min-h-[200px] max-h-[400px] px-4 py-3 border border-gray-300 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-gray-400"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            />

            <div className="flex flex-col sm:flex-row gap-3">
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
    </div>
  );
};

export default UploadSection;
