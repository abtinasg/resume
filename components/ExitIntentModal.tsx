'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Lock } from 'lucide-react';

interface ExitIntentModalProps {
  onClose?: () => void;
  onAccept?: () => void;
}

const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ onClose, onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if modal has been shown in this session
    const modalShown = sessionStorage.getItem('exitIntentShown');
    if (modalShown) {
      setHasShown(true);
      return;
    }

    let exitIntentTimeout: NodeJS.Timeout;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from the top of the viewport
      // and we haven't shown the modal yet
      if (e.clientY <= 10 && !hasShown && !isVisible) {
        // Add small delay to prevent accidental triggers
        exitIntentTimeout = setTimeout(() => {
          setIsVisible(true);
          setHasShown(true);
          sessionStorage.setItem('exitIntentShown', 'true');
        }, 100);
      }
    };

    const handleMouseEnter = () => {
      // Clear timeout if mouse returns quickly
      if (exitIntentTimeout) {
        clearTimeout(exitIntentTimeout);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (exitIntentTimeout) {
        clearTimeout(exitIntentTimeout);
      }
    };
  }, [hasShown, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleAccept = () => {
    setIsVisible(false);
    onAccept?.();

    // Scroll to upload section
    const uploadSection = document.getElementById('upload-section');
    uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50"
            onClick={handleClose}
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
              className="relative w-full max-w-lg pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ambient glow effect */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute -inset-8 bg-gradient-to-r from-brand-indigo/20 via-purple-500/20 to-brand-teal/20 blur-3xl"
              />

              {/* Modal Card */}
              <div className="relative backdrop-blur-xl bg-white/95 border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden">
                {/* Gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-indigo via-purple-500 to-brand-teal" />

                {/* Close button */}
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 z-10"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
                </motion.button>

                {/* Content */}
                <div className="px-8 py-10 md:px-12 md:py-12 space-y-8">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.2,
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                    className="flex justify-center"
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
                  </motion.div>

                  {/* Headline */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center space-y-4"
                  >
                    <h2 className="font-grotesk text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                      Wait! Don&apos;t Miss Your Free Resume Analysis
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
                      Join 10,000+ professionals who have improved their resumes and landed their dream jobs with ResumeIQ.
                    </p>
                  </motion.div>

                  {/* Benefits */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="space-y-3"
                  >
                    {[
                      'Get instant AI-powered feedback on your resume',
                      'Discover hidden opportunities to stand out',
                      'Receive actionable improvements in seconds'
                    ].map((benefit, index) => (
                      <motion.div
                        key={benefit}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{benefit}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="space-y-3 pt-2"
                  >
                    {/* Primary CTA */}
                    <motion.button
                      onClick={handleAccept}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all duration-300 overflow-hidden"
                    >
                      <span className="relative z-10">Analyze My Resume Free</span>
                      <motion.div
                        className="relative z-10"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                      </motion.div>

                      {/* Gradient overlay on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    </motion.button>

                    {/* Secondary CTA */}
                    <button
                      onClick={handleClose}
                      className="w-full px-8 py-3 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                    >
                      No thanks, I&apos;ll pass on this opportunity
                    </button>
                  </motion.div>

                  {/* Trust badge */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-500"
                  >
                    <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>100% Free • No credit card required • Privacy guaranteed</span>
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

export default ExitIntentModal;
