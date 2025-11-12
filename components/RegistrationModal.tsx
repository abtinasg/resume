'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Lock, CheckCircle2, Star, TrendingUp, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisScore?: number;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, analysisScore }) => {
  const router = useRouter();

  const handleRegister = () => {
    onClose();
    router.push('/auth/register');
  };

  const handleLogin = () => {
    onClose();
    router.push('/auth/login');
  };

  const benefits = [
    {
      icon: Star,
      title: 'Save Your Analysis Results',
      description: 'Access your resume score and insights anytime, anywhere',
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Monitor improvements across multiple resume versions',
    },
    {
      icon: Award,
      title: 'Unlock Premium Features',
      description: 'Get advanced suggestions and industry-specific insights',
    },
    {
      icon: CheckCircle2,
      title: 'Personalized Dashboard',
      description: 'View your career journey with visual charts and milestones',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="relative w-full max-w-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ambient glow effect */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute -inset-8 bg-gradient-to-r from-brand-indigo/25 via-purple-500/25 to-brand-teal/25 blur-3xl"
              />

              {/* Modal Card */}
              <div className="relative backdrop-blur-xl bg-white/95 border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden">
                {/* Gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-teal" />

                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 z-10"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
                </motion.button>

                {/* Content */}
                <div className="px-8 py-10 md:px-12 md:py-12 space-y-8">
                  {/* Icon and Score */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative">
                      {/* Pulsing glow */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.2, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-br from-brand-indigo to-brand-teal rounded-2xl blur-xl"
                      />

                      {/* Icon container */}
                      <div className="relative w-20 h-20 bg-gradient-to-br from-brand-indigo via-purple-500 to-brand-teal rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(79,70,229,0.4)]">
                        <Sparkles className="w-10 h-10 text-white" strokeWidth={2} />
                      </div>
                    </div>

                    {/* Show score if available */}
                    {analysisScore !== undefined && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200/50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          Your Resume Score: {analysisScore}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Headline */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center space-y-4"
                  >
                    <h2 className="font-grotesk text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                      Save Your Progress & Unlock More
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
                      Create a free account to access your full analysis, track improvements over time, and unlock powerful career-boosting features.
                    </p>
                  </motion.div>

                  {/* Benefits Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {benefits.map((benefit, index) => {
                      const Icon = benefit.icon;
                      return (
                        <motion.div
                          key={benefit.title}
                          initial={{ opacity: 0, x: index % 2 === 0 ? -10 : 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                          className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-brand-indigo/30 transition-colors duration-300"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-brand-indigo/10 to-brand-teal/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-brand-indigo" strokeWidth={2} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {benefit.title}
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {benefit.description}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="space-y-3 pt-4"
                  >
                    {/* Primary CTA - Register */}
                    <motion.button
                      onClick={handleRegister}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-indigo via-purple-600 to-brand-teal text-white font-semibold rounded-2xl shadow-[0_8px_24px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_32px_rgba(79,70,229,0.4)] transition-all duration-300 overflow-hidden"
                    >
                      <span className="relative z-10">Create Free Account</span>
                      <motion.div
                        className="relative z-10"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                      </motion.div>

                      {/* Animated gradient overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-brand-indigo to-purple-600"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{
                          backgroundSize: '200% 100%',
                        }}
                      />
                    </motion.button>

                    {/* Secondary CTA - Login */}
                    <button
                      onClick={handleLogin}
                      className="w-full px-8 py-3 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                    >
                      Already have an account? <span className="text-brand-indigo font-semibold">Sign in</span>
                    </button>
                  </motion.div>

                  {/* Trust badge */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>100% Free Forever</span>
                    </div>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>No credit card required</span>
                    </div>
                    <span className="hidden sm:inline text-gray-300">•</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Privacy guaranteed</span>
                    </div>
                  </motion.div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-brand-teal/20 to-transparent rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-brand-indigo/20 to-transparent rounded-full blur-2xl pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RegistrationModal;
