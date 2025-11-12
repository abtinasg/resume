'use client';

import React, { useState, useCallback, useRef } from 'react';
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
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes for mobile captures

  const isPdfFile = uploadedFile?.type === 'application/pdf';
  const isImageFile = uploadedFile?.type?.startsWith('image/');

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

  // Convert file to data URL for PDF preview
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle API call to analyze resume
  const analyzeResume = useCallback(async (
    text: string,
    format: 'text' | 'pdf' | 'image',
    previewUrl?: string
  ) => {
    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        credentials: 'include',
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
        // Add PDF URL if available
        if (format === 'pdf' && previewUrl) {
          transformedData.pdfUrl = previewUrl;
        }
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
          case 'IMAGE_EXTRACTION_FAILED':
            setError('We could not read your photo. Please retake the picture in good lighting.');
            break;
          case 'IMAGE_INSUFFICIENT_CONTENT':
            setError('The captured photo did not contain enough readable text. Try again with a clearer photo.');
            break;
          case 'IMAGE_TEXT_TOO_LARGE':
            setError('The captured resume text is too long to analyze. Please capture fewer pages or upload a PDF.');
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

  const handleCameraCapture = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setError('');
    setUploadProgress(0);
    setProcessingStep('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please capture a valid image file.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Photo size must be less than 10MB.');
      event.target.value = '';
      return;
    }

    setUploadedFile(file);
    setPdfDataUrl('');
    setImagePreviewUrl('');
    setUploadProgress(20);
    setProcessingStep('Processing photo...');

    try {
      const base64Content = await fileToBase64(file);
      setUploadProgress(40);
      setProcessingStep('Improving clarity...');

      const dataUrl = await fileToDataUrl(file);
      setImagePreviewUrl(dataUrl);
      setUploadProgress(60);
      setProcessingStep('Extracting text...');

      setUploadProgress(80);
      setProcessingStep('Starting analysis...');

      await analyzeResume(base64Content, 'image');
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
      setUploadProgress(0);
      setProcessingStep('');
      setUploadedFile(null);
      setImagePreviewUrl('');
    } finally {
      event.target.value = '';
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError('');
      setUploadProgress(0);
      setProcessingStep('');
      setImagePreviewUrl('');

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

        // Instant preview - set file immediately
        setUploadedFile(file);
        setUploadProgress(10);
        setProcessingStep('File received');

        try {
          // Simulate upload progress
          setUploadProgress(30);
          setProcessingStep('Reading PDF...');

          // Convert PDF to base64 for analysis
          const base64Content = await fileToBase64(file);
          setUploadProgress(50);
          setProcessingStep('Generating preview...');

          // Convert PDF to data URL for preview
          const dataUrl = await fileToDataUrl(file);
          setPdfDataUrl(dataUrl);
        setUploadProgress(70);
        setProcessingStep('Starting analysis...');

        await analyzeResume(base64Content, 'pdf', dataUrl);
      } catch (err) {
          console.error('Error processing file:', err);
          setError('Failed to process PDF file. Please try again.');
          setUploadProgress(0);
          setProcessingStep('');
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
    setPdfDataUrl('');
    setImagePreviewUrl('');
    setUploadProgress(0);
    setProcessingStep('');
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
      <div className="w-full max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
            staggerChildren: 0.1
          }}
          className="relative"
        >
          {/* Ambient success glow - Apple style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute -inset-8 bg-gradient-to-r from-emerald-500/10 via-green-400/10 to-teal-500/10 blur-3xl"
          />

          {/* Glass morphism success card */}
          <div className="relative backdrop-blur-xl bg-white/80 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-[28px] p-8 md:p-12 space-y-8 overflow-hidden">
            {/* Subtle top gradient bar - Apple style */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />

            {/* Success icon with ring animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay: 0.2
              }}
              className="flex justify-center"
            >
              <div className="relative">
                {/* Outer ring with pulse */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 blur-xl opacity-40"
                />

                {/* Main icon container */}
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center ring-[3px] ring-emerald-100/50 shadow-[0_8px_30px_rgba(16,185,129,0.2)]">
                  <motion.svg
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      pathLength: { duration: 0.6, delay: 0.4, ease: "easeOut" },
                      opacity: { duration: 0.3, delay: 0.4 }
                    }}
                    className="w-12 h-12 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path d="M5 13l4 4L19 7" />
                  </motion.svg>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-4 text-center"
            >
              <h2 className="font-grotesk text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Analysis Complete
              </h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
                Your resume has been analyzed with precision. Discover actionable insights below.
              </p>
            </motion.div>

            {/* Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex justify-center pt-2"
            >
              <motion.button
                onClick={handleAnalyzeAnother}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.16)] transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Analyze Another Resume</span>
                <motion.svg
                  className="relative z-10 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>

                {/* Gradient overlay on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.button>
            </motion.div>

            {/* Subtle decoration dots - Apple style */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-2xl" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-green-100/30 to-emerald-100/30 rounded-full blur-2xl" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Ambient glow - subtle Apple-style lighting */}
        <div className="absolute -inset-8 bg-gradient-to-r from-brand-indigo/8 via-purple-500/6 to-brand-teal/8 blur-3xl" />

        {/* Glass morphism main card */}
        <div className="relative backdrop-blur-xl bg-white/80 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-[28px] p-8 md:p-10 space-y-8 overflow-hidden">
          {/* Subtle gradient bar at top - Apple style accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-indigo/40 to-transparent" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center space-y-3"
          >
            <h2 className="font-grotesk text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Upload Your Resume
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
              Get instant AI-powered insights to elevate your career story
            </p>
          </motion.div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert message={error} mode="error" />
            </motion.div>
          )}

          {/* Instant File Preview - Shows immediately when file is uploaded */}
          {uploadedFile && !isAnalyzing && !analysisComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="backdrop-blur-sm bg-white/60 border border-gray-200/80 rounded-[20px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {isImageFile ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm ring-1 ring-emerald-100/60 bg-emerald-50">
                        {imagePreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreviewUrl}
                            alt="Captured resume preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-500">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 7h3l2-3h6l2 3h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" />
                              <circle cx="12" cy="13" r="3" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {uploadedFile.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {(uploadedFile.size / 1024).toFixed(1)} KB •
                      {isImageFile
                        ? ' Captured Photo'
                        : isPdfFile
                          ? ' PDF Document'
                          : ` ${uploadedFile.type || 'File'}`}
                    </p>

                    {/* Upload Progress Bar */}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-brand-indigo font-medium">{processingStep}</span>
                          <span className="text-gray-500">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-brand-indigo to-brand-teal rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Success Checkmark */}
                  {uploadProgress >= 70 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="flex-shrink-0"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Show LoadingProgress when analyzing */}
          {isAnalyzing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <LoadingProgress />
            </motion.div>
          ) : (
            <>
              {/* Mobile camera capture option */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                <div className="relative overflow-hidden rounded-2xl border border-brand-indigo/15 bg-white/70 backdrop-blur-sm p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 text-left space-y-1.5">
                      <p className="text-sm font-semibold text-gray-900">
                        Capture with your phone
                      </p>
                      <p className="text-xs text-gray-500">
                        Snap a clear photo of your printed resume. Works best in bright, even lighting on a flat surface.
                      </p>
                    </div>
                    <Button
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="min-w-[180px]"
                    >
                      Use mobile camera
                    </Button>
                  </div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                </div>
              </motion.div>

              {/* Dropzone Area - Apple-inspired with glass morphism */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            className="relative"
          >
            {/* Subtle glow on interaction */}
            <motion.div
              animate={{
                opacity: isDragActive ? 0.4 : 0,
                scale: isDragActive ? 1 : 0.95
              }}
              transition={{ duration: 0.3 }}
              className="absolute -inset-2 bg-gradient-to-r from-brand-indigo/20 via-purple-500/20 to-brand-teal/20 rounded-[32px] blur-xl"
            />

            <div
              {...getRootProps()}
              className={`
                group relative border-2 border-dashed rounded-[24px] p-10 md:p-12 text-center cursor-pointer
                transition-all duration-300 ease-out backdrop-blur-sm overflow-hidden
                ${
                  isDragActive
                    ? 'border-brand-indigo/60 bg-brand-indigo/5 shadow-[0_8px_32px_rgba(79,70,229,0.15)] scale-[1.01]'
                    : 'border-gray-300/60 hover:border-brand-indigo/50 hover:bg-gray-50/50 hover:scale-[1.01]'
                }
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />

              {/* Floating gradient orbs in background - subtle Apple style */}
              <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-brand-teal/10 to-transparent rounded-full blur-2xl" />
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-brand-indigo/10 to-transparent rounded-full blur-2xl" />

              <div className="relative space-y-6">
                {/* Document Icon - refined Apple-style */}
                <motion.div
                  className="flex justify-center"
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="relative">
                    {/* Icon background with subtle gradient */}
                    <motion.div
                      animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: isDragActive ? Infinity : 0 }}
                      className="absolute inset-0 bg-gradient-to-br from-brand-indigo/20 via-purple-400/10 to-brand-teal/20 rounded-2xl blur-xl"
                    />

                    <div className="relative w-20 h-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] ring-1 ring-gray-100/50">
                      <svg
                        className={`w-10 h-10 transition-colors duration-300 ${
                          isDragActive ? 'text-brand-indigo' : 'text-gray-400 group-hover:text-brand-indigo'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Text content - refined typography */}
                <div className="space-y-3">
                  <div className="text-gray-900 font-semibold text-lg">
                    {isDragActive ? (
                      <motion.span
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-brand-indigo"
                      >
                        Drop your resume here
                      </motion.span>
                    ) : (
                      <>
                        <span className="text-brand-indigo">Click to upload</span>
                        <span className="text-gray-600"> or drag and drop</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    PDF only • Max 5MB (use mobile capture above for photos)
                  </p>
                </div>

                {/* Status indicator - appears on hover */}
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{
                    opacity: isDragActive ? 1 : 0,
                    y: isDragActive ? 0 : 4
                  }}
                  className="flex justify-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-indigo/10 backdrop-blur-sm rounded-full border border-brand-indigo/20">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 bg-brand-indigo rounded-full"
                    />
                    <span className="text-xs text-brand-indigo font-semibold">Ready to analyze</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Separator - refined Apple style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative py-2"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white/80 backdrop-blur-sm text-sm font-medium text-gray-500">
                or paste your resume below
              </span>
            </div>
          </motion.div>

          {/* Textarea - Apple-inspired with glass effect */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="relative">
              {/* Subtle focus glow */}
              <motion.div
                initial={false}
                animate={{
                  opacity: pastedText ? 0.3 : 0,
                  scale: pastedText ? 1 : 0.95
                }}
                className="absolute -inset-1 bg-gradient-to-r from-brand-indigo/20 to-brand-teal/20 rounded-[20px] blur-xl"
              />

              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  setError('');
                }}
                placeholder="Paste your resume text here..."
                disabled={isAnalyzing}
                className="relative w-full min-h-[220px] max-h-[400px] px-5 py-4 border border-gray-200/80 rounded-[18px] resize-y
                          focus:outline-none focus:ring-2 focus:ring-brand-indigo/30 focus:border-brand-indigo/50
                          text-gray-900 text-[15px] leading-relaxed
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-300
                          placeholder:text-gray-400
                          backdrop-blur-sm bg-white/60
                          shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                          hover:border-gray-300/80"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
              />
            </div>

            {/* Buttons - refined Apple style */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <button
                  onClick={handleTextSubmit}
                  disabled={isAnalyzing || !pastedText.trim()}
                  className={`
                    w-full group relative inline-flex items-center justify-center gap-2
                    px-6 py-3.5 rounded-[14px] font-semibold text-[15px]
                    transition-all duration-300 overflow-hidden
                    ${
                      isAnalyzing || !pastedText.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.16)] hover:-translate-y-0.5'
                    }
                  `}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Resume</span>
                      <motion.svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        animate={{ x: [0, 3, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </motion.svg>
                    </>
                  )}
                </button>
              </motion.div>

              <motion.button
                onClick={handleTryExample}
                disabled={isAnalyzing}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="px-6 py-3.5 rounded-[14px] font-semibold text-[15px]
                          border border-gray-200 text-gray-700 bg-white/60 backdrop-blur-sm
                          hover:border-gray-300 hover:bg-white/80 hover:-translate-y-0.5
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-300
                          shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                Try Example
              </motion.button>
            </div>
          </motion.div>
            </>
          )}

          {/* Subtle bottom decoration */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-to-t from-brand-indigo/5 to-transparent rounded-full blur-2xl" />
        </div>
      </motion.div>
    </div>
  );
};

export default UploadSection;
