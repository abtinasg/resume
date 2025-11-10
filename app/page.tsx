'use client';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 sm:pt-32 sm:pb-24">
          <div className="text-center space-y-8">
            {/* Logo/Brand with glow effect */}
            <div className="inline-block opacity-0 animate-fadeIn [animation-delay:100ms] [animation-fill-mode:forwards]">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-xl opacity-30 rounded-full" />
                <h1 className="relative text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  ResumeIQ
                </h1>
              </div>
            </div>

            {/* Main headline */}
            <div className="space-y-4 opacity-0 animate-fadeIn [animation-delay:300ms] [animation-fill-mode:forwards]">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
                Get AI-Powered Resume Feedback{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  in Seconds
                </span>{' '}
                <span className="inline-block">⚡</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Upload your resume and receive expert insights instantly. Powered by advanced AI to help you land your dream job.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-fadeIn [animation-delay:500ms] [animation-fill-mode:forwards]">
              <button
                onClick={scrollToUpload}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <span className="relative z-10">Analyze Your Resume</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button
                onClick={scrollToUpload}
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Try Demo
              </button>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 opacity-0 animate-fadeIn [animation-delay:700ms] [animation-fill-mode:forwards]">
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
            </div>
          </div>
        </div>

        {/* Upload Section - Integrated elegantly */}
        <div
          id="upload-section"
          className="pt-16 sm:pt-24 pb-16 opacity-0 animate-slideUp [animation-delay:900ms] [animation-fill-mode:forwards]"
        >
          <div className="max-w-4xl mx-auto">
            <UploadSection
              onFileSelect={handleFileSelect}
              onTextPaste={handleTextPaste}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 pb-12 text-center">
          <p className="text-sm text-gray-400 opacity-0 animate-fadeIn [animation-delay:1100ms] [animation-fill-mode:forwards]">
            Built with ❤️ using Next.js + OpenAI
          </p>
        </footer>
      </div>
    </div>
  );
}
