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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <UploadSection
        onFileSelect={handleFileSelect}
        onTextPaste={handleTextPaste}
      />
    </div>
  );
}
