'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import {
  TrendingUp,
  Award,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';

interface ScoringFactor {
  id: string;
  name: string;
  category: 'structure' | 'content' | 'tailoring';
  currentValue: number;
  maxValue: number;
  impact: number; // Points impact on overall score
  description: string;
  examples: string[];
}

interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  color: string;
  icon: React.ReactNode;
}

export default function ScoringCalculator() {
  // Initialize scoring factors based on 3D scoring system
  const [factors, setFactors] = useState<ScoringFactor[]>([
    {
      id: 'sections',
      name: 'Essential Sections',
      category: 'structure',
      currentValue: 3,
      maxValue: 5,
      impact: 8, // 8 points per section (5 × 8 = 40)
      description: 'Complete sections: Summary, Experience, Skills, Education, Contact',
      examples: ['Add Summary section', 'Include Contact info', 'Add Education section'],
    },
    {
      id: 'quantification',
      name: 'Quantified Achievements',
      category: 'content',
      currentValue: 40,
      maxValue: 100,
      impact: 0.25, // 25% of content score
      description: 'Percentage of bullet points with metrics and numbers',
      examples: [
        'Changed: "Improved sales" → "Increased sales by 35%"',
        'Changed: "Led team" → "Led team of 12 engineers"',
        'Changed: "Reduced costs" → "Cut costs by $50K annually"',
      ],
    },
    {
      id: 'actionVerbs',
      name: 'Strong Action Verbs',
      category: 'content',
      currentValue: 50,
      maxValue: 100,
      impact: 0.2, // 20% of content score
      description: 'Usage of strong action verbs (Led, Designed, Architected)',
      examples: [
        'Strong: Led, Designed, Architected, Spearheaded',
        'Medium: Managed, Created, Developed, Implemented',
        'Weak: Helped, Worked, Did, Handled',
      ],
    },
    {
      id: 'clarity',
      name: 'Bullet Clarity',
      category: 'content',
      currentValue: 70,
      maxValue: 100,
      impact: 0.1, // 10% of content score
      description: 'Optimal length: 15-25 words per bullet point',
      examples: [
        'Too short: "Led team."',
        'Optimal: "Led cross-functional team of 8 to deliver product ahead of schedule."',
        'Too long: Avoid 35+ word bullets',
      ],
    },
    {
      id: 'keywords',
      name: 'Job-Relevant Keywords',
      category: 'tailoring',
      currentValue: 60,
      maxValue: 100,
      impact: 0.4, // Main factor for tailoring (40 points max)
      description: 'Match with job description keywords',
      examples: [
        'Software Engineer: React, Node.js, AWS, TypeScript',
        'Product Manager: Roadmap, Stakeholder, OKRs, Agile',
        'Data Scientist: Python, ML, TensorFlow, SQL',
      ],
    },
  ]);

  const [overallScore, setOverallScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);

  // Calculate scores whenever factors change
  useEffect(() => {
    calculateScores();
  }, [factors]);

  const calculateScores = () => {
    // Structure Score (0-40)
    const structureFactor = factors.find((f) => f.id === 'sections');
    const structureScore = structureFactor
      ? Math.round((structureFactor.currentValue / structureFactor.maxValue) * 40)
      : 0;

    // Content Score (0-60)
    const quantificationFactor = factors.find((f) => f.id === 'quantification');
    const actionVerbsFactor = factors.find((f) => f.id === 'actionVerbs');
    const clarityFactor = factors.find((f) => f.id === 'clarity');

    const contentScore = Math.round(
      (quantificationFactor ? (quantificationFactor.currentValue / 100) * 25 : 0) +
        (actionVerbsFactor ? (actionVerbsFactor.currentValue / 100) * 20 : 0) +
        (clarityFactor ? (clarityFactor.currentValue / 100) * 10 : 0) +
        5 // Base impact score
    );

    // Tailoring Score (0-40)
    const keywordsFactor = factors.find((f) => f.id === 'keywords');
    const tailoringScore = keywordsFactor
      ? Math.round((keywordsFactor.currentValue / 100) * 40)
      : 0;

    // Overall Score (0-100)
    // Formula: (structure/40 * 0.3 + content/60 * 0.4 + tailoring/40 * 0.3) * 100
    const overall = Math.round(
      (structureScore / 40) * 0.3 * 100 +
        (contentScore / 60) * 0.4 * 100 +
        (tailoringScore / 40) * 0.3 * 100
    );

    setOverallScore(overall);

    // Update category scores
    setCategoryScores([
      {
        name: 'Structure',
        score: structureScore,
        maxScore: 40,
        color: 'bg-blue-500',
        icon: <Target className="w-5 h-5" />,
      },
      {
        name: 'Content',
        score: contentScore,
        maxScore: 60,
        color: 'bg-green-500',
        icon: <Award className="w-5 h-5" />,
      },
      {
        name: 'Tailoring',
        score: tailoringScore,
        maxScore: 40,
        color: 'bg-purple-500',
        icon: <Zap className="w-5 h-5" />,
      },
    ]);

    // Generate improvement suggestions
    const suggestions: string[] = [];

    if (structureScore < 32) {
      suggestions.push('Add missing sections to improve structure score by +8 points each');
    }

    if (quantificationFactor && quantificationFactor.currentValue < 60) {
      const potential = Math.round(((60 - quantificationFactor.currentValue) / 100) * 25 * 0.4);
      suggestions.push(`Add metrics to bullets: potential +${potential} overall points`);
    }

    if (actionVerbsFactor && actionVerbsFactor.currentValue < 70) {
      const potential = Math.round(((70 - actionVerbsFactor.currentValue) / 100) * 20 * 0.4);
      suggestions.push(`Replace weak verbs with strong ones: potential +${potential} overall points`);
    }

    if (keywordsFactor && keywordsFactor.currentValue < 80) {
      const potential = Math.round(((80 - keywordsFactor.currentValue) / 100) * 40 * 0.3);
      suggestions.push(`Add job-relevant keywords: potential +${potential} overall points`);
    }

    setImprovements(suggestions);
  };

  const handleSliderChange = (id: string, value: number) => {
    setFactors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, currentValue: value } : f))
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 80) return 'bg-green-50 border-green-300';
    if (score >= 70) return 'bg-yellow-50 border-yellow-300';
    if (score >= 60) return 'bg-orange-50 border-orange-300';
    return 'bg-red-50 border-red-300';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    return 'D';
  };

  const resetToDefaults = () => {
    setFactors([
      { ...factors[0], currentValue: 3 },
      { ...factors[1], currentValue: 40 },
      { ...factors[2], currentValue: 50 },
      { ...factors[3], currentValue: 70 },
      { ...factors[4], currentValue: 60 },
    ]);
  };

  const setToOptimal = () => {
    setFactors([
      { ...factors[0], currentValue: 5 },
      { ...factors[1], currentValue: 80 },
      { ...factors[2], currentValue: 85 },
      { ...factors[3], currentValue: 90 },
      { ...factors[4], currentValue: 85 },
    ]);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-8 h-8 text-brand-indigo" />
          <h2 className="text-3xl font-bold text-gray-900">
            Interactive Scoring Calculator
          </h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Adjust the sliders below to see how different improvements affect your resume score.
          This calculator is based on our 3D scoring system that evaluates Structure, Content, and Tailoring.
        </p>
      </div>

      {/* Overall Score Display */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`p-8 border-2 ${getScoreBgColor(overallScore)}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-4 mb-3">
                <motion.div
                  className={`text-7xl font-bold ${getScoreColor(overallScore)}`}
                  key={overallScore}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {overallScore}
                  <span className="text-4xl">%</span>
                </motion.div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700">
                    {getScoreGrade(overallScore)}
                  </div>
                  <div className="text-sm text-gray-500">Grade</div>
                </div>
              </div>
              <p className="text-lg text-gray-600">Overall Resume Score</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {categoryScores.map((cat, idx) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-4 rounded-lg border shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${cat.color} text-white p-2 rounded`}>
                      {cat.icon}
                    </div>
                    <span className="font-semibold text-gray-700">{cat.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{cat.score}</span>
                    <span className="text-gray-500">/ {cat.maxScore}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <motion.div
                      className={`${cat.color} h-2 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={resetToDefaults} variant="outline" className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Reset to Average
        </Button>
        <Button onClick={setToOptimal} variant="primary" className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600">
          <Sparkles className="w-4 h-4" />
          Set to Optimal
        </Button>
      </div>

      {/* Scoring Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {factors.map((factor, idx) => (
          <motion.div
            key={factor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {factor.name}
                    </h3>
                    <p className="text-sm text-gray-600">{factor.description}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      factor.category === 'structure'
                        ? 'bg-blue-100 text-blue-700'
                        : factor.category === 'content'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {factor.category}
                  </div>
                </div>

                {/* Value Display */}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {factor.currentValue}
                  </span>
                  <span className="text-gray-500">
                    {factor.id === 'sections' ? '/ 5 sections' : '/ 100%'}
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={factor.maxValue}
                    value={factor.currentValue}
                    onChange={(e) => handleSliderChange(factor.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-indigo"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>{factor.maxValue}</span>
                  </div>
                </div>

                {/* Examples */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700 mb-2">Examples:</p>
                  {factor.examples.slice(0, 2).map((example, i) => (
                    <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-brand-indigo mt-0.5">•</span>
                      <span>{example}</span>
                    </p>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Improvement Suggestions */}
      {improvements.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Improvement Opportunities
              </h3>
            </div>
            <div className="space-y-2">
              {improvements.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-white p-4 rounded-lg border border-blue-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-lg border border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <p>
                Implementing these improvements could boost your score to{' '}
                <span className="font-semibold text-blue-600">
                  {Math.min(overallScore + improvements.length * 3, 100)}%
                </span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Call to Action */}
      <div className="text-center">
        <Card className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="space-y-4">
            <Sparkles className="w-12 h-12 mx-auto" />
            <h3 className="text-2xl font-bold">Ready to optimize your resume?</h3>
            <p className="text-indigo-100 max-w-xl mx-auto">
              Upload your resume now and get personalized recommendations to improve your score
              with our AI-powered analysis.
            </p>
            <Button
              variant="primary"
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-3"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Try It Now
              <ArrowRight className="w-4 h-4 ml-2 inline" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
