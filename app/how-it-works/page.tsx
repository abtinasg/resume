'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import {
  Upload,
  Sparkles,
  BarChart3,
  Download,
  FileText,
  Brain,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Award,
  Shield,
  Clock,
  Layers,
  Code,
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: 'Upload Your Resume',
      description:
        'Drag and drop your resume PDF or click to browse. We support all standard resume formats and use OCR for scanned documents.',
      icon: <Upload className="w-10 h-10" />,
      color: 'blue',
      features: [
        'Supports PDF files up to 10MB',
        'OCR technology for scanned resumes',
        'Secure, encrypted upload',
        'Instant processing',
      ],
      gradient: 'from-blue-50 to-cyan-50',
      iconBg: 'from-blue-500 to-cyan-500',
    },
    {
      number: 2,
      title: 'AI Analysis Engine',
      description:
        'Our hybrid AI system analyzes your resume using rule-based algorithms and GPT-4o to evaluate structure, content, and ATS compatibility.',
      icon: <Brain className="w-10 h-10" />,
      color: 'purple',
      features: [
        'GPT-4o powered insights',
        'Rule-based scoring (70%)',
        'AI enhancement layer (30%)',
        'Real-time processing in 6 minutes',
      ],
      gradient: 'from-purple-50 to-indigo-50',
      iconBg: 'from-purple-500 to-indigo-500',
    },
    {
      number: 3,
      title: 'Get 3D Score Breakdown',
      description:
        'Receive a comprehensive score from 0-100 broken down across Structure (30%), Content (40%), and Tailoring (30%) dimensions.',
      icon: <BarChart3 className="w-10 h-10" />,
      color: 'green',
      features: [
        'Overall score with letter grade',
        'Section-by-section analysis',
        'ATS pass rate prediction',
        'Interactive 3D visualization',
      ],
      gradient: 'from-green-50 to-emerald-50',
      iconBg: 'from-green-500 to-emerald-500',
    },
    {
      number: 4,
      title: 'Review Actionable Insights',
      description:
        'Get detailed suggestions for improvement, including specific rewrites, missing sections, and keyword optimization.',
      icon: <Target className="w-10 h-10" />,
      color: 'amber',
      features: [
        'Prioritized action items',
        'Bullet point rewrites',
        'Keyword recommendations',
        'Estimated time to improve',
      ],
      gradient: 'from-amber-50 to-yellow-50',
      iconBg: 'from-amber-500 to-yellow-500',
    },
    {
      number: 5,
      title: 'Chat with Resume Coach',
      description:
        'Ask questions and get personalized advice from our AI resume coach. Discuss career strategies, formatting, and industry-specific tips.',
      icon: <MessageCircle className="w-10 h-10" />,
      color: 'pink',
      features: [
        'Unlimited chat sessions',
        'Context-aware responses',
        'Industry-specific advice',
        'Real-time suggestions',
      ],
      gradient: 'from-pink-50 to-rose-50',
      iconBg: 'from-pink-500 to-rose-500',
    },
    {
      number: 6,
      title: 'Improve & Reanalyze',
      description:
        'Make improvements based on recommendations and re-upload to track your progress. Compare versions to see your improvement over time.',
      icon: <TrendingUp className="w-10 h-10" />,
      color: 'teal',
      features: [
        'Unlimited re-scans (Premium)',
        'Version comparison',
        'Progress tracking',
        'Achievement badges',
      ],
      gradient: 'from-teal-50 to-cyan-50',
      iconBg: 'from-teal-500 to-cyan-500',
    },
  ];

  const whyItWorks = [
    {
      icon: <Layers className="w-8 h-8" />,
      title: 'Hybrid AI Approach',
      description:
        'We combine rule-based algorithms (70%) with GPT-4o AI (30%) for the most accurate and consistent scoring.',
      color: 'indigo',
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Transparent Methodology',
      description:
        'Our scoring system is fully transparent. See exactly how we calculate your score and what each metric means.',
      color: 'purple',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Privacy First',
      description:
        'Your data is encrypted and never sold. Delete your resumes anytime. We take your privacy seriously.',
      color: 'green',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Fast Results',
      description:
        'Get comprehensive analysis in 6 minutes. Our optimized pipeline ensures quick turnaround without sacrificing accuracy.',
      color: 'amber',
    },
  ];

  const benefits = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Beat ATS Systems',
      description:
        'Our analysis includes ATS compatibility checks to ensure your resume gets past automated screening.',
      stat: '95%',
      statLabel: 'ATS Pass Rate',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Improve Your Score',
      description:
        'Users who follow our recommendations see an average score improvement of 25+ points.',
      stat: '+25',
      statLabel: 'Average Improvement',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Stand Out',
      description:
        'Earn achievement badges for resume milestones and showcase your dedication to quality.',
      stat: '12',
      statLabel: 'Unique Badges',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
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
              AI-Powered Resume Analysis
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              How{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ResumeIQ
              </span>{' '}
              Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From upload to improved resume in 6 simple steps. Our AI-powered platform makes it
              easy to create a resume that gets you interviews.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            {[
              { icon: <Clock className="w-8 h-8" />, value: '6 min', label: 'Average Analysis Time' },
              { icon: <Brain className="w-8 h-8" />, value: 'GPT-4o', label: 'AI Technology' },
              { icon: <CheckCircle2 className="w-8 h-8" />, value: '95%', label: 'User Satisfaction' },
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

      {/* Step-by-Step Process */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The ResumeIQ Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow these 6 simple steps to transform your resume and land more interviews
            </p>
          </motion.div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <div
                  className={`flex flex-col ${
                    idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } gap-8 items-center`}
                >
                  {/* Icon & Number */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div
                        className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.iconBg} flex items-center justify-center text-white shadow-2xl`}
                      >
                        {step.icon}
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {step.number}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <Card
                    className={`flex-1 p-8 bg-gradient-to-br ${step.gradient} border-2 hover:shadow-xl transition-shadow`}
                  >
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {step.features.map((feature, featureIdx) => (
                        <div key={featureIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Connector Arrow */}
                {idx < steps.length - 1 && (
                  <div className="flex justify-center my-8">
                    <ArrowRight className="w-8 h-8 text-gray-300 rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Works */}
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
              Why Our Approach Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The science and technology behind ResumeIQ's accurate resume analysis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyItWorks.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow border-2 border-gray-200">
                  <div className={`w-14 h-14 rounded-xl bg-${item.color}-100 flex items-center justify-center text-${item.color}-600 mb-4`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The ResumeIQ Advantage
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real results from real users who improved their resumes with ResumeIQ
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <Card className="p-8 h-full hover:shadow-xl transition-shadow border-2 border-indigo-200 bg-white">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{benefit.description}</p>
                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                      {benefit.stat}
                    </div>
                    <div className="text-sm text-gray-600">{benefit.statLabel}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video/Demo Section Placeholder */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center">
              <FileText className="w-16 h-16 mx-auto mb-6 text-indigo-400" />
              <h2 className="text-3xl font-bold mb-4">See ResumeIQ in Action</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Watch how our AI analyzes resumes and provides actionable insights in real-time.
              </p>
              <div className="aspect-video bg-gray-700 rounded-2xl flex items-center justify-center border-4 border-gray-600">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                  <p className="text-gray-400">Demo video coming soon</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
            <Zap className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have improved their resumes with ResumeIQ.
              Start with 3 free scans today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-10 py-4 text-lg"
                onClick={() => (window.location.href = '/')}
              >
                Upload Your Resume
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Button>
              <Button
                variant="secondary"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-10 py-4 text-lg"
                onClick={() => (window.location.href = '/methodology')}
              >
                View Methodology
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
