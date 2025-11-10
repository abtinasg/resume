'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import UploadSection from '@/components/UploadSection';
import ResultsContainer from '@/components/results/ResultsContainer';
import FeaturesSection from '@/components/FeaturesSection';
import DemoSection from '@/components/DemoSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import type { AnalysisResult } from '@/lib/types/analysis';
import { Sparkles, ArrowRight, Lock, Zap } from 'lucide-react';

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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Ambient background - radial gradients for emotional depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top ambient light */}
        <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-radial from-brand-indigo/[0.08] via-purple-500/[0.04] to-transparent blur-3xl" />

        {/* Secondary glow - teal accent */}
        <div className="absolute top-1/3 -right-[20%] w-[800px] h-[800px] bg-gradient-radial from-brand-teal/[0.06] to-transparent blur-3xl" />

        {/* Bottom ambient */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-radial from-purple-400/[0.05] to-transparent blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero Section - Premium Apple-inspired Design */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Subtle grid pattern for depth */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

          <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 sm:py-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left Column - Text Content */}
              <div className="space-y-8 text-center lg:text-left">
                {/* Small brand badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-indigo/5 border border-brand-indigo/10 backdrop-blur-sm mx-auto lg:mx-0"
                >
                  <Sparkles className="w-4 h-4 text-brand-indigo" strokeWidth={2} />
                  <span className="text-sm font-medium text-brand-indigo">AI-Powered Resume Analysis</span>
                </motion.div>

                {/* Main Headline - Staggered reveal */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className="space-y-4"
                >
                  <h1 className="font-grotesk text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.05]">
                    Your next opportunity
                  </h1>
                  <h1 className="font-grotesk text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-teal bg-clip-text text-transparent">
                    starts with a smarter resume.
                  </h1>
                </motion.div>

                {/* Subheading - Calm and confident */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
                  className="text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0"
                >
                  AI-powered insights designed to help you stand out — instantly.
                </motion.p>

                {/* CTA Buttons with enhanced microinteractions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
                >
                  {/* Primary CTA - Glowing indigo */}
                  <button
                    onClick={scrollToUpload}
                    className="group relative px-8 py-4 bg-brand-indigo text-white font-semibold rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Analyze My Resume
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
                    </span>
                    {/* Gradient hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo via-purple-600 to-brand-indigo opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Subtle pulse on hover */}
                    <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                  </button>

                  {/* Secondary CTA - Ghost button with fade */}
                  <button
                    onClick={() => {
                      const demoSection = document.getElementById('demo-section');
                      demoSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="group px-8 py-4 bg-white/50 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl border-2 border-gray-200/50 hover:border-brand-indigo/30 hover:bg-white/80 hover:text-brand-indigo transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Watch How It Works
                      <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </button>
                </motion.div>

                {/* Trust Badges - Soft indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  className="flex flex-wrap justify-center lg:justify-start items-center gap-6 pt-6 text-sm text-gray-500"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Privacy-First</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span>Instant Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" style={{ animationDelay: '0.4s' }} />
                    <span>ATS Optimized</span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Floating Resume Visual with enhanced 3D feel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="relative hidden lg:block perspective-1000"
              >
                <div className="relative w-full h-[600px] flex items-center justify-center">
                  {/* Layered ambient glows - creates depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/20 via-purple-500/15 to-brand-teal/20 blur-[100px] rounded-full animate-pulse-slow" />
                  <div className="absolute inset-0 bg-gradient-to-tl from-brand-teal/10 to-transparent blur-[80px] rounded-full" style={{ animationDelay: '1s' }} />

                  {/* Floating Resume Document */}
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      rotateY: [0, 5, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)] p-12 w-[400px] border border-gray-100/50 backdrop-blur-sm">
                      {/* Document Header with gradient */}
                      <div className="space-y-4 mb-8">
                        <div className="h-5 bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-teal rounded-full w-3/4 shadow-sm" />
                        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                      </div>

                      {/* Document Content Lines - progressive opacity */}
                      <div className="space-y-3 mb-8">
                        <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                        <div className="h-2.5 bg-gray-200 rounded-full w-5/6 opacity-80" />
                        <div className="h-2.5 bg-gray-200 rounded-full w-full opacity-70" />
                        <div className="h-2.5 bg-gray-200 rounded-full w-4/6 opacity-60" />
                      </div>

                      {/* Section Divider */}
                      <div className="mb-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                      {/* More content */}
                      <div className="space-y-3 mb-8">
                        <div className="h-2.5 bg-gray-200 rounded-full w-4/5" />
                        <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                        <div className="h-2.5 bg-gray-200 rounded-full w-3/5" />
                      </div>

                      {/* Score Badge - Premium floating effect */}
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                        className="absolute -top-8 -right-8 bg-gradient-to-br from-green-400 via-emerald-500 to-brand-teal text-white rounded-full w-28 h-28 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                      >
                        <div className="text-center">
                          <div className="text-3xl font-bold">95</div>
                          <div className="text-xs uppercase tracking-wider opacity-90">Score</div>
                        </div>
                      </motion.div>

                      {/* Success Checkmarks with stagger animation */}
                      <div className="space-y-3 mt-6">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 1 + i * 0.15 }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center ring-2 ring-green-100">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full flex-1" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Floating particles - subtle ambient motion */}
                  <motion.div
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-24 left-12 w-2 h-2 bg-brand-indigo/40 rounded-full blur-[1px]"
                  />
                  <motion.div
                    animate={{
                      y: [0, 30, 0],
                      opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    className="absolute bottom-32 right-16 w-3 h-3 bg-brand-teal/40 rounded-full blur-[1px]"
                  />
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                      x: [0, 10, 0],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute top-1/2 right-8 w-2 h-2 bg-purple-400/40 rounded-full blur-[1px]"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Upload Section or Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          id="upload-section"
          className="py-16 relative"
        >
          {/* Subtle section divider glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-brand-indigo/20 to-transparent" />

          <div className="max-w-4xl mx-auto px-6 md:px-12 relative">
            {isAnalyzed ? (
              <>
                {/* Success Card - Enhanced with bloom effect */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-xl mx-auto px-4 py-8"
                >
                  <div className="relative">
                    {/* Success glow - expanding bloom */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.4, scale: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 bg-green-100/60 blur-3xl rounded-3xl"
                    />

                    {/* Success card */}
                    <div className="relative bg-white shadow-[0_20px_60px_-10px_rgba(34,197,94,0.15)] rounded-3xl p-8 md:p-10 space-y-6 text-center border border-green-100/50">
                      {/* Success icon with checkmark bloom */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                          delay: 0.2
                        }}
                        className="flex justify-center"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl" />
                          <div className="relative w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center ring-4 ring-green-100/50">
                            <motion.svg
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.5, delay: 0.4 }}
                              className="w-10 h-10 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <motion.path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </motion.svg>
                          </div>
                        </div>
                      </motion.div>

                      <div className="space-y-3">
                        <h2 className="font-grotesk text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                          Analysis Complete
                        </h2>
                        <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
                          Your resume has been analyzed with precision. Discover your insights below.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Results Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
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

                {/* Trust message - Enhanced with icon */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
                  className="mt-8 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50/80 backdrop-blur-sm border border-gray-100">
                    <Lock className="w-4 h-4 text-gray-400" strokeWidth={2} />
                    <p className="text-sm text-gray-500">
                      Your resume is processed securely and never stored
                    </p>
                  </div>
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

        {/* Final CTA Section - Premium Indigo Gradient */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-32 overflow-hidden"
        >
          {/* Premium gradient background - indigo to deep purple */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo via-purple-700 to-indigo-900" />

          {/* Layered ambient lights for depth */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-teal/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400/20 blur-[100px] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/5 blur-[80px] rounded-full" />

          <div className="relative max-w-5xl mx-auto px-6 md:px-12 py-32 text-center">
            {/* Emotional headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h2 className="font-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                  Because your career deserves{' '}
                  <span className="block mt-2 bg-gradient-to-r from-brand-teal via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    better tools
                  </span>
                </h2>

                <p className="text-xl text-indigo-100/80 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of professionals who&apos;ve transformed their careers with intelligent resume insights
                </p>
              </div>

              {/* CTA Button - Glowing white */}
              <div className="pt-6">
                <motion.button
                  onClick={() => {
                    const uploadSection = document.getElementById('upload-section');
                    uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-white text-gray-900 font-semibold rounded-2xl overflow-hidden transition-all duration-500 shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:shadow-[0_0_80px_rgba(255,255,255,0.3)]"
                >
                  <Zap className="w-5 h-5 text-brand-indigo" strokeWidth={2.5} fill="currentColor" />
                  <span className="relative z-10">Try ResumeIQ Free</span>
                  <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />

                  {/* Subtle gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/10 to-brand-indigo/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-6 pt-8 text-sm text-indigo-200/70">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Privacy guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Results in seconds</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Minimal Premium Footer */}
        <footer className="relative bg-gray-950 border-t border-gray-900">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

          <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              {/* Brand */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-indigo to-brand-teal flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-grotesk text-xl font-bold text-white">ResumeIQ</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                  AI-powered resume analysis designed to help you stand out and land your dream job.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-5">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Quick Links</h4>
                <ul className="space-y-3">
                  {[
                    { label: 'Features', href: '#features' },
                    { label: 'How It Works', href: '#demo-section' },
                    { label: 'About', href: '#about' },
                    { label: 'Contact', href: '#contact' }
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200 inline-flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-brand-indigo transition-colors duration-200" />
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-5">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Legal</h4>
                <ul className="space-y-3">
                  <li className="text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer">Privacy Policy</li>
                  <li className="text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer">Terms of Service</li>
                  <li className="text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer">Cookie Policy</li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-10 border-t border-gray-900">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-500">
                  © 2025 ResumeIQ. Crafted with precision.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Powered by</span>
                  <span className="text-xs text-gray-500">Next.js</span>
                  <span className="text-gray-700">•</span>
                  <span className="text-xs text-gray-500">OpenAI</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
