'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { FileText, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

export default function DemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [stage, setStage] = useState(0);

  // Auto-advance through stages when in view
  useEffect(() => {
    if (isInView) {
      const timers = [
        setTimeout(() => setStage(1), 800),
        setTimeout(() => setStage(2), 2000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isInView]);

  return (
    <section id="demo-section" ref={ref} className="relative py-32 overflow-hidden bg-white">
      {/* Background ambient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-indigo/5 blur-[150px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <h2 className="font-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            See it in{' '}
            <span className="bg-gradient-to-r from-brand-indigo to-brand-teal bg-clip-text text-transparent">
              action
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch how ResumeIQ transforms your resume into actionable insights
          </p>
        </motion.div>

        {/* Demo Visualization */}
        <div className="relative max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {/* Step 1: Upload */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className={`relative transition-all duration-1000 ${stage >= 1 ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                {/* Document card */}
                <div className="w-48 h-64 bg-white rounded-2xl shadow-ambient border border-gray-200 p-6 space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-brand-indigo" />
                    <div className="h-2 bg-gray-200 rounded-full w-20" />
                  </div>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-2 bg-gray-100 rounded-full" style={{ width: `${80 + Math.random() * 20}%` }} />
                  ))}
                </div>

                {/* Label */}
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-gray-900">Your Resume</p>
                  <p className="text-xs text-gray-500 mt-1">Upload & Process</p>
                </div>
              </div>
            </motion.div>

            {/* Arrow Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={stage >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block"
            >
              <div className="relative">
                <ArrowRight className="w-12 h-12 text-brand-indigo" strokeWidth={2} />
                {/* Pulse effect */}
                <div className="absolute inset-0 bg-brand-indigo/20 blur-xl rounded-full animate-pulse-slow" />
              </div>
            </motion.div>

            {/* Step 2: Processing (Optional middle state) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={stage >= 1 && stage < 2 ? { opacity: 1, scale: 1 } : stage >= 2 ? { opacity: 0, scale: 0.8 } : {}}
              transition={{ duration: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-brand-indigo/30 border-t-brand-indigo animate-spin" />
                  <div className="absolute inset-0 bg-brand-indigo/20 blur-2xl rounded-full" />
                </div>
                <p className="text-sm font-medium text-gray-700">Analyzing...</p>
              </div>
            </motion.div>

            {/* Arrow Animation 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={stage >= 2 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="relative">
                <ArrowRight className="w-12 h-12 text-brand-teal" strokeWidth={2} />
                <div className="absolute inset-0 bg-brand-teal/20 blur-xl rounded-full animate-pulse-slow" />
              </div>
            </motion.div>

            {/* Step 3: Results */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative"
            >
              <div className={`relative transition-all duration-1000 ${stage >= 2 ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}>
                {/* Analysis Dashboard Card */}
                <div className="w-48 h-64 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-glow border border-brand-indigo/20 p-6 space-y-4 overflow-hidden">
                  {/* Score */}
                  <div className="relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-400 to-brand-teal rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">95</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="pt-12 space-y-3">
                    {[
                      { icon: CheckCircle2, color: 'text-green-500', label: 'Format' },
                      { icon: TrendingUp, color: 'text-brand-indigo', label: 'Content' },
                      { icon: CheckCircle2, color: 'text-brand-teal', label: 'ATS Ready' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={stage >= 2 ? { width: `${85 + Math.random() * 15}%` } : {}}
                              transition={{ duration: 0.8, delay: 1 + i * 0.1 }}
                              className={`h-full bg-gradient-to-r ${item.color === 'text-green-500' ? 'from-green-400 to-green-500' : item.color === 'text-brand-indigo' ? 'from-brand-indigo to-purple-500' : 'from-brand-teal to-teal-500'}`}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Suggestions count */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 1.5 }}
                    className="pt-4 border-t border-gray-200"
                  >
                    <p className="text-xs text-gray-600 text-center">
                      <span className="font-semibold text-brand-indigo">12</span> improvements found
                    </p>
                  </motion.div>
                </div>

                {/* Label */}
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-gray-900">Detailed Analysis</p>
                  <p className="text-xs text-gray-500 mt-1">Instant Insights</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Analysis complete in 2.3 seconds</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
