'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';

interface ComparisonFeature {
  name: string;
  resumeiq: boolean | string;
  resumeWorded: boolean | string;
  jobscan: boolean | string;
  rezi: boolean | string;
}

const ComparisonTable: React.FC = () => {
  const features: ComparisonFeature[] = [
    {
      name: 'AI-Powered Resume Analysis',
      resumeiq: true,
      resumeWorded: true,
      jobscan: true,
      rezi: true,
    },
    {
      name: 'Real-time Score Breakdown',
      resumeiq: true,
      resumeWorded: 'Limited',
      jobscan: true,
      rezi: 'Limited',
    },
    {
      name: 'ATS Optimization',
      resumeiq: true,
      resumeWorded: true,
      jobscan: true,
      rezi: true,
    },
    {
      name: 'Job Description Matching',
      resumeiq: 'Pro Feature',
      resumeWorded: true,
      jobscan: true,
      rezi: 'Premium',
    },
    {
      name: 'Interactive Resume Coach Chat',
      resumeiq: true,
      resumeWorded: false,
      jobscan: false,
      rezi: false,
    },
    {
      name: 'Achievement Badge System',
      resumeiq: true,
      resumeWorded: false,
      jobscan: false,
      rezi: false,
    },
    {
      name: 'Resume Comparison Tool',
      resumeiq: true,
      resumeWorded: false,
      jobscan: false,
      rezi: 'Premium',
    },
    {
      name: 'Detailed Methodology Insights',
      resumeiq: true,
      resumeWorded: 'Basic',
      jobscan: 'Basic',
      rezi: false,
    },
    {
      name: 'Privacy-First (No Data Selling)',
      resumeiq: true,
      resumeWorded: true,
      jobscan: false,
      rezi: true,
    },
    {
      name: 'Unlimited Scans',
      resumeiq: 'Pro Feature',
      resumeWorded: 'Premium',
      jobscan: 'Premium',
      rezi: 'Premium',
    },
    {
      name: 'Monthly Price',
      resumeiq: '$9.99',
      resumeWorded: '$29/mo',
      jobscan: '$49/mo',
      rezi: '$29/mo',
    },
  ];

  const renderCell = (value: boolean | string, isResumeIQ: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={`w-5 h-5 ${isResumeIQ ? 'text-indigo-600' : 'text-green-600'}`} />
      ) : (
        <X className="w-5 h-5 text-gray-300" />
      );
    }

    if (value === 'Limited' || value === 'Basic') {
      return (
        <div className="flex items-center gap-1.5">
          <Minus className="w-5 h-5 text-yellow-500" />
          <span className="text-xs text-gray-500 hidden sm:inline">{value}</span>
        </div>
      );
    }

    return <span className={`text-xs sm:text-sm font-medium ${isResumeIQ ? 'text-indigo-600' : 'text-gray-700'}`}>{value}</span>;
  };

  return (
    <div className="w-full overflow-x-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="min-w-[640px]"
      >
        <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow-xl shadow-gray-200">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <th className="p-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                Feature
              </th>
              <th className="p-4 text-center border-b border-indigo-200 bg-gradient-to-br from-indigo-500 to-purple-500">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white font-bold text-base sm:text-lg">ResumeIQ</span>
                  <span className="text-indigo-100 text-xs font-normal">(You are here)</span>
                </div>
              </th>
              <th className="p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                <span className="hidden sm:inline">Resume Worded</span>
                <span className="sm:hidden">R.Worded</span>
              </th>
              <th className="p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                Jobscan
              </th>
              <th className="p-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
                Rezi
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <motion.tr
                key={feature.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-indigo-50/50 transition-colors duration-200`}
              >
                <td className="p-4 text-sm text-gray-700 font-medium border-b border-gray-100">
                  {feature.name}
                </td>
                <td className="p-4 text-center border-b border-indigo-100 bg-indigo-50/30">
                  <div className="flex justify-center">
                    {renderCell(feature.resumeiq, true)}
                  </div>
                </td>
                <td className="p-4 text-center border-b border-gray-100">
                  <div className="flex justify-center">
                    {renderCell(feature.resumeWorded)}
                  </div>
                </td>
                <td className="p-4 text-center border-b border-gray-100">
                  <div className="flex justify-center">
                    {renderCell(feature.jobscan)}
                  </div>
                </td>
                <td className="p-4 text-center border-b border-gray-100">
                  <div className="flex justify-center">
                    {renderCell(feature.rezi)}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Mobile-friendly note */}
        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200 sm:hidden">
          <p className="text-xs text-gray-600 text-center">
            <span className="font-semibold text-indigo-600">Tip:</span> Scroll horizontally to see all competitors
          </p>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-600" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="w-4 h-4 text-yellow-500" />
            <span>Limited/Basic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <X className="w-4 h-4 text-gray-300" />
            <span>Not Available</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComparisonTable;
