'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { FileText, ArrowRight, CheckCircle2, TrendingUp, Sparkles, Zap } from 'lucide-react';

export default function DemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [stage, setStage] = useState(0);

  // Auto-advance through stages when in view
  useEffect(() => {
    if (isInView) {
      const timers = [
        setTimeout(() => setStage(1), 1000),
        setTimeout(() => setStage(2), 2400),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [isInView]);

  return (
    <section id="demo-section" ref={ref} className="relative py-32 md:py-40 overflow-hidden bg-gradient-to-b from-white via-gray-50/30 to-white">
      {/* Premium ambient background - Apple style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main ambient glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-brand-indigo/8 via-purple-500/6 to-brand-teal/8 blur-[120px] rounded-full"
        />

        {/* Secondary glows */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-brand-teal/10 to-transparent blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/8 to-transparent blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header - refined */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24 space-y-6"
        >
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-indigo/10 to-brand-teal/10 backdrop-blur-sm border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              <Sparkles className="w-4 h-4 text-brand-indigo" />
              <span className="text-sm font-semibold text-gray-700">Intelligent Analysis</span>
            </div>
          </motion.div>

          <h2 className="font-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            See it in{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-brand-indigo via-purple-600 to-brand-teal bg-clip-text text-transparent">
                action
              </span>
              {/* Subtle underline decoration */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-brand-indigo/30 to-brand-teal/30 rounded-full"
              />
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Watch how ResumeIQ transforms your resume into actionable insights in seconds
          </p>
        </motion.div>

        {/* Demo Visualization - Apple-inspired cards */}
        <div className="relative max-w-6xl mx-auto perspective-1000">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            {/* Step 1: Upload - Glass morphism card */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotateY: -15 }}
              animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              <motion.div
                animate={{
                  scale: stage >= 1 ? 0.95 : 1,
                  opacity: stage >= 1 ? 0.6 : 1,
                  y: stage >= 1 ? 10 : 0
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Card glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-brand-indigo/20 to-purple-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Document card - glass morphism */}
                <div className="relative w-56 h-72 backdrop-blur-xl bg-white/80 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 p-6 space-y-4 overflow-hidden">
                  {/* Subtle gradient overlay */}
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brand-indigo/5 to-transparent" />

                  <div className="relative space-y-4">
                    {/* Header with icon */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-indigo/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-brand-indigo" strokeWidth={2} />
                      </div>
                      <div className="h-3 bg-gray-200/80 rounded-full w-24" />
                    </div>

                    {/* Content lines with animation */}
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleX: 0 }}
                        animate={isInView ? { scaleX: 1 } : {}}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                        className="h-2.5 bg-gradient-to-r from-gray-200/80 to-gray-100/80 rounded-full origin-left"
                        style={{ width: `${75 + Math.random() * 25}%` }}
                      />
                    ))}
                  </div>

                  {/* Bottom decoration */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-brand-indigo/10 to-transparent rounded-full blur-2xl" />
                </div>

                {/* Label - refined */}
                <div className="mt-6 text-center space-y-1">
                  <p className="text-sm font-semibold text-gray-900">Your Resume</p>
                  <p className="text-xs text-gray-500">Upload & Process</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Arrow Animation - refined Apple style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={stage >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block"
            >
              <div className="relative">
                <motion.div
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <ArrowRight className="w-10 h-10 text-brand-indigo" strokeWidth={2.5} />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0, 0.4]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 bg-brand-indigo/40 blur-xl rounded-full"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Step 2: Processing (AI Analysis) - refined */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={stage >= 1 && stage < 2 ? { opacity: 1, scale: 1 } : stage >= 2 ? { opacity: 0, scale: 0.8 } : {}}
              transition={{ duration: 0.6 }}
              className="absolute left-1/2 -translate-x-1/2 z-10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {/* Premium spinner */}
                  <div className="relative w-24 h-24">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-indigo border-r-purple-500"
                    />
                    <div className="absolute inset-2 backdrop-blur-sm bg-white/80 rounded-full flex items-center justify-center">
                      <Zap className="w-8 h-8 text-brand-indigo" fill="currentColor" />
                    </div>
                  </div>
                  {/* Glow effect */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-brand-indigo/30 blur-2xl rounded-full"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-gray-900">Analyzing...</p>
                  <p className="text-xs text-gray-500">AI Processing</p>
                </div>
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
                <motion.div
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                  <ArrowRight className="w-10 h-10 text-brand-teal" strokeWidth={2.5} />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0, 0.4]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                    className="absolute inset-0 bg-brand-teal/40 blur-xl rounded-full"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Step 3: Results - Premium glass card */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15 }}
              animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="relative group"
            >
              <motion.div
                animate={{
                  scale: stage >= 2 ? 1 : 0.95,
                  opacity: stage >= 2 ? 1 : 0.6,
                  y: stage >= 2 ? 0 : 10
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Success glow */}
                <motion.div
                  animate={{
                    opacity: stage >= 2 ? [0.4, 0.6, 0.4] : 0,
                    scale: stage >= 2 ? [1, 1.05, 1] : 1
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-4 bg-gradient-to-r from-emerald-400/30 via-green-500/20 to-brand-teal/30 rounded-[32px] blur-2xl"
                />

                {/* Analysis Dashboard Card - Glass morphism */}
                <div className="relative w-56 h-72 backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 p-6 space-y-4 overflow-hidden">
                  {/* Premium gradient overlay */}
                  <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-50/40 via-green-50/20 to-transparent" />

                  <div className="relative space-y-5">
                    {/* Score badge - floating */}
                    <div className="flex justify-end">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={stage >= 2 ? { scale: 1, rotate: 0 } : {}}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                          delay: 0.8
                        }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full blur-lg opacity-60" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.4)]">
                          <span className="text-white font-bold text-xl">95</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Metrics with refined animation */}
                    <div className="space-y-4 pt-2">
                      {[
                        { icon: CheckCircle2, color: 'emerald', label: 'Format', value: 92 },
                        { icon: TrendingUp, color: 'indigo', label: 'Content', value: 95 },
                        { icon: CheckCircle2, color: 'teal', label: 'ATS Ready', value: 98 },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
                          transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className={`w-4 h-4 text-${item.color}-500`} strokeWidth={2.5} />
                            <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                            <span className="ml-auto text-xs font-bold text-gray-900">{item.value}%</span>
                          </div>
                          <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden backdrop-blur-sm">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={stage >= 2 ? { width: `${item.value}%` } : {}}
                              transition={{ duration: 1, delay: 1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                              className={`h-full bg-gradient-to-r ${
                                item.color === 'emerald' ? 'from-emerald-400 to-emerald-500' :
                                item.color === 'indigo' ? 'from-brand-indigo to-purple-500' :
                                'from-brand-teal to-teal-500'
                              }`}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Insights badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: 1.6 }}
                      className="pt-4"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-indigo/10 backdrop-blur-sm rounded-full border border-brand-indigo/20">
                        <Sparkles className="w-3.5 h-3.5 text-brand-indigo" />
                        <span className="text-xs font-semibold text-brand-indigo">12 insights found</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Bottom decoration */}
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-2xl" />
                </div>

                {/* Label - refined */}
                <div className="mt-6 text-center space-y-1">
                  <p className="text-sm font-semibold text-gray-900">Detailed Analysis</p>
                  <p className="text-xs text-gray-500">Instant Insights</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Success Message - refined Apple style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-emerald-50/80 to-green-50/80 backdrop-blur-sm border border-emerald-200/60 rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.1)]">
              <motion.div
                initial={{ scale: 0 }}
                animate={stage >= 2 ? { scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1.9 }}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
              </motion.div>
              <span className="text-sm font-semibold text-emerald-700">Analysis complete in 2.3 seconds</span>
            </div>
          </motion.div>
        </div>

        {/* Floating particles - subtle Apple effect */}
        {stage >= 2 && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  y: [-20, -80],
                  x: [0, (Math.random() - 0.5) * 40]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: 1.8 + i * 0.2,
                  ease: "easeOut"
                }}
                className="absolute"
                style={{
                  left: `${45 + Math.random() * 10}%`,
                  top: '50%'
                }}
              >
                <Sparkles className="w-4 h-4 text-brand-indigo/40" />
              </motion.div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
