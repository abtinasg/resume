'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { JobPasteForm, JobListView, JobDetailsModal, JobComparisonView, RankedJob } from '@/components/jobs';
import { HelpWidget } from '@/components/coach';
import Button from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

export default function JobsPage() {
  const [showPasteForm, setShowPasteForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<RankedJob | null>(null);
  const [comparisonJobs, setComparisonJobs] = useState<RankedJob[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don&apos;t render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleJobAdded = () => {
    setRefreshKey(prev => prev + 1);
    setShowPasteForm(false);
  };

  const handleCompare = (jobs: RankedJob[]) => {
    setComparisonJobs(jobs);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Job Discovery
              </h1>
              <p className="text-gray-600">
                Track, rank, and compare job opportunities tailored to your profile
              </p>
            </div>
            <Button
              onClick={() => setShowPasteForm(!showPasteForm)}
              className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !shadow-lg hover:!shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              {showPasteForm ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Paste New Job
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Job Paste Form */}
        {showPasteForm && (
          <JobPasteForm 
            userId={user.id} 
            onJobAdded={handleJobAdded}
          />
        )}

        {/* Job List */}
        <JobListView
          key={refreshKey}
          userId={user.id}
          onJobSelect={setSelectedJob}
          onCompare={handleCompare}
        />
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      {/* Job Comparison View */}
      {comparisonJobs.length >= 2 && (
        <JobComparisonView
          jobs={comparisonJobs}
          userId={user.id}
          onClose={() => setComparisonJobs([])}
        />
      )}

      {/* Help Widget */}
      <HelpWidget userId={user.id} />
    </div>
  );
}
