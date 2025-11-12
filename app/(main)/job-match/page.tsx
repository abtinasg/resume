'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Target,
  Zap,
  Clock,
  Loader2,
  ArrowRight,
  Award,
  BarChart3,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface JobMatchAnalysis {
  matchScore: number;
  summary: {
    overview: string;
    topStrengths: string[];
    topGaps: string[];
    recommendation: string;
  };
  skillMatch: {
    matched: string[];
    missing: string[];
    transferable: string[];
  };
  keywordAnalysis: {
    requiredKeywords: {
      keyword: string;
      found: boolean;
      importance: 'critical' | 'high' | 'medium';
    }[];
    coverageScore: number;
  };
  experienceMatch: {
    score: number;
    analysis: string;
    gaps: string[];
  };
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionSteps: string[];
  }[];
  tailoringGuide: {
    sectionsToEmphasize: string[];
    phrasesToInclude: string[];
    skillsToHighlight: string[];
  };
}

interface UsageInfo {
  hasAccess: boolean;
  usage: {
    remaining: number;
    limit: number;
    allowed: boolean;
  };
  subscription?: {
    tier: string;
    status: string;
  };
}

export default function JobMatchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  // Fetch usage info on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsageInfo();
    } else if (status === 'unauthenticated') {
      setLoadingUsage(false);
    }
  }, [status]);

  const fetchUsageInfo = async () => {
    try {
      setLoadingUsage(true);
      const response = await fetch('/api/job-match');
      const data = await response.json();

      if (data.success) {
        setUsageInfo(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch usage info:', err);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both resume text and job description');
      return;
    }

    if (!session) {
      router.push('/auth/login?callbackUrl=/job-match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAnalysis(null);

      const response = await fetch('/api/job-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'PREMIUM_FEATURE') {
          setError('Job matching is a premium feature. Please upgrade your subscription.');
        } else if (data.error?.code === 'USAGE_LIMIT_REACHED') {
          setError(`You've reached your job match limit for this period. ${data.error.remaining || 0} matches remaining.`);
        } else {
          setError(data.error?.message || 'Failed to analyze job match');
        }
        return;
      }

      if (data.success && data.data) {
        setAnalysis(data.data);
        // Refresh usage info
        await fetchUsageInfo();
      } else {
        setError('Failed to analyze job match');
      }
    } catch (err: any) {
      console.error('Job match error:', err);
      setError('An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getImportanceColor = (importance: string) => {
    if (importance === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (importance === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-700';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  // Redirect if not authenticated
  if (status === 'loading' || loadingUsage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2">
            <Sparkles className="w-4 h-4 inline mr-2" />
            AI-Powered Job Matching
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Job Description{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Matcher
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get AI-powered insights on how well your resume matches a specific job description
          </p>

          {/* Usage Info */}
          {usageInfo && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Badge className="bg-indigo-100 text-indigo-700">
                {usageInfo.subscription?.tier.toUpperCase() || 'FREE'} Plan
              </Badge>
              <Badge className="bg-gray-100 text-gray-700">
                {usageInfo.usage.remaining} / {usageInfo.usage.limit} matches remaining
              </Badge>
            </div>
          )}
        </motion.div>

        {/* Premium Feature Notice */}
        {usageInfo && !usageInfo.hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="p-8 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <div className="flex items-start gap-4">
                <Award className="w-12 h-12 text-indigo-600 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Premium Feature
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Job matching is available to Premium and Pro Plus subscribers. Upgrade to unlock:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>AI-powered job description matching</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Skill gap analysis and recommendations</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Keyword optimization suggestions</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Tailored resume improvement guide</span>
                    </li>
                  </ul>
                  <Link href="/pricing">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      Upgrade to Premium
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resume Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Your Resume</h3>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={loading || (usageInfo && !usageInfo.hasAccess)}
              />
              <p className="text-sm text-gray-500 mt-2">
                {resumeText.length} characters
              </p>
            </Card>
          </motion.div>

          {/* Job Description Input */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                disabled={loading || (usageInfo && !usageInfo.hasAccess)}
              />
              <p className="text-sm text-gray-500 mt-2">
                {jobDescription.length} characters
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Analyze Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-8"
        >
          <Button
            onClick={handleAnalyze}
            disabled={loading || !resumeText.trim() || !jobDescription.trim() || (usageInfo && !usageInfo.hasAccess)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Analyze Match
              </>
            )}
          </Button>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-6 mb-8 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Match Score */}
            <Card className="p-8">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(analysis.matchScore)} mb-4`}>
                  <span className={`text-4xl font-bold ${getScoreColor(analysis.matchScore)}`}>
                    {analysis.matchScore}%
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Match Score</h2>
                <p className="text-gray-600">{analysis.summary.overview}</p>
              </div>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Strengths */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Top Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.summary.topStrengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Top Gaps */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-gray-900">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.summary.topGaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span className="text-gray-700">{gap}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Recommendation */}
            <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recommendation</h3>
              <p className="text-gray-700 text-lg">{analysis.summary.recommendation}</p>
            </Card>

            {/* Skill Match */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Skill Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Matched Skills ({analysis.skillMatch.matched.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillMatch.matched.map((skill, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Missing Skills ({analysis.skillMatch.missing.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillMatch.missing.map((skill, idx) => (
                      <Badge key={idx} className="bg-red-100 text-red-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Transferable Skills ({analysis.skillMatch.transferable.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillMatch.transferable.map((skill, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Keyword Analysis */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Keyword Coverage</h3>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.keywordAnalysis.coverageScore)}`}>
                    {analysis.keywordAnalysis.coverageScore}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {analysis.keywordAnalysis.requiredKeywords.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {kw.found ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">{kw.keyword}</span>
                    </div>
                    <Badge className={getImportanceColor(kw.importance)}>
                      {kw.importance}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Experience Match */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Experience Match</h3>
                <span className={`text-2xl font-bold ${getScoreColor(analysis.experienceMatch.score)}`}>
                  {analysis.experienceMatch.score}%
                </span>
              </div>
              <p className="text-gray-700 mb-4">{analysis.experienceMatch.analysis}</p>
              {analysis.experienceMatch.gaps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Experience Gaps:</h4>
                  <ul className="space-y-1">
                    {analysis.experienceMatch.gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Recommendations */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommendations</h3>
              <div className="space-y-4">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{rec.title}</h4>
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-3">{rec.description}</p>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Action Steps:</h5>
                      <ul className="space-y-1">
                        {rec.actionSteps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-indigo-600 mt-1">→</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tailoring Guide */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Tailoring Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Sections to Emphasize</h4>
                  <ul className="space-y-2">
                    {analysis.tailoringGuide.sectionsToEmphasize.map((section, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-indigo-600" />
                        <span className="text-gray-700">{section}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Phrases to Include</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.tailoringGuide.phrasesToInclude.map((phrase, idx) => (
                      <Badge key={idx} className="bg-indigo-100 text-indigo-700">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Skills to Highlight</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.tailoringGuide.skillsToHighlight.map((skill, idx) => (
                      <Badge key={idx} className="bg-purple-100 text-purple-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <Card className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to update your resume?</h3>
              <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                Use these insights to tailor your resume and analyze it again to see your improved score!
              </p>
              <Link href="/">
                <Button className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
                  Analyze Updated Resume
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
