'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import UploadSection from '@/components/UploadSection';
import ResultsContainer from '@/components/results/ResultsContainer';
import FeaturesSection from '@/components/FeaturesSection';
import DemoSection from '@/components/DemoSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import ChatBotPanel from '@/components/ChatBotPanel';
import type { AnalysisResult } from '@/lib/types/analysis';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Zap,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const heroFeatures: { icon: LucideIcon; title: string; description: string }[] = [
    {
      icon: ShieldCheck,
      title: 'Private by default',
      description: 'Secure temporary processing with instant deletion.',
    },
    {
      icon: Target,
      title: 'Tailored scoring',
      description: 'Custom criteria tuned to your target role or industry.',
    },
    {
      icon: Users,
      title: 'Human benchmarked',
      description: 'Modelled with feedback from hiring managers.',
    },
  ];

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
        <header className="max-w-6xl mx-auto px-6 md:px-12 pt-8 flex items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-teal flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-indigo">ResumeIQ</p>
              <p className="text-xs text-gray-400">Precision career guidance</p>
            </div>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:flex items-center gap-8 text-sm text-gray-500"
          >
            <a className="hover:text-gray-900 transition" href="#features">
              Features
            </a>
            <a className="hover:text-gray-900 transition" href="#demo-section">
              How it works
            </a>
            <a className="hover:text-gray-900 transition" href="#about">
              About us
            </a>
            <a className="hover:text-gray-900 transition" href="#contact">
              Contact
            </a>
          </motion.nav>

          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            onClick={scrollToUpload}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-indigo/40 text-brand-indigo text-sm font-semibold hover:bg-brand-indigo hover:text-white transition"
          >
            Get started
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>
        </header>

        {/* Hero Section - Research inspired redesign */}
        <section className="relative pt-16 pb-24 md:pb-32">
          <div className="absolute inset-x-0 top-20 mx-auto max-w-5xl h-[420px] bg-gradient-to-b from-white/60 via-purple-100/40 to-transparent blur-3xl rounded-full" />

          <div className="relative max-w-6xl mx-auto px-6 md:px-12 grid gap-16 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div className="space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 border border-gray-100 shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Research-backed coaching
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <h1 className="font-grotesk text-4xl sm:text-5xl lg:text-[56px] leading-tight tracking-tight text-gray-900">
                  Design a resume experience that feels curated for every recruiter.
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 max-w-xl leading-relaxed">
                  ResumeIQ blends behavioural research with AI analysis so you can experiment, iterate, and deliver a sharper story in minutes—not days.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={scrollToUpload}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-teal px-8 py-4 text-white font-semibold shadow-[0_18px_40px_-12px_rgba(79,70,229,0.5)] transition hover:translate-y-[-2px]"
                >
                  Start free analysis
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    const demoSection = document.getElementById('demo-section');
                    demoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-8 py-4 text-gray-700 font-semibold hover:border-brand-indigo/40 hover:text-brand-indigo transition"
                >
                  View interactive demo
                  <span className="text-lg">→</span>
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-4 sm:grid-cols-3"
              >
                {heroFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm p-5 shadow-sm"
                  >
                    <feature.icon className="w-5 h-5 text-brand-indigo" strokeWidth={2.2} />
                    <p className="mt-3 text-sm font-semibold text-gray-900">{feature.title}</p>
                    <p className="mt-1 text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/20 via-purple-200/40 to-brand-teal/20 blur-[90px] rounded-[40px]" />
              <div className="relative rounded-[32px] border border-white/60 bg-white shadow-[0_25px_60px_-20px_rgba(79,70,229,0.35)] overflow-hidden">
                <div className="px-8 pt-8 pb-6 border-b border-gray-100 bg-gradient-to-br from-white to-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em]">Live experiment</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">Product Marketing Lead</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 text-emerald-600 px-3 py-1 text-xs font-medium">Score 92</div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                    “Your leadership summary is compelling, but highlight measurable impact earlier in the profile section.”
                  </p>
                </div>
                <div className="grid gap-6 p-8 bg-white">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Opportunities</p>
                    <div className="grid gap-3">
                      {["Bring the brand voice forward in the header", "Surface 3 quantified achievements", "Clarify collaboration with sales"].map((item, idx) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.32 + idx * 0.08 }}
                          className="flex items-start gap-3"
                        >
                          <div className="mt-1 h-2 w-2 rounded-full bg-brand-indigo" />
                          <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confidence lift</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">+37%</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Average increase in recruiter callbacks after implementing the recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
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

          {isAnalyzed ? (
            <>
              {/* Success Card - Enhanced with bloom effect - Keep centered */}
              <div className="max-w-4xl mx-auto px-6 md:px-12 relative">
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
              </div>

              {/* Results Section - Full Width */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                id="results-section"
                className="mt-12 w-full"
              >
                <ResultsContainer
                  data={analysis}
                  isLoading={false}
                  onReset={handleReset}
                />
              </motion.div>
            </>
          ) : (
            <div className="max-w-4xl mx-auto px-6 md:px-12 relative">
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
            </div>
          )}
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

      {/* Floating AI Coach ChatBot */}
      <ChatBotPanel
        resumeContext={
          analysis
            ? {
                overall_score: analysis.summary?.overall ?? 0,
                sections: {
                  structure: 0,
                  content: 0,
                  tailoring: 0,
                },
                summary: analysis.summary?.text ?? '',
                actionables: analysis.suggestions?.map((s) => ({
                  title: s.title,
                  points: 0,
                  fix: s.after,
                  category: '',
                  priority: s.priority,
                })) ?? [],
              }
            : undefined
        }
        autoOpen={isAnalyzed}
      />
    </div>
  );
}
