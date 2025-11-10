'use client';

import { motion } from 'framer-motion';
import UploadSection from '@/components/UploadSection';

export default function Home() {
  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name);
    // TODO: Process the uploaded file
  };

  const handleTextPaste = (text: string) => {
    console.log('Text pasted, length:', text.length);
    // TODO: Process the pasted text
  };

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFB] to-[#FFFFFF] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 md:px-12 pt-20 pb-16 sm:pt-32 sm:pb-24">
          <div className="text-center space-y-8">
            {/* Logo/Brand with glow effect */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as any, delay: 0.1 }}
              className="inline-block"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 blur-xl opacity-30 rounded-full" />
                <h1 className="relative text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  ResumeIQ
                </h1>
              </div>
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as any, delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
                Get AI-Powered Resume Feedback{' '}
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  in Seconds
                </span>{' '}
                <span className="inline-block">⚡</span>
              </h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as any, delay: 0.4 }}
                className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
              >
                Upload your resume and receive expert insights instantly. Powered by advanced AI to help you land your dream job.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as any, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                onClick={scrollToUpload}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-100 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full sm:w-auto text-sm md:text-base"
              >
                <span className="relative z-10">Analyze Your Resume</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button
                onClick={scrollToUpload}
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-500 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full sm:w-auto text-sm md:text-base"
              >
                Try Demo
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as any, delay: 0.7 }}
              className="pt-8"
            >
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Instant results</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>AI-powered</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Upload Section - Integrated elegantly with glow effect */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] as any, delay: 0.2 }}
          id="upload-section"
          className="py-16"
        >
          <div className="max-w-4xl mx-auto px-6 md:px-12 relative">
            <UploadSection
              onFileSelect={handleFileSelect}
              onTextPaste={handleTextPaste}
            />

            {/* Trust message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as any, delay: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Your resume is processed securely and never stored.</span>
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer Section */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as any }}
          className="border-t border-gray-100 bg-white/80 backdrop-blur-sm shadow-sm mt-24"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-6" />
              <p className="text-sm text-gray-400 font-normal">
                Built with ❤️ using Next.js, TailwindCSS & OpenAI
              </p>
              <p className="text-sm text-gray-400 font-normal">
                © 2025 ResumeIQ. All rights reserved.
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
