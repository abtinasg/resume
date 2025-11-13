'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import {
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  User,
  AtSign,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to send message');
        return;
      }

      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err: any) {
      console.error('Contact form error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Get in Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contact{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Us
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have a question, feedback, or need support? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Message sent!</h4>
                    <p className="text-green-700 text-sm">
                      Thank you for contacting us. We'll get back to you soon.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your name"
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <AtSign className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    minLength={5}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Tell us what's on your mind..."
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.message.length} characters
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Why Contact Us */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why contact us?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Technical Support</h4>
                    <p className="text-gray-600 text-sm">
                      Having issues with the app? We're here to help resolve any technical problems.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Billing Questions</h4>
                    <p className="text-gray-600 text-sm">
                      Questions about subscriptions, payments, or refunds? Get quick answers.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Feature Requests</h4>
                    <p className="text-gray-600 text-sm">
                      Have an idea for a new feature? We'd love to hear your suggestions.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">General Feedback</h4>
                    <p className="text-gray-600 text-sm">
                      Share your thoughts on how we can improve your experience.
                    </p>
                  </div>
                </li>
              </ul>
            </Card>

            {/* Response Time */}
            <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Response Time</h3>
                  <p className="text-sm text-gray-600">We typically respond within 24 hours</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Our team reviews all messages and aims to provide helpful responses as quickly as possible.
                For urgent matters, please include "URGENT" in your message.
              </p>
            </Card>

            {/* Alternative Support */}
            <Card className="p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Other ways to get help</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="/methodology"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Check our Methodology page
                  </a>{' '}
                  <span className="text-gray-600">
                    to understand how resume scoring works
                  </span>
                </li>
                <li>
                  <a
                    href="/how-it-works"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Read the How It Works guide
                  </a>{' '}
                  <span className="text-gray-600">
                    for step-by-step instructions
                  </span>
                </li>
                <li>
                  <a
                    href="/insights"
                    className="text-indigo-600 hover:text-indigo-700 underline"
                  >
                    Browse our Insights
                  </a>{' '}
                  <span className="text-gray-600">
                    for resume tips and career advice
                  </span>
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
