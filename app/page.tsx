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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
          <h1 className="font-bold text-4xl sm:text-5xl text-gray-900 mb-4">
            ResumeIQ
          </h1>
          <p className="text-xl sm:text-2xl text-blue-600 font-semibold mb-4">
            Get AI-powered resume feedback in seconds ⚡
          </p>
          <p className="text-gray-500 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
            Upload your resume and receive actionable insights instantly.
          </p>
        </div>

        {/* Upload Section */}
        <div className="animate-fadeIn opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
          <UploadSection
            onFileSelect={handleFileSelect}
            onTextPaste={handleTextPaste}
          />
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-sm text-gray-400">
            Built with ❤️ using Next.js + OpenAI
          </p>
        </div>
      </div>
    </div>
  );
}
