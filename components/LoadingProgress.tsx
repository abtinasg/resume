'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Apple-style loading progress animation for AI resume analysis
 *
 * Features:
 * - Sequential step progression with smooth animations
 * - Three states per step: upcoming (•), in progress (…), completed (✓)
 * - Final success state with gradient glow
 * - Fully responsive and accessible
 */

type StepStatus = 'upcoming' | 'in-progress' | 'completed';

interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

const STEP_DURATION = 1200; // Time per step in milliseconds

const LoadingProgress: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Define the analysis steps
  const stepLabels = [
    'Extracting text from PDF',
    'Cleaning layout and whitespace',
    'Running AI analysis',
    'Generating feedback',
    'Finalizing results',
  ];

  const [steps, setSteps] = useState<Step[]>(
    stepLabels.map((label, index) => ({
      id: `step-${index}`,
      label,
      status: index === 0 ? 'in-progress' : 'upcoming',
    }))
  );

  // Progress through steps sequentially
  useEffect(() => {
    if (currentStepIndex >= stepLabels.length) {
      // All steps complete
      const timer = setTimeout(() => {
        setIsComplete(true);
      }, 400);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setSteps((prevSteps) =>
        prevSteps.map((step, index) => {
          if (index < currentStepIndex) {
            return { ...step, status: 'completed' };
          } else if (index === currentStepIndex) {
            return { ...step, status: 'completed' };
          } else if (index === currentStepIndex + 1) {
            return { ...step, status: 'in-progress' };
          }
          return step;
        })
      );

      setCurrentStepIndex((prev) => prev + 1);
    }, STEP_DURATION);

    return () => clearTimeout(timer);
  }, [currentStepIndex, stepLabels.length]);

  return (
    <div className="flex items-center justify-center min-h-[400px] w-full px-4 py-8">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Progress Steps */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <StepItem
                    key={step.id}
                    step={step}
                    index={index}
                  />
                ))}
              </div>

              {/* Subtle loading indicator text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-center"
              >
                <p className="text-sm text-gray-500 font-medium">
                  This may take a few moments
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <CompletionState />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Individual step item with status indicator
 */
interface StepItemProps {
  step: Step;
  index: number;
}

const StepItem: React.FC<StepItemProps> = ({ step, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      className="flex items-center gap-3"
    >
      {/* Status Icon */}
      <StatusIcon status={step.status} />

      {/* Step Label */}
      <motion.span
        className={`text-base font-medium transition-colors duration-700 ${
          step.status === 'completed'
            ? 'text-gray-700'
            : step.status === 'in-progress'
            ? 'text-indigo-600'
            : 'text-gray-400'
        }`}
        animate={{
          opacity: step.status === 'upcoming' ? 0.5 : 1,
        }}
        transition={{ duration: 0.4 }}
      >
        {step.label}
      </motion.span>
    </motion.div>
  );
};

/**
 * Status icon component with animated states
 */
interface StatusIconProps {
  status: StepStatus;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  return (
    <div className="relative flex items-center justify-center w-6 h-6">
      <AnimatePresence mode="wait">
        {status === 'completed' && (
          <motion.div
            key="checkmark"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-green-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}

        {status === 'in-progress' && (
          <motion.div
            key="ellipsis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              className="text-lg font-bold text-indigo-500 leading-none"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              …
            </motion.span>
          </motion.div>
        )}

        {status === 'upcoming' && (
          <motion.div
            key="bullet"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Completion state with gradient glow effect
 */
const CompletionState: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className="relative py-12"
    >
      {/* Gradient glow background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute inset-0 -z-10"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-green-500/20 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15), rgba(34, 197, 94, 0.15))',
          }}
        />
      </motion.div>

      {/* Success content */}
      <div className="text-center space-y-4">
        {/* Sparkle emoji with bounce */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="flex justify-center"
        >
          <span className="text-5xl" role="img" aria-label="sparkles">
            ✨
          </span>
        </motion.div>

        {/* Success message */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-2xl md:text-3xl font-semibold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Analysis Complete!
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm text-gray-600 font-medium"
        >
          Your results are ready below
        </motion.p>
      </div>
    </motion.div>
  );
};

export default LoadingProgress;
