"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/authStore";
import ChatBotPanel from "@/components/ChatBotPanel";
import { FileText, TrendingUp, Award, Upload } from "lucide-react";
import ComparisonView from "@/components/ComparisonView";
import FeatureGate from "@/components/FeatureGate";
import { FEATURES } from "@/lib/featureGating";
import { WeeklyPlanSection } from "@/components/WeeklyPlanSection";
import { QuickStats, DailyTasksList, ProgressCharts } from "@/components/dashboard";
import { HelpWidget } from "@/components/coach";

interface Resume {
  id: number;
  fileName: string | null;
  score: number | null;
  summary: string | null;
  data: any;
  createdAt: string;
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const router = useRouter();

  // Get auth state from store
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchResumes();
    }
  }, [isAuthenticated]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/resumes");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch resumes");
      }

      const normalizedResumes: Resume[] = (data.resumes || []).map((resume: any) => ({
        ...resume,
        id: Number(resume.id),
      }));

      setResumes(normalizedResumes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId: number) => {
    if (!confirm("Are you sure you want to delete this resume analysis?")) {
      return;
    }

    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete resume");
      }

      // Remove from local state
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      setSelectedForComparison((prev) => prev.filter((id) => id !== resumeId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete resume");
    }
  };

  const handleReanalyze = () => {
    router.push("/#upload");
  };

  const getScoreColor = (score: number | null): string => {
    if (score === null) return "text-gray-500";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadgeVariant = (score: number | null): "high" | "medium" | "low" => {
    if (score === null || score < 60) return "low";
    if (score >= 80) return "high";
    return "medium";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAIStatusBadge = (data: any) => {
    if (!data || !data.ai_status) return null;

    const statusMap = {
      success: { text: "AI Analyzed", variant: "high" as const },
      fallback: { text: "Local Only", variant: "medium" as const },
      disabled: { text: "Local Only", variant: "low" as const },
    };

    const status = statusMap[data.ai_status as keyof typeof statusMap];
    if (!status) return null;

    return <Badge variant={status.variant}>{status.text}</Badge>;
  };

  const toggleComparisonSelection = (resumeId: number) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(resumeId)) {
        return prev.filter((id) => id !== resumeId);
      }

      if (prev.length >= 2) {
        return [...prev.slice(1), resumeId];
      }

      return [...prev, resumeId];
    });
  };

  const clearComparisonSelection = () => {
    setSelectedForComparison([]);
    setIsComparisonOpen(false);
  };

  const openComparison = () => {
    if (selectedForComparison.length === 2) {
      setIsComparisonOpen(true);
    }
  };

  const closeComparison = () => {
    setIsComparisonOpen(false);
  };

  const selectedComparisonResumes = useMemo(() => {
    return selectedForComparison
      .map((id) => resumes.find((resume) => resume.id === id))
      .filter(Boolean) as Resume[];
  }, [selectedForComparison, resumes]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking authentication...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your resumes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <div className="text-center py-8">
              <p className="text-red-700 font-semibold mb-4">{error}</p>
              <Button onClick={fetchResumes}>Try Again</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Get the latest resume for AI Coach context
  const latestResume = resumes.length > 0 ? resumes[0] : null;
  const resumeContext = latestResume
    ? {
        overall_score: latestResume.score || 0,
        sections: {
          structure: latestResume.data?.sections?.structure || 0,
          content: latestResume.data?.sections?.content || 0,
          tailoring: latestResume.data?.sections?.tailoring || 0,
        },
        summary: latestResume.summary || '',
        actionables: latestResume.data?.actionables || [],
      }
    : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600">
                Track your resume performance and get AI-powered insights
              </p>
            </div>
            <Button
              onClick={handleReanalyze}
              className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !shadow-lg hover:!shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Analyze New Resume
            </Button>
          </div>
        </div>

        {/* Comparison Selection Summary */}
        {selectedForComparison.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-blue-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm md:text-base font-semibold text-blue-900">
                {selectedForComparison.length} of 2 resumes selected for comparison
              </p>
              {selectedComparisonResumes.length > 0 && (
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  {selectedComparisonResumes
                    .map((resume) => resume.fileName || `Resume ${resume.id}`)
                    .join(" vs ")}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={openComparison}
                disabled={selectedForComparison.length !== 2}
                className="!px-5"
              >
                View Comparison
              </Button>
              <Button
                variant="secondary"
                onClick={clearComparisonSelection}
                className="!px-5"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats Section - New Dashboard Enhancement */}
        {user && (
          <div className="mb-8">
            <QuickStats 
              userId={user.id} 
              currentScore={latestResume?.score ?? undefined}
              resumeCount={resumes.length}
            />
          </div>
        )}

        {/* Daily Tasks and Resume Score Row - New Dashboard Enhancement */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DailyTasksList userId={user.id} />
            <div className="space-y-6">
              {/* Keep existing stats summary in compact form */}
              {resumes.length > 0 && (
                <Card className="!bg-gradient-to-br !from-white !to-blue-50 !border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">Latest Resume Score</h3>
                      <p className="text-sm text-gray-500">From your most recent analysis</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-4xl font-bold ${
                        (latestResume?.score ?? 0) >= 80 ? 'text-green-600' :
                        (latestResume?.score ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {latestResume?.score != null ? Math.round(latestResume.score) : '--'}
                      </p>
                      <p className="text-xs text-gray-500">out of 100</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Professional Stats Summary */}
        {resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="!bg-gradient-to-br !from-blue-50 !to-blue-100 !border-blue-200 hover:!shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 text-white mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-4xl font-bold text-blue-700 mb-1">
                  {resumes.length}
                </p>
                <p className="text-gray-700 font-medium">Total Analyses</p>
              </div>
            </Card>
            <Card className="!bg-gradient-to-br !from-green-50 !to-emerald-100 !border-green-200 hover:!shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <p className="text-4xl font-bold text-green-700 mb-1">
                  {Math.round(
                    resumes.reduce((acc, r) => acc + (r.score || 0), 0) /
                      resumes.length
                  )}
                </p>
                <p className="text-gray-700 font-medium">Average Score</p>
              </div>
            </Card>
            <Card className="!bg-gradient-to-br !from-purple-50 !to-purple-100 !border-purple-200 hover:!shadow-xl transition-all duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500 text-white mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <p className="text-4xl font-bold text-purple-700 mb-1">
                  {Math.max(...resumes.map((r) => r.score || 0))}
                </p>
                <p className="text-gray-700 font-medium">Highest Score</p>
              </div>
            </Card>
          </div>
        )}

        {/* Professional Empty State */}
        {resumes.length === 0 && (
          <Card className="!bg-gradient-to-br !from-white !to-blue-50 !border-blue-200">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-6">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Start Your Journey
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                Upload your first resume to unlock AI-powered insights and personalized coaching
              </p>
              <Button
                onClick={handleReanalyze}
                className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !shadow-lg hover:!shadow-xl transition-all duration-300 !px-8 !py-6 !text-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Analyze Your First Resume
              </Button>
            </div>
          </Card>
        )}

        {/* Professional Resume List */}
        {resumes.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {resumes.map((resume) => {
              const isSelectedForComparison = selectedForComparison.includes(resume.id);

              return (
                <Card
                  key={resume.id}
                  className={`!bg-white hover:!shadow-2xl transition-all duration-300 hover:scale-[1.02] ${
                    isSelectedForComparison
                      ? '!border-blue-400 !ring-2 !ring-blue-200'
                      : '!border-gray-200'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="font-semibold text-lg text-gray-800 mb-1">
                          {resume.fileName || "Untitled Resume"}
                        </h2>
                        <div className="flex gap-2 items-center">
                          {getAIStatusBadge(resume.data)}
                          {isSelectedForComparison && (
                            <Badge variant="content">Selected</Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(resume.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(resume.score)}`}>
                          {resume.score !== null ? Math.round(resume.score) : "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">out of 100</div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    {resume.data?.sections && (
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Structure</p>
                          <Badge variant="format">
                            {resume.data.sections.structure}/40
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Content</p>
                          <Badge variant="content">
                            {resume.data.sections.content}/60
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs mb-1">Tailoring</p>
                          <Badge variant="ats">
                            {resume.data.sections.tailoring}/40
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {resume.summary && (
                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {resume.summary}
                        </p>
                      </div>
                    )}

                    {/* Actionables Preview */}
                    {resume.data?.actionables && resume.data.actionables.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Top Improvements:
                        </p>
                        <ul className="space-y-1">
                          {resume.data.actionables.slice(0, 2).map((action: any, idx: number) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span className="line-clamp-1">{action.title}</span>
                            </li>
                          ))}
                        </ul>
                        {resume.data.actionables.length > 2 && (
                          <p className="text-xs text-gray-500 mt-1">
                            +{resume.data.actionables.length - 2} more improvements
                          </p>
                        )}
                      </div>
                    )}

                    {/* Professional Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleReanalyze}
                        className="flex-1 !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !shadow-md hover:!shadow-lg transition-all duration-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        New Analysis
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => toggleComparisonSelection(resume.id)}
                        className={`flex-1 min-w-[140px] ${
                          isSelectedForComparison
                            ? '!border-blue-400 !text-blue-600 !bg-blue-50'
                            : '!border-blue-200 !text-blue-600'
                        }`}
                      >
                        {isSelectedForComparison ? "Selected" : "Compare"}
                      </Button>
                      <Button
                        onClick={() => handleDelete(resume.id)}
                        variant="secondary"
                        className="!border-red-300 !text-red-600 hover:!bg-red-50 hover:!border-red-400 !shadow-sm transition-all duration-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Weekly Plan Section */}
        {user && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Career Plan</h2>
            <WeeklyPlanSection userId={user.id} />
          </div>
        )}

        {/* Progress Charts Section - New Dashboard Enhancement */}
        {user && (
          <div className="mt-8">
            <ProgressCharts userId={user.id} />
          </div>
        )}
      </div>

      {/* Help Widget - New Dashboard Enhancement */}
      {user && (
        <HelpWidget userId={user.id} />
      )}

      {/* AI Coach Button - Floating bottom right */}
      <FeatureGate feature={FEATURES.RESUME_COACH}>
        <ChatBotPanel resumeContext={resumeContext} />
      </FeatureGate>

      {isComparisonOpen && selectedForComparison.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="absolute inset-0"
            onClick={closeComparison}
            role="presentation"
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <FeatureGate feature={FEATURES.RESUME_COMPARISON}>
              <ComparisonView
                resumeId1={selectedForComparison[0]}
                resumeId2={selectedForComparison[1]}
                onClose={closeComparison}
              />
            </FeatureGate>
          </div>
        </div>
      )}
    </div>
  );
}
