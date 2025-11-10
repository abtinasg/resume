'use client';

import { motion } from 'framer-motion';
import { Sparkles, FileSearch, Target } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Resume Insights',
    description:
      'Leverage advanced AI technology to analyze your resume and get actionable insights that help you stand out in your job search.',
  },
  {
    icon: FileSearch,
    title: 'Real-Time PDF Parsing',
    description:
      'Upload your PDF resume and get instant feedback. Our intelligent parser extracts key information in seconds.',
  },
  {
    icon: Target,
    title: 'Smart Suggestions & Scores',
    description:
      'Receive personalized suggestions to improve your resume score and increase your chances of landing interviews.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight">
            Powerful Features for{' '}
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Resume Success
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to create a professional, AI-optimized resume that gets noticed by recruiters.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div className="group relative h-full bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1">
                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 blur-xl opacity-20 group-hover:opacity-30 transition-opacity rounded-full" />
                    <div className="relative w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
