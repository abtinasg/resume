'use client';

import { motion } from 'framer-motion';
import { Brain, Users, Sparkles } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="relative py-32 overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Ambient background effects */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-teal/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-brand-indigo/10 blur-[120px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-indigo/10 rounded-full">
              <Sparkles className="w-4 h-4 text-brand-indigo" />
              <span className="text-sm font-medium text-brand-indigo">Our Story</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="font-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
                Built by engineers and{' '}
                <span className="bg-gradient-to-r from-brand-indigo to-brand-teal bg-clip-text text-transparent">
                  career experts
                </span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                ResumeIQ combines data precision with human empathy.
              </p>
            </div>

            {/* Body Text */}
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p className="text-lg">
                We understand the job search can feel overwhelming. That&apos;s why we built ResumeIQ —
                to give every job seeker the clarity and confidence they deserve.
              </p>
              <p className="text-lg">
                Our AI doesn&apos;t just scan your resume. It understands context, evaluates nuance,
                and provides guidance that feels personal, not robotic.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4 pt-4">
              {[
                { icon: Brain, label: 'AI-Powered Intelligence' },
                { icon: Users, label: 'Human-Centered Design' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + index * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm"
                >
                  <item.icon className="w-5 h-5 text-brand-indigo" />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Floating Glowing Document */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative h-[600px] flex items-center justify-center">
              {/* Glowing ambient background */}
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-brand-indigo/30 via-purple-500/20 to-brand-teal/30 blur-[100px] rounded-full animate-glow" />
              </div>

              {/* Floating Document with 3D effect */}
              <div className="relative animate-float">
                {/* Shadow layers for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 rounded-3xl blur-2xl opacity-20 translate-y-8" />

                {/* Main document */}
                <div className="relative bg-white rounded-3xl shadow-ambient border border-gray-100 p-10 w-[380px] transform rotate-2 hover:rotate-0 transition-transform duration-700">
                  {/* Document header with profile section */}
                  <div className="space-y-6">
                    {/* Profile header */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-indigo to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        JD
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gradient-to-r from-brand-indigo to-purple-500 rounded-full w-3/4" />
                        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
                      </div>
                    </div>

                    {/* Section divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                    {/* Content sections */}
                    <div className="space-y-4">
                      {[...Array(3)].map((_, sectionIndex) => (
                        <div key={sectionIndex} className="space-y-2">
                          <div className="h-3 bg-gray-300 rounded-full w-1/3" />
                          <div className="space-y-1.5">
                            <div className="h-2 bg-gray-200 rounded-full w-full" />
                            <div className="h-2 bg-gray-200 rounded-full w-5/6" />
                            <div className="h-2 bg-gray-200 rounded-full w-4/6" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quality indicators */}
                    <div className="flex gap-2 pt-4">
                      {['ATS', 'Format', 'Keywords'].map((label, i) => (
                        <div
                          key={label}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full"
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs font-medium text-green-700">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating score badge */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-green-400 to-brand-teal rounded-full shadow-glow flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">A+</div>
                      <div className="text-xs text-white/90">Great</div>
                    </div>
                  </div>

                  {/* Floating particles */}
                  <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-brand-indigo/20 backdrop-blur-xl rounded-full border border-brand-indigo/30 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-brand-indigo" />
                  </div>
                </div>
              </div>

              {/* Floating accent elements */}
              <div className="absolute top-12 right-12 w-3 h-3 bg-brand-teal/50 rounded-full animate-pulse-slow" />
              <div className="absolute bottom-20 left-8 w-2 h-2 bg-brand-indigo/50 rounded-full animate-pulse-slow delay-75" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
