'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Target, Shield } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Resume Analysis',
    description:
      'Advanced machine learning evaluates every aspect of your resume with precision and care.',
  },
  {
    icon: Zap,
    title: 'Instant Feedback & Scores',
    description:
      'Get comprehensive scores and actionable feedback in seconds, not hours.',
  },
  {
    icon: Target,
    title: 'ATS Optimization',
    description:
      'Ensure your resume passes through Applicant Tracking Systems with confidence.',
  },
  {
    icon: Shield,
    title: 'Privacy-First Processing',
    description:
      'Your data is processed securely and never stored. Complete privacy guaranteed.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50" />

      {/* Ambient light effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-indigo/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-teal/5 blur-[120px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-20"
        >
          <h2 className="font-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Designed for{' '}
            <span className="bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-teal bg-clip-text text-transparent">
              excellence
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Every feature crafted to help you create a resume that opens doors.
          </p>
        </motion.div>

        {/* Feature Cards Grid with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group"
              >
                {/* Card with glassmorphism */}
                <div className="relative h-full">
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-indigo to-brand-teal rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />

                  {/* Glass card */}
                  <div className="relative h-full bg-white/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-ambient transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-glow">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo to-brand-teal blur-lg opacity-30 rounded-2xl" />
                        <div className="relative w-14 h-14 bg-gradient-to-br from-brand-indigo to-brand-teal rounded-2xl flex items-center justify-center transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                          <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="font-grotesk text-xl font-semibold text-gray-900 mb-3 transition-colors duration-300 group-hover:text-brand-indigo">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {feature.description}
                    </p>

                    {/* Hover indicator */}
                    <div className="mt-6 flex items-center gap-2 text-brand-indigo opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
                      <span className="text-sm font-medium">Explore</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
