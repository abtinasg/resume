'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import LoadingProgress from '@/components/LoadingProgress';
import type { AnalysisResult, ApiAnalysisResponse } from '@/lib/types/analysis';
import { transformApiToAnalysisResult } from '@/lib/transformAnalysis';

interface UploadSectionProps {
  onAnalyzeComplete: (data: AnalysisResult) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyzeComplete,
}) => {
  const [error, setError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle API call to analyze resume
  const analyzeResume = useCallback(async (text: string, format: 'text' | 'pdf') => {
    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: text,
          format: format,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Transform unified hybrid API response to UI format
        const transformedData = transformApiToAnalysisResult(result);
        setAnalysisComplete(true);
        onAnalyzeComplete(transformedData);
      } else {
        // Handle error responses with user-friendly messages
        const errorCode = result.error?.code || 'UNKNOWN_ERROR';
        const errorMessage = result.error?.message || 'An unexpected error occurred';

        switch (errorCode) {
          case 'VALIDATION_ERROR':
            setError('Your resume text is too short. Please provide more content.');
            break;
          case 'OPENAI_ERROR':
            setError('AI analysis service is currently unavailable. Please try again.');
            break;
          case 'PDF_PARSE_ERROR':
          case 'PDF_TOO_LARGE':
          case 'PDF_INSUFFICIENT_CONTENT':
            setError('Invalid file format or file too large. Please try a different file.');
            break;
          default:
            setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalyzeComplete]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
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

        setUploadedFile(file);

        try {
          // Convert PDF to base64 and analyze
          const base64Content = await fileToBase64(file);
          await analyzeResume(base64Content, 'pdf');
        } catch (err) {
          console.error('Error processing file:', err);
          setError('Failed to process PDF file. Please try again.');
        }
      }
    },
    [MAX_FILE_SIZE, analyzeResume]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isAnalyzing || analysisComplete,
  });

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) {
      setError('Please paste some text first.');
      return;
    }

    await analyzeResume(pastedText, 'text');
  };

  const handleAnalyzeAnother = () => {
    setAnalysisComplete(false);
    setError('');
    setPastedText('');
    setUploadedFile(null);
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

  // If analysis is complete, show success message and "Analyze Another" button
  if (analysisComplete) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8">
        <div className="relative">
          {/* Blue glow effect behind the card */}
          <div className="absolute inset-0 bg-blue-100/40 blur-3xl opacity-50 rounded-3xl" />

          {/* Success card */}
          <div className="relative bg-white shadow-lg rounded-2xl p-6 md:p-8 space-y-6 text-center">
            {/* Success icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
                Analysis Complete!
              </h2>
              <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                Your resume has been analyzed successfully. Scroll down to see the results.
              </p>
            </div>

            <Button onClick={handleAnalyzeAnother}>
              Analyze Another Resume
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Show LoadingProgress when analyzing */}
          {isAnalyzing ? (
            <LoadingProgress />
          ) : (
            <>
          {/* Dropzone Area with Enhanced Microinteractions */}
          <div className="relative">
            {/* Ambient glow on hover/drag */}
            <div
              className={`absolute -inset-1 bg-gradient-to-r from-brand-indigo to-brand-teal rounded-3xl opacity-0 blur-xl transition-all duration-500 ${
                isDragActive ? 'opacity-30' : 'group-hover:opacity-20'
              }`}
            />

            <div
              {...getRootProps()}
              className={`
                group relative border-2 border-dashed rounded-3xl p-8 md:p-10 text-center cursor-pointer
                transition-all duration-500 ease-out overflow-hidden
                ${
                  isDragActive
                    ? 'border-brand-indigo bg-brand-indigo/5 scale-[1.02] shadow-glow'
                    : 'border-gray-300 hover:border-brand-indigo hover:bg-gray-50 hover:scale-[1.01]'
                }
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />

              <div className="space-y-4">
                  {/* Document Icon with enhanced hover animation */}
                  <motion.div
                    className="flex justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="relative">
                      <svg
                        className="w-16 h-16 text-brand-indigo transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 bg-brand-indigo/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </motion.div>

                  {/* Text */}
                  <div className="space-y-2">
                    <p className="text-gray-900 font-semibold text-base md:text-lg">
                      {isDragActive ? (
                        <motion.span
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1.05 }}
                          transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
                          className="text-brand-indigo"
                        >
                          Drop your resume here
                        </motion.span>
                      ) : (
                        <>
                          <span className="text-brand-indigo hover:text-brand-teal transition-colors duration-300">Click to upload</span> or drag & drop
                        </>
                      )}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">PDF only (Max 5MB)</p>
                  </div>

                  {/* Upload hint on hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="pt-2"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-indigo/5 rounded-full border border-brand-indigo/20">
                      <div className="w-2 h-2 bg-brand-indigo rounded-full animate-pulse" />
                      <span className="text-xs text-brand-indigo font-medium">Ready to analyze</span>
                    </div>
                  </motion.div>
                </div>
            </div>
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
              disabled={isAnalyzing}
              className="w-full min-h-[200px] max-h-[400px] px-4 py-3 border border-gray-300 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all placeholder:text-gray-400"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.div className="flex-1">
                <Button
                  onClick={handleTextSubmit}
                  disabled={isAnalyzing || !pastedText.trim()}
                  className="w-full group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Resume
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                  {/* Pulse effect on hover when enabled */}
                  {!isAnalyzing && pastedText.trim() && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-brand-indigo to-purple-600 opacity-0 group-hover:opacity-100"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Button>
              </motion.div>

              <Button
                variant="secondary"
                onClick={handleTryExample}
                disabled={isAnalyzing}
              >
                Try Example
              </Button>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
