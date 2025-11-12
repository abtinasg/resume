'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

export default function MobileCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA after scrolling past the hero section (approximately 600px)
      const scrollPosition = window.scrollY;
      const heroHeight = 600;

      if (scrollPosition > heroHeight && !isDismissed) {
        setIsVisible(true);
      } else if (scrollPosition <= heroHeight) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleClick = () => {
    const uploadSection = document.getElementById('upload-section');
    uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          {/* Gradient backdrop for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-xl" />

          {/* CTA Content */}
          <div className="relative px-4 py-4 pb-safe">
            <div className="relative bg-slate-900 rounded-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden">
              {/* Ambient glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo/20 via-purple-500/10 to-brand-teal/20 opacity-50" />

              {/* Content container */}
              <div className="relative flex items-center justify-between px-5 py-4">
                <div className="flex-1 mr-3">
                  <p className="text-sm font-semibold text-white mb-1">
                    Ready to improve your resume?
                  </p>
                  <p className="text-xs text-gray-400">
                    Get instant AI-powered insights
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={handleClick}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold text-sm shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all duration-300"
                  >
                    <span>Start free</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-active:translate-x-1" strokeWidth={2.5} />
                  </motion.button>

                  <motion.button
                    onClick={handleDismiss}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors duration-200"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </motion.button>
                </div>
              </div>

              {/* Trust indicator */}
              <div className="relative px-5 pb-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>No credit card</span>
                  </div>
                  <span className="text-gray-600">•</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>6-min results</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
