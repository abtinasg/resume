"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store/authStore";

interface Resume {
  id: string;
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
  const router = useRouter();

  // Get auth state from store
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

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

      setResumes(data.resumes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resumeId: string) => {
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
      setResumes(resumes.filter((r) => r.id !== resumeId));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            My Resume Analyses
          </h1>
          <p className="text-gray-600">
            View and manage all your resume analyses in one place
          </p>
        </div>

        {/* Stats Summary */}
        {resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {resumes.length}
                </p>
                <p className="text-gray-600 mt-1">Total Analyses</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(
                    resumes.reduce((acc, r) => acc + (r.score || 0), 0) /
                      resumes.length
                  )}
                </p>
                <p className="text-gray-600 mt-1">Average Score</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {Math.max(...resumes.map((r) => r.score || 0))}
                </p>
                <p className="text-gray-600 mt-1">Highest Score</p>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {resumes.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                No resumes analyzed yet
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your first resume to get started with AI-powered analysis
              </p>
              <Button onClick={handleReanalyze}>
                Analyze Your First Resume
              </Button>
            </div>
          </Card>
        )}

        {/* Resume List */}
        {resumes.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {resumes.map((resume) => (
              <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg text-gray-800 mb-1">
                        {resume.fileName || "Untitled Resume"}
                      </h2>
                      <div className="flex gap-2 items-center">
                        {getAIStatusBadge(resume.data)}
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

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      onClick={handleReanalyze}
                      className="flex-1 !bg-gradient-to-r !from-green-500 !to-emerald-500 hover:!from-green-600 hover:!to-emerald-600"
                    >
                      Analyze New Resume
                    </Button>
                    <Button
                      onClick={() => handleDelete(resume.id)}
                      variant="secondary"
                      className="!border-red-200 !text-red-600 hover:!bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
