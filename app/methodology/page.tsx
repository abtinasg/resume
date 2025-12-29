'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ScoringCalculator from '@/components/ScoringCalculator';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import {
  Target,
  Award,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Lightbulb,
  Code,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Shield,
  Brain,
  Layers,
} from 'lucide-react';

export default function MethodologyPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const scoreRanges = [
    {
      grade: 'A',
      range: '90-100',
      color: 'bg-green-500',
      label: 'Excellent',
      atsPass: '95%',
      description: 'Outstanding resume ready for top companies',
    },
    {
      grade: 'B',
      range: '80-89',
      color: 'bg-green-400',
      label: 'Good',
      atsPass: '80%',
      description: 'Strong resume with minor improvements needed',
    },
    {
      grade: 'C',
      range: '70-79',
      color: 'bg-yellow-500',
      label: 'Fair',
      atsPass: '65%',
      description: 'Decent resume requiring moderate improvements',
    },
    {
      grade: 'D',
      range: '60-69',
      color: 'bg-orange-500',
      label: 'Needs Work',
      atsPass: '40%',
      description: 'Resume needs significant improvements',
    },
    {
      grade: 'F',
      range: '0-59',
      color: 'bg-red-500',
      label: 'Poor',
      atsPass: '15%',
      description: 'Major revision required',
    },
  ];

  const scoringComponents = [
    {
      id: 'structure',
      title: 'Structure Score',
      maxPoints: 40,
      weight: '30%',
      icon: <Target className="w-6 h-6" />,
      color: 'blue',
      description: 'Evaluates the completeness and organization of your resume sections',
      subComponents: [
        {
          name: 'Essential Sections',
          points: '8 points each',
          details: 'Summary, Experience, Skills, Education, Contact Information',
        },
        {
          name: 'Section Order',
          points: 'Weighted',
          details: 'Logical flow: Contact → Summary → Experience → Skills → Education',
        },
        {
          name: 'Completeness',
          points: 'Calculated',
          details: 'All critical sections present and properly formatted',
        },
      ],
      examples: [
        'Missing education section: -8 points',
        'No professional summary: -8 points',
        'Contact info incomplete: -8 points',
      ],
    },
    {
      id: 'content',
      title: 'Content Score',
      maxPoints: 60,
      weight: '40%',
      icon: <Award className="w-6 h-6" />,
      color: 'green',
      description: 'Analyzes the quality, clarity, and impact of your resume content',
      subComponents: [
        {
          name: 'Quantified Achievements',
          points: '25 points',
          details: 'Percentage of bullets with metrics (target: 60%+)',
        },
        {
          name: 'Action Verb Strength',
          points: '20 points',
          details: 'Strong verbs: Led, Designed, Architected (vs Helped, Did, Worked)',
        },
        {
          name: 'Clarity & Readability',
          points: '10 points',
          details: 'Optimal bullet length: 15-25 words',
        },
        {
          name: 'Impact Score',
          points: '5 points',
          details: 'Combined quantification and verb strength',
        },
      ],
      examples: [
        '"Increased sales by 35%" vs "Improved sales"',
        '"Led team of 12" vs "Worked with team"',
        '"Cut costs by $50K" vs "Reduced expenses"',
      ],
    },
    {
      id: 'tailoring',
      title: 'Tailoring Score',
      maxPoints: 40,
      weight: '30%',
      icon: <Zap className="w-6 h-6" />,
      color: 'purple',
      description: 'Measures alignment with job descriptions and role-specific keywords',
      subComponents: [
        {
          name: 'Keyword Match',
          points: '40 points',
          details: 'Must-have keywords: 60%, Important: 30%, Nice-to-have: 10%',
        },
        {
          name: 'Role Relevance',
          points: 'Weighted',
          details: 'Skills and experience matching target role',
        },
        {
          name: 'Industry Terms',
          points: 'Bonus',
          details: 'Proper use of industry-specific terminology',
        },
      ],
      examples: [
        'Software Engineer: React, Node.js, AWS, TypeScript',
        'Product Manager: Roadmap, Stakeholder, OKRs, Agile',
        'Data Scientist: Python, ML, TensorFlow, SQL',
      ],
    },
  ];

  const algorithmSteps = [
    {
      step: 1,
      title: 'Text Extraction & Parsing',
      description: 'Extract text from PDF using reliable parsing algorithms',
      icon: <FileText className="w-6 h-6" />,
      details: [
        'PDF text extraction with pdf-parse',
        'Image OCR for mobile captures (Tesseract)',
        'Section detection using pattern matching',
        'Bullet point extraction',
      ],
    },
    {
      step: 2,
      title: 'Local Analysis Engine',
      description: 'Rule-based scoring using proven metrics and patterns',
      icon: <Code className="w-6 h-6" />,
      details: [
        'Count essential sections (5 total)',
        'Analyze quantification ratio in bullets',
        'Categorize action verbs (Strong/Medium/Weak)',
        'Calculate clarity score (word count analysis)',
        'Match keywords against role database',
      ],
    },
    {
      step: 3,
      title: 'AI Enhancement Layer',
      description: 'GPT-4o validates and enhances scoring with context understanding',
      icon: <Brain className="w-6 h-6" />,
      details: [
        'Validate local scores for accuracy',
        'Generate executive summary',
        'Create actionable improvement suggestions',
        'Provide bullet point rewrites',
        'Estimate improvement timeframes',
      ],
    },
    {
      step: 4,
      title: 'Hybrid Score Calculation',
      description: 'Combine local and AI scores for maximum accuracy',
      icon: <Layers className="w-6 h-6" />,
      details: [
        'Weighted average: 70% local + 30% AI',
        'Cross-validation between systems',
        'Confidence scoring',
        'Final grade assignment (A+ to F)',
      ],
    },
  ];

  const roleWeights = [
    {
      role: 'Product Manager',
      weights: { content: 50, ats: 30, format: 10, impact: 10 },
      focus: 'Strategic thinking and outcomes in content',
    },
    {
      role: 'Software Engineer',
      weights: { content: 35, ats: 40, format: 15, impact: 10 },
      focus: 'Technical keywords crucial for ATS',
    },
    {
      role: 'Data Scientist',
      weights: { content: 40, ats: 35, format: 15, impact: 10 },
      focus: 'Analytical thinking and ML keywords',
    },
    {
      role: 'Sales Manager',
      weights: { content: 40, ats: 30, format: 15, impact: 15 },
      focus: 'Revenue metrics very important',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 inline mr-2" />
              AI-Powered Scoring System
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Our Scoring{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Methodology
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover how our 3D scoring algorithm analyzes your resume across Structure,
              Content, and Tailoring to provide actionable insights that get you hired.
            </p>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            {[
              { icon: <BarChart3 className="w-8 h-8" />, value: '3D', label: 'Scoring Dimensions' },
              { icon: <Brain className="w-8 h-8" />, value: 'GPT-4o', label: 'AI Model' },
              { icon: <Shield className="w-8 h-8" />, value: '95%', label: 'Accuracy Rate' },
            ].map((metric, idx) => (
              <Card
                key={idx}
                className="p-6 bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-shadow"
              >
                <div className="text-indigo-600 mb-3 flex justify-center">{metric.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
                <div className="text-gray-600">{metric.label}</div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3D Scoring System Overview */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The 3D Scoring System
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our proprietary algorithm evaluates your resume across three critical dimensions,
              providing a comprehensive score from 0-100.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {scoringComponents.map((component, idx) => (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-shadow border-2">
                  <div
                    className={`w-14 h-14 rounded-lg bg-${component.color}-100 flex items-center justify-center text-${component.color}-600 mb-4`}
                  >
                    {component.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {component.title}
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`bg-${component.color}-100 text-${component.color}-700 border border-${component.color}-200`}>
                      Max: {component.maxPoints} points
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 border">
                      Weight: {component.weight}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-6">{component.description}</p>

                  {/* Sub-components */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-gray-900 text-sm">Components:</h4>
                    {component.subComponents.map((sub, subIdx) => (
                      <div key={subIdx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {sub.name}
                          </span>
                          <span className="text-xs font-semibold text-indigo-600">
                            {sub.points}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{sub.details}</p>
                      </div>
                    ))}
                  </div>

                  {/* Examples */}
                  <div
                    className={`bg-${component.color}-50 p-4 rounded-lg border border-${component.color}-200`}
                  >
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Examples:
                    </h4>
                    <ul className="space-y-1">
                      {component.examples.map((example, exIdx) => (
                        <li key={exIdx} className="text-xs text-gray-700 flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5 text-green-600" />
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Score Calculation Formula */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
              Score Calculation Formula
            </h2>
            <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-block bg-white px-6 py-4 rounded-lg shadow-md">
                    <p className="text-sm text-gray-600 mb-2">Overall Score Formula:</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">
                      (Structure/40 × 0.3 + Content/60 × 0.4 + Tailoring/40 × 0.3) × 100
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                    <div className="text-blue-600 font-semibold mb-2">Structure (30%)</div>
                    <div className="text-sm text-gray-600">
                      Score ÷ 40 × 30 = Contribution
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                    <div className="text-green-600 font-semibold mb-2">Content (40%)</div>
                    <div className="text-sm text-gray-600">
                      Score ÷ 60 × 40 = Contribution
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                    <div className="text-purple-600 font-semibold mb-2">Tailoring (30%)</div>
                    <div className="text-sm text-gray-600">
                      Score ÷ 40 × 30 = Contribution
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Example Calculation:</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Structure: 32/40</span>
                      <span className="text-blue-600">= 32/40 × 30 = 24 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Content: 48/60</span>
                      <span className="text-green-600">= 48/60 × 40 = 32 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tailoring: 28/40</span>
                      <span className="text-purple-600">= 28/40 × 30 = 21 points</span>
                    </div>
                    <div className="border-t-2 border-gray-300 my-2"></div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-900">Overall Score:</span>
                      <span className="text-indigo-600">24 + 32 + 21 = 77/100 (C+)</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Algorithm Steps */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Our Algorithm Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A four-step process combining rule-based analysis with AI enhancement for
              maximum accuracy and actionable insights.
            </p>
          </motion.div>

          <div className="space-y-6">
            {algorithmSteps.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-indigo-600">{step.icon}</div>
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      <button
                        onClick={() => toggleSection(`step-${step.step}`)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {expandedSection === `step-${step.step}` ? 'Hide' : 'Show'} Details
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedSection === `step-${step.step}` ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedSection === `step-${step.step}` && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 bg-gray-50 p-4 rounded-lg"
                        >
                          <ul className="space-y-2">
                            {step.details.map((detail, detailIdx) => (
                              <li key={detailIdx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Score Ranges & Grading */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Score Ranges & ATS Pass Rates
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Understand what your score means and the likelihood of passing ATS systems.
            </p>
          </motion.div>

          <div className="space-y-4">
            {scoreRanges.map((range, idx) => (
              <motion.div
                key={range.grade}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-20 h-20 ${range.color} rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-lg`}
                      >
                        {range.grade}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {range.range}
                          </span>
                          <Badge className="bg-gray-100 text-gray-700">
                            {range.label}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{range.description}</p>
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-4 rounded-lg border-2 border-green-200">
                      <div className="text-sm text-gray-600 mb-1">ATS Pass Rate</div>
                      <div className="text-3xl font-bold text-green-600">{range.atsPass}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Specific Weights */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Role-Specific Weights
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our algorithm adapts scoring weights based on the target role, emphasizing
              what matters most for each position.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roleWeights.map((role, idx) => (
              <motion.div
                key={role.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{role.role}</h3>
                  <div className="space-y-3 mb-4">
                    {Object.entries(role.weights).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key === 'ats' ? 'ATS' : key}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{value}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Focus:</span> {role.focus}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Try It Yourself
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Interactive Scoring Calculator
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experiment with different improvements and see how they impact your overall score in real-time.
            </p>
          </motion.div>

          <ScoringCalculator />
        </div>
      </section>
    </div>
  );
}
