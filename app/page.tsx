'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UploadSection from '@/components/UploadSection';
import ResultsContainer from '@/components/results/ResultsContainer';
import FeaturesSection from '@/components/FeaturesSection';
import DemoSection from '@/components/DemoSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import type { AnalysisResult } from '@/lib/types/analysis';

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleAnalyzeComplete = (data: AnalysisResult) => {
    setAnalysis(data);
    setIsAnalyzed(true);
    console.log('Analysis complete:', data);
  };

  const handleReset = () => {
    setAnalysis(null);
    setIsAnalyzed(false);
  };

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Smooth scroll to results after analysis completes
  useEffect(() => {
    if (isAnalyzed) {
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  }, [isAnalyzed]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9FAFB] to-[#FFFFFF] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero Section - Apple-inspired Cinematic Design */}
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24 sm:pt-40 sm:pb-32">
          {/* Ambient light behind title */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-indigo/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Brand Logo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              >
                <h1 className="font-grotesk text-sm font-semibold tracking-wider text-brand-indigo uppercase mb-6">
                  ResumeIQ
                </h1>
              </motion.div>

              {/* Main Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              >
                <h2 className="font-grotesk text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1]">
                  Your next opportunity{' '}
                  <span className="block mt-2 bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-teal bg-clip-text text-transparent">
                    starts with a smarter resume.
                  </span>
                </h2>
              </motion.div>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                AI-powered insights designed to help you stand out — instantly.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <button
                  onClick={scrollToUpload}
                  className="group relative px-8 py-4 bg-brand-indigo text-white font-semibold rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-glow"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Analyze My Resume
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>

                <button
                  onClick={() => {
                    const demoSection = document.getElementById('demo-section');
                    demoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl border-2 border-gray-200 hover:border-brand-indigo/50 hover:text-brand-indigo transition-all duration-300 hover:scale-[1.02]"
                >
                  Watch How It Works
                </button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-wrap justify-center lg:justify-start items-center gap-6 pt-4 text-sm text-gray-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Privacy-First</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-indigo" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-teal" />
                  <span>ATS Optimized</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - 3D Floating Resume Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full h-[600px] flex items-center justify-center">
                {/* Ambient glow behind document */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/20 via-purple-500/20 to-brand-teal/20 blur-[100px] rounded-full animate-glow" />

                {/* Floating Resume Document */}
                <div className="relative animate-float">
                  <div className="relative bg-white rounded-3xl shadow-ambient p-12 w-[400px] border border-gray-100">
                    {/* Document Header */}
                    <div className="space-y-4 mb-8">
                      <div className="h-4 bg-gradient-to-r from-brand-indigo to-purple-500 rounded-full w-3/4" />
                      <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                    </div>

                    {/* Document Content Lines */}
                    <div className="space-y-3 mb-8">
                      <div className="h-2 bg-gray-200 rounded-full w-full" />
                      <div className="h-2 bg-gray-200 rounded-full w-5/6" />
                      <div className="h-2 bg-gray-200 rounded-full w-full" />
                      <div className="h-2 bg-gray-200 rounded-full w-4/6" />
                    </div>

                    {/* Score Badge */}
                    <div className="absolute -top-6 -right-6 bg-gradient-to-br from-green-400 to-brand-teal text-white rounded-full w-24 h-24 flex items-center justify-center shadow-glow-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold">95</div>
                        <div className="text-xs">Score</div>
                      </div>
                    </div>

                    {/* Checkmarks */}
                    <div className="space-y-2 mt-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating particles */}
                <div className="absolute top-20 left-10 w-2 h-2 bg-brand-indigo/40 rounded-full animate-pulse-slow" />
                <div className="absolute bottom-32 right-16 w-3 h-3 bg-brand-teal/40 rounded-full animate-pulse-slow delay-75" />
                <div className="absolute top-1/2 right-6 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse-slow delay-150" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Upload Section or Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] as any, delay: 0.2 }}
          id="upload-section"
          className="py-16"
        >
          <div className="max-w-4xl mx-auto px-6 md:px-12 relative">
            {isAnalyzed ? (
              <>
                {/* Success Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-xl mx-auto px-4 py-8"
                >
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
                          Your resume has been analyzed successfully. Check out the results below.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Results Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  id="results-section"
                  className="mt-12"
                >
                  <ResultsContainer
                    data={analysis}
                    isLoading={false}
                    onReset={handleReset}
                  />
                </motion.div>
              </>
            ) : (
              <>
                <UploadSection
                  onAnalyzeComplete={handleAnalyzeComplete}
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
              </>
            )}
          </div>
        </motion.div>

        {/* Features Section */}
        <FeaturesSection />

        {/* Demo Section */}
        <DemoSection />

        {/* About Section */}
        <AboutSection />

        {/* Contact Section */}
        <ContactSection />

        {/* Final CTA Section with Dark Gradient */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-32 overflow-hidden"
        >
          {/* Dark gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-brand-indigo to-gray-900" />

          {/* Ambient light effects */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-indigo/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-teal/20 blur-[120px] rounded-full" />

          <div className="relative max-w-5xl mx-auto px-6 md:px-12 py-32 text-center">
            {/* Emotional headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <h2 className="font-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                Because your career deserves{' '}
                <span className="bg-gradient-to-r from-brand-teal via-blue-400 to-brand-indigo bg-clip-text text-transparent">
                  better tools
                </span>
              </h2>

              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Join thousands of job seekers who&apos;ve transformed their resumes with ResumeIQ
              </p>

              {/* CTA Button */}
              <div className="pt-8">
                <button
                  onClick={() => {
                    const uploadSection = document.getElementById('upload-section');
                    uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-gray-900 font-semibold rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]"
                >
                  <span className="relative z-10">Try ResumeIQ Free</span>
                  <svg
                    className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-brand-indigo opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                </button>
              </div>

              {/* Trust note */}
              <p className="text-sm text-gray-400 pt-6">
                No credit card required • Privacy guaranteed • Results in seconds
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Minimal Footer */}
        <footer className="relative bg-gray-950 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              {/* Brand */}
              <div className="space-y-4">
                <h3 className="font-grotesk text-xl font-bold text-white">ResumeIQ</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  AI-powered resume analysis designed to help you stand out and land your dream job.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Links</h4>
                <ul className="space-y-2">
                  {['Features', 'About', 'Contact'].map((link) => (
                    <li key={link}>
                      <a
                        href={`#${link.toLowerCase()}`}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Legal</h4>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-400">Privacy Policy</li>
                  <li className="text-sm text-gray-400">Terms of Service</li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-500">
                  © 2025 ResumeIQ. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-gray-600">Built with Next.js & OpenAI</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
