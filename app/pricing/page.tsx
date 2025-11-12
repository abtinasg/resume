'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ComparisonTable from '@/components/ComparisonTable';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import {
  Check,
  X,
  Crown,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Shield,
  ChevronDown,
  Star,
  Rocket,
  Users,
  MessageCircle,
} from 'lucide-react';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  features: (string | { text: string; available: boolean })[];
  highlighted?: boolean;
  cta: string;
  badge?: string;
  gradient: string;
  buttonGradient: string;
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<
    { type: 'success' | 'error'; text: string } | null
  >(null);
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleTierSelection = async (tierName: PricingTier['name']) => {
    setActionMessage(null);

    if (tierName === 'Free') {
      if (!isAuthenticated) {
        router.push('/auth/register?redirect=/pricing');
        return;
      }

      setActionMessage({
        type: 'success',
        text: 'You already have access to the Free plan with your account.',
      });
      return;
    }

    const tierMap: Record<'Premium' | 'Pro+', 'premium' | 'pro_plus'> = {
      Premium: 'premium',
      'Pro+': 'pro_plus',
    };

    const selectedTier = tierMap[tierName as 'Premium' | 'Pro+'];

    if (!selectedTier) {
      return;
    }

    if (!isAuthenticated) {
      const redirectTarget = `/pricing?plan=${selectedTier}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    setLoadingTier(tierName);

    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: selectedTier,
          periodInDays: billingCycle === 'yearly' ? 365 : 30,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error?.message || 'Unable to update your subscription right now.'
        );
      }

      await checkAuth();

      setActionMessage({
        type: 'success',
        text:
          tierName === 'Premium'
            ? 'Awesome! Your Premium subscription is now active.'
            : 'Welcome to Pro+! Every ResumeIQ feature is now unlocked for you.',
      });
    } catch (error) {
      console.error('Subscription upgrade failed:', error);
      setActionMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Something went wrong while upgrading your subscription. Please try again.',
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const pricingTiers: PricingTier[] = [
    {
      name: 'Free',
      price: billingCycle === 'monthly' ? '$0' : '$0',
      description: 'Perfect for trying out ResumeIQ',
      icon: <Target className="w-8 h-8" />,
      features: [
        '3 resume scans per month',
        'Basic AI analysis',
        'Structure & content scores',
        'ATS compatibility check',
        { text: 'Job description matching', available: false },
        { text: 'Resume coach chat', available: false },
        { text: 'Achievement badges', available: false },
        { text: 'Priority support', available: false },
      ],
      cta: 'Get Started Free',
      gradient: 'from-gray-50 to-gray-100',
      buttonGradient: 'from-gray-600 to-gray-700',
    },
    {
      name: 'Premium',
      price: billingCycle === 'monthly' ? '$9.99' : '$99',
      description: 'Best for active job seekers',
      icon: <Sparkles className="w-8 h-8" />,
      features: [
        'Unlimited resume scans',
        'Advanced AI analysis with GPT-4o',
        'Detailed score breakdown',
        'ATS optimization tips',
        'Job description matching',
        'Interactive resume coach chat',
        'Achievement badge system',
        'Resume comparison tool',
        { text: 'Priority email support', available: false },
        { text: 'Custom templates', available: false },
      ],
      highlighted: true,
      badge: 'Most Popular',
      cta: 'Start Free Trial',
      gradient: 'from-indigo-50 to-purple-50',
      buttonGradient: 'from-indigo-500 to-purple-600',
    },
    {
      name: 'Pro+',
      price: billingCycle === 'monthly' ? '$19.99' : '$199',
      description: 'For career professionals',
      icon: <Crown className="w-8 h-8" />,
      features: [
        'Everything in Premium',
        'Priority AI processing',
        'Custom resume templates',
        'LinkedIn profile optimization',
        'Cover letter analysis',
        'Interview preparation tips',
        'Career path recommendations',
        'Priority support (24h response)',
        'Monthly 1-on-1 consultation',
        'Resume version history',
      ],
      badge: 'Best Value',
      cta: 'Go Pro+',
      gradient: 'from-amber-50 to-yellow-50',
      buttonGradient: 'from-amber-500 to-yellow-500',
    },
  ];

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer:
        'Start with 3 free resume scans to experience our AI-powered analysis. No credit card required. Upgrade anytime to unlock unlimited scans and premium features.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer:
        "Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period.",
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and PayPal. Payments are processed securely through Stripe.',
    },
    {
      question: 'Is my resume data secure?',
      answer:
        'Absolutely. We use enterprise-grade encryption and never sell your data. Your resumes are stored securely and only used to provide analysis. You can delete your data anytime.',
    },
    {
      question: 'What makes ResumeIQ better than competitors?',
      answer:
        "ResumeIQ combines rule-based analysis with GPT-4o AI for the most accurate scoring. We offer unique features like achievement badges, interactive resume coach, and transparent methodology. Plus, we're more affordable than Resume Worded ($29/mo) and Jobscan ($49/mo).",
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'Yes! We offer a 14-day money-back guarantee. If you\'re not satisfied with Premium or Pro+ within the first 14 days, contact us for a full refund.',
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer:
        'Yes, you can change your plan at any time. When upgrading, you\'ll be charged a prorated amount. When downgrading, the change takes effect at your next billing cycle.',
    },
    {
      question: 'What is included in the 1-on-1 consultation?',
      answer:
        'Pro+ members get a monthly 30-minute video consultation with our career experts to review your resume, discuss career strategies, and get personalized advice.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 inline mr-2" />
              14-Day Money Back Guarantee
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Simple,{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Transparent
              </span>{' '}
              Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the plan that fits your career goals. All plans include our AI-powered resume
              analysis. Upgrade or cancel anytime.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <span
              className={`text-sm font-medium ${
                billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')
              }
              className="relative w-14 h-7 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300 shadow-lg"
            >
              <motion.div
                animate={{ x: billingCycle === 'monthly' ? 2 : 30 }}
                transition={{ duration: 0.3 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
            <span
              className={`text-sm font-medium ${
                billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Yearly
            </span>
            <Badge className="bg-green-100 text-green-700 border border-green-200">
              Save 17%
            </Badge>
          </motion.div>

          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <div
                className={`rounded-xl border px-4 py-3 text-sm md:text-base ${
                  actionMessage.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {actionMessage.text}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, idx) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`relative ${tier.highlighted ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-1 shadow-lg">
                      <Star className="w-3 h-3 inline mr-1" />
                      {tier.badge}
                    </Badge>
                  </div>
                )}
                <Card
                  className={`p-8 h-full hover:shadow-2xl transition-all duration-300 ${
                    tier.highlighted
                      ? 'border-4 border-indigo-500 shadow-xl'
                      : 'border-2 border-gray-200'
                  } bg-gradient-to-br ${tier.gradient}`}
                >
                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${tier.buttonGradient} text-white mb-4`}
                    >
                      {tier.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                      <span className="text-gray-600">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && tier.price !== '$0' && (
                      <p className="text-sm text-gray-500 mt-2">
                        Billed annually (
                        {tier.name === 'Premium' ? '$8.25/mo' : '$16.58/mo'})
                      </p>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    className={`w-full mb-6 bg-gradient-to-r ${tier.buttonGradient} text-white hover:scale-105`}
                    onClick={() => handleTierSelection(tier.name)}
                    disabled={loadingTier !== null}
                  >
                    {loadingTier === tier.name ? 'Processing...' : tier.cta}
                  </Button>

                  <div className="space-y-3">
                    {tier.features.map((feature, featureIdx) => {
                      const isObject = typeof feature === 'object';
                      const text = isObject ? feature.text : feature;
                      const available = isObject ? feature.available : true;

                      return (
                        <div
                          key={featureIdx}
                          className="flex items-start gap-3"
                        >
                          {available ? (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm ${
                              available ? 'text-gray-700' : 'text-gray-400'
                            }`}
                          >
                            {text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Users className="w-8 h-8" />, value: '10,000+', label: 'Happy Users' },
              { icon: <Star className="w-8 h-8" />, value: '4.9/5', label: 'Average Rating' },
              { icon: <Shield className="w-8 h-8" />, value: '100%', label: 'Secure & Private' },
              { icon: <Rocket className="w-8 h-8" />, value: '14-Day', label: 'Money Back' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-indigo-600">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
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
              How We Compare to Competitors
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See why ResumeIQ offers more features at a better price than Resume Worded, Jobscan,
              and Rezi.
            </p>
          </motion.div>

          <ComparisonTable />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about ResumeIQ pricing
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200">
                  <button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                          expandedFAQ === idx ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>
                  {expandedFAQ === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Ready to Land Your Dream Job?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have improved their resumes with ResumeIQ.
              Start with 3 free scans today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
                onClick={() => (window.location.href = '/')}
              >
                Start Free Trial
              </Button>
              <Button
                variant="secondary"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg"
                onClick={() => (window.location.href = '/methodology')}
              >
                Learn More
              </Button>
            </div>
            <p className="text-sm text-indigo-200 mt-6">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              Have questions? <a href="mailto:support@resumeiq.com" className="underline">Contact us</a>
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
