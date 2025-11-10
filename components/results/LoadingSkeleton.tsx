'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';

/**
 * LoadingSkeleton Component
 * Displays animated shimmer placeholders while analysis data is loading
 */
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      {/* Shimmer animation CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .shimmer {
          animation: shimmer 2s infinite;
          background: linear-gradient(
            to right,
            #f0f0f0 0%,
            #e0e0e0 20%,
            #f0f0f0 40%,
            #f0f0f0 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>

      {/* Loading Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8"
      >
        {/* Animated spinner with gradient glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full" />
          </div>
        </div>

        <motion.h3
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-xl font-semibold text-gray-700 mb-2"
        >
          Analyzing Your Resume...
        </motion.h3>
        <p className="text-sm text-gray-500">
          This won&apos;t take long
        </p>
      </motion.div>

      {/* Tabs Skeleton */}
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Tab Headers Skeleton */}
        <div className="flex border-b border-gray-200 bg-white">
          {['Summary', 'Strengths', 'Suggestions'].map((tab, index) => (
            <div
              key={tab}
              className="px-6 py-3 flex-1"
            >
              <div
                className="shimmer h-5 rounded"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            </div>
          ))}
        </div>

        {/* Tab Content Skeleton */}
        <div className="p-6 bg-white space-y-6">
          {/* Score Circle Skeleton */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-40 h-40">
              <div className="shimmer w-full h-full rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="shimmer w-16 h-8 rounded" />
              </div>
            </div>
            <div className="shimmer mt-4 w-24 h-6 rounded" />
          </div>

          {/* Summary Cards Skeleton */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="shimmer w-4 h-4 rounded-full" />
                  <div className="shimmer h-4 w-32 rounded" />
                </div>
                <div className="shimmer h-4 w-full rounded" />
                <div className="shimmer h-4 w-5/6 rounded" />
                <div className="shimmer h-4 w-4/6 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Subtle loading indicators */}
      <div className="flex justify-center items-center gap-2 py-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
