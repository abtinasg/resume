'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UploadSection from '@/components/UploadSection';
import ResultsContainer from '@/components/results/ResultsContainer';
import FeaturesSection from '@/components/FeaturesSection';
import DemoSection from '@/components/DemoSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import ChatBotPanel from '@/components/ChatBotPanel';
import TrustBadges from '@/components/TrustBadges';
import MobileCTA from '@/components/MobileCTA';
import TestimonialsSection from '@/components/TestimonialsSection';
import RegistrationModal from '@/components/RegistrationModal';
import { useAuthStore } from '@/lib/store/authStore';
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
  LineChart,
  Compass,
} from 'lucide-react';

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const navItems = [
    { label: 'Platform', href: '#features' },
    { label: 'Methodology', href: '#demo-section' },
    { label: 'Stories', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ];

  const heroFeatures: { icon: LucideIcon; title: string; description: string }[] = [
    {
      icon: ShieldCheck,
      title: 'Enterprise-grade privacy',
      description: 'Encrypted uploads with automatic redaction & deletion.',
    },
    {
      icon: Target,
      title: 'Role-specific guidance',
      description: 'Insights adapt to your industry and seniority instantly.',
    },
    {
      icon: Users,
      title: 'Human-aligned scoring',
      description: 'Benchmarked with hiring managers from leading teams.',
    },
  ];

  const handleAnalyzeComplete = (data: AnalysisResult) => {
    setAnalysis(data);
    setIsAnalyzed(true);
    console.log('Analysis complete:', data);

    // Show registration modal after a short delay if user is not authenticated
    if (!isAuthenticated && !authLoading) {
      setTimeout(() => {
        setShowRegistrationModal(true);
      }, 2000); // 2 second delay to let user see their results first
    }
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
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl mx-auto px-6 md:px-12 pt-8 flex items-center justify-between gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-brand-teal/40 blur" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-brand-indigo via-purple-500 to-brand-teal flex items-center justify-center shadow-[0_18px_45px_-16px_rgba(79,70,229,0.65)]">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-900">ResumeIQ</p>
              <p className="text-xs text-gray-500">Executive resume intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-gray-500">
            {navItems.map((item) => (
              <a
                key={item.label}
                className="group relative font-medium transition hover:text-gray-900"
                href={item.href}
              >
                <span>{item.label}</span>
                <span className="absolute inset-x-0 -bottom-2 h-px origin-left scale-x-0 bg-gradient-to-r from-brand-teal to-brand-indigo transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={scrollToUpload}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-brand-indigo/40 px-5 py-2.5 text-sm font-semibold text-brand-indigo shadow-[0_8px_20px_-12px_rgba(79,70,229,0.55)] transition hover:bg-brand-indigo hover:text-white"
          >
            Launch workspace
            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
          </motion.button>
        </motion.header>

        {/* Hero Section - Immersive experience */}
        <section className="relative pt-20 pb-28 md:pb-36">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-50" />
          <div className="absolute inset-x-0 top-0 h-[520px] overflow-hidden">
            <div className="absolute inset-x-[10%] top-16 h-[420px] rounded-[60px] bg-gradient-to-br from-brand-indigo/15 via-purple-300/10 to-brand-teal/15 blur-3xl" />
            <div className="absolute left-[8%] top-24 h-64 w-64 rounded-full bg-brand-indigo/10 blur-[120px]" />
            <div className="absolute right-[12%] top-12 h-72 w-72 rounded-full bg-brand-teal/10 blur-[120px]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 md:px-12 grid gap-20 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-5 py-2.5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-indigo text-white">
                  <Compass className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">
                  Research-led resume design
                </span>
              </motion.div>

              <div className="space-y-8">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="font-grotesk text-4xl sm:text-5xl lg:text-[58px] leading-[1.05] tracking-tight text-slate-900"
                >
                  Bring soul to your resume with an intelligence layer built for modern hiring teams.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-lg sm:text-xl leading-relaxed text-slate-600 max-w-xl"
                >
                  ResumeIQ blends qualitative researcher insight with adaptive AI scoring so every iteration feels deliberate, personal, and unmistakably professional.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={scrollToUpload}
                    className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-9 py-4 text-base font-semibold text-white shadow-[0_24px_45px_-18px_rgba(15,23,42,0.65)] transition duration-300 hover:-translate-y-1"
                  >
                    Start your free analysis
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.4} />
                    <span className="absolute inset-0 rounded-2xl border border-white/20" />
                  </button>
                  <button
                    onClick={() => {
                      const demoSection = document.getElementById('demo-section');
                      demoSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-9 py-4 text-base font-semibold text-slate-700 transition hover:border-brand-indigo/40 hover:text-brand-indigo"
                  >
                    View interactive demo
                    <span className="text-lg">→</span>
                  </button>
                </div>
                <TrustBadges variant="light" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-5 sm:grid-cols-3"
              >
                {heroFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.36 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="group rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_-20px_rgba(15,23,42,0.25)] backdrop-blur hover:-translate-y-1 transition"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo/10 via-purple-200/30 to-brand-teal/20 text-brand-indigo">
                      <feature.icon className="h-5 w-5" strokeWidth={2.1} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-gray-900">{feature.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-4 sm:grid-cols-2 max-w-lg"
              >
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Interview invites</span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <LineChart className="h-3.5 w-3.5" />
                      +38%
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-900">After two guided revisions</p>
                  <p className="mt-2 text-sm text-slate-500">Based on anonymised cohort of 1,200 job seekers.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-indigo/10 via-white to-brand-teal/10 p-5 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time to clarity</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">6m 21s</p>
                  <p className="mt-2 text-sm text-slate-500">Average time to surface the top three improvements for a new role.</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-[44px] bg-gradient-to-br from-brand-indigo/30 via-purple-300/20 to-brand-teal/30 blur-[90px]" />
              <div className="relative rounded-[34px] border border-white/40 bg-white/90 shadow-[0_40px_90px_-35px_rgba(45,55,72,0.45)] backdrop-blur-xl p-6 sm:p-8">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-900 px-6 py-5 text-slate-200">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Live Candidate</p>
                    <p className="mt-2 text-xl font-semibold text-white">Product Marketing Lead</p>
                  </div>
                  <div className="rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-semibold text-emerald-600">Match 92</div>
                </div>

                <div className="mt-6 grid gap-6">
                  <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Strategic narrative</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      “Lead with commercial outcomes in your opening paragraph—your product positioning work unlocked $14.6M ARR and deserves the spotlight.”
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-white/80 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opportunities</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        {['Tighten leadership summary', 'Elevate quantified impact', 'Clarify GTM partnership'].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-indigo" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-gradient-to-br from-brand-teal/10 to-brand-indigo/10 p-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence lift</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">+37%</p>
                        <p className="mt-1 text-xs text-slate-500">Projected callback improvement</p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        Calibrated with human reviewers
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-brand-indigo/40 bg-white/70 p-5 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Next action</p>
                    <p className="mt-2 leading-relaxed">
                      Reframe the case study to open with customer impact, then follow with the metrics to reinforce the narrative arc.
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

        {/* Testimonials Section */}
        <TestimonialsSection />

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
              <div className="pt-6 space-y-4">
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
                <TrustBadges variant="dark" />
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

      {/* Sticky Mobile CTA */}
      <MobileCTA />

      {/* Registration Modal - shown after analysis for non-authenticated users */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        analysisScore={analysis?.summary?.overall}
      />
    </div>
  );
}
