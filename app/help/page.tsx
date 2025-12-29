'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, HelpCircle, Mail } from 'lucide-react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface AccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors px-4 -mx-4 rounded-lg"
      >
        <span className="font-medium text-gray-800">{item.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="pb-4 text-gray-600 leading-relaxed"
        >
          {item.answer}
        </motion.div>
      )}
    </div>
  );
}

interface FAQSectionProps {
  title: string;
  items: FAQItem[];
}

function FAQSection({ title, items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <Card className="!p-6">
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </Card>
    </div>
  );
}

export default function HelpPage() {
  const gettingStartedFAQs: FAQItem[] = [
    {
      question: 'How do I upload my resume?',
      answer: (
        <div>
          <p className="mb-2">
            You can upload your resume from the Dashboard or the home page by clicking the &quot;Analyze Resume&quot; button. Simply drag and drop your file or click to browse your files.
          </p>
          <p>
            <strong>Supported file formats:</strong> PDF, DOCX, and TXT files.
          </p>
        </div>
      ),
    },
    {
      question: 'What file types are supported?',
      answer: (
        <div>
          <p className="mb-2">We support the following file formats:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>PDF</strong> - Recommended for best formatting preservation</li>
            <li><strong>DOCX</strong> - Microsoft Word documents</li>
            <li><strong>TXT</strong> - Plain text files</li>
          </ul>
        </div>
      ),
    },
    {
      question: 'How is my resume scored?',
      answer: (
        <div>
          <p className="mb-3">
            Your resume is evaluated using our comprehensive AI-powered scoring system that analyzes four key dimensions:
          </p>
          <ul className="space-y-2">
            <li><strong>Content Quality:</strong> Measures the strength of your accomplishments, action verbs, and quantified results.</li>
            <li><strong>ATS Compatibility:</strong> Evaluates how well your resume will perform with Applicant Tracking Systems.</li>
            <li><strong>Impact &amp; Metrics:</strong> Assesses the use of data and measurable achievements.</li>
            <li><strong>Professional Presentation:</strong> Reviews formatting, structure, and overall clarity.</li>
          </ul>
        </div>
      ),
    },
  ];

  const strategyModesFAQs: FAQItem[] = [
    {
      question: 'What is IMPROVE_RESUME_FIRST mode?',
      answer: (
        <div>
          <p className="mb-2">
            This mode is recommended when your resume score is below the recommended threshold. The system guides you to strengthen your resume before applying to jobs, ensuring you put your best foot forward.
          </p>
          <p>
            <strong>Triggered when:</strong> Resume score is below 70, or key improvements are identified.
          </p>
        </div>
      ),
    },
    {
      question: 'What is APPLY_MODE?',
      answer: (
        <div>
          <p className="mb-2">
            Apply mode is activated when your resume is strong enough to start applying to jobs. In this mode, you&apos;ll receive job recommendations and application tracking features.
          </p>
          <p>
            <strong>Activated when:</strong> Resume score is 70 or above and core improvements are addressed.
          </p>
        </div>
      ),
    },
    {
      question: 'What is RETHINK_TARGETS mode?',
      answer: (
        <div>
          <p className="mb-2">
            This mode helps you reassess your job targets if you&apos;re not getting the results you expected. It provides guidance on adjusting your target roles, industries, or locations.
          </p>
          <p>
            <strong>Activated when:</strong> Application success rate is low or fit scores consistently don&apos;t match expectations.
          </p>
        </div>
      ),
    },
    {
      question: 'How does the strategy system decide my mode?',
      answer: (
        <p>
          The system considers multiple factors including your resume score, application history, interview rate, and fit scores with saved jobs. It dynamically adjusts recommendations based on your progress and results.
        </p>
      ),
    },
  ];

  const jobDiscoveryFAQs: FAQItem[] = [
    {
      question: 'How do I add a job to track?',
      answer: (
        <p>
          On the Jobs page, click &quot;Paste New Job&quot; and paste the job description or URL. Our AI will automatically extract the key information and calculate your fit score.
        </p>
      ),
    },
    {
      question: 'How is the fit score calculated?',
      answer: (
        <p>
          The fit score compares your resume against the job requirements, analyzing skill matches, experience alignment, and keyword overlap. It provides a percentage indicating how well your profile matches the position.
        </p>
      ),
    },
    {
      question: 'What do the job categories mean?',
      answer: (
        <div>
          <p className="mb-3">Jobs are categorized based on your fit score:</p>
          <ul className="space-y-2">
            <li><strong>Target (80%+):</strong> Excellent match - prioritize these applications</li>
            <li><strong>Reach (60-79%):</strong> Good match with some gaps - worth applying with tailoring</li>
            <li><strong>Safety (40-59%):</strong> Moderate match - consider as backup options</li>
            <li><strong>Avoid (&lt;40%):</strong> Poor match - focus your energy elsewhere</li>
          </ul>
        </div>
      ),
    },
    {
      question: 'What is Career Capital analysis?',
      answer: (
        <div>
          <p className="mb-3">Career Capital evaluates jobs beyond just fit score, considering:</p>
          <ul className="space-y-2">
            <li><strong>Brand Value:</strong> Company reputation and impact on your profile</li>
            <li><strong>Skill Growth:</strong> Learning opportunities and new technologies</li>
            <li><strong>Network Opportunity:</strong> Quality of professional connections</li>
            <li><strong>Compensation Trajectory:</strong> Long-term earning potential</li>
          </ul>
        </div>
      ),
    },
  ];

  const privacyFAQs: FAQItem[] = [
    {
      question: 'How is my data secured?',
      answer: (
        <p>
          All data is encrypted in transit and at rest using industry-standard encryption. We implement strict access controls and regular security audits to protect your information.
        </p>
      ),
    },
    {
      question: 'Who can see my resume and data?',
      answer: (
        <p>
          Your data is private and only visible to you. We do not share your information with third parties without your explicit consent. Our AI analysis is performed securely without exposing your data.
        </p>
      ),
    },
    {
      question: 'How can I delete my account?',
      answer: (
        <p>
          You can request account deletion from your Profile settings. Upon deletion, all your resumes, job data, and analysis history will be permanently removed from our systems within 30 days.
        </p>
      ),
    },
    {
      question: 'How does AI analysis work with my data?',
      answer: (
        <div>
          <p className="mb-2">
            Our AI follows an <strong>evidence-anchoring principle</strong>: all feedback and suggestions are derived directly from what&apos;s in your resume. We don&apos;t make assumptions or use external data.
          </p>
          <p>
            Your resume content is processed securely and is not used to train our AI models.
          </p>
        </div>
      ),
    },
  ];

  const technicalFAQs: FAQItem[] = [
    {
      question: 'Which browsers are supported?',
      answer: (
        <div>
          <p className="mb-2">ResumeIQ works best on modern browsers:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Google Chrome (recommended)</li>
            <li>Mozilla Firefox</li>
            <li>Microsoft Edge</li>
            <li>Safari</li>
          </ul>
          <p className="mt-2 text-sm text-gray-500">
            We recommend keeping your browser updated to the latest version.
          </p>
        </div>
      ),
    },
    {
      question: 'Is there a mobile app?',
      answer: (
        <p>
          Currently, ResumeIQ is available as a web application optimized for both desktop and mobile browsers. A native mobile app is on our roadmap for future development.
        </p>
      ),
    },
    {
      question: 'Can I export my data?',
      answer: (
        <div>
          <p className="mb-2">
            Yes! You can export your data from the Analytics page. Available export formats include:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>PDF reports of your resume analysis</li>
            <li>CSV exports of your job tracking data</li>
            <li>JSON format for complete data portability</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Help Center</h1>
          <p className="text-gray-600 text-lg">
            Find answers to common questions about ResumeIQ
          </p>
        </motion.div>

        {/* FAQ Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <FAQSection title="Getting Started" items={gettingStartedFAQs} />
          <FAQSection title="Strategy Modes" items={strategyModesFAQs} />
          <FAQSection title="Job Discovery" items={jobDiscoveryFAQs} />
          <FAQSection title="Privacy & Security" items={privacyFAQs} />
          <FAQSection title="Technical Support" items={technicalFAQs} />
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="!bg-gradient-to-br !from-blue-50 !to-indigo-50 !border-blue-200 text-center !p-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you succeed in your job search.
            </p>
            <Button className="!bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700">
              Contact Support
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
