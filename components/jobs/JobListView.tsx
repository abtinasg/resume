'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Tabs from '@/components/ui/tabs';
import Button from '@/components/ui/button';
import { JobCard, RankedJob } from './JobCard';
import { Loader2, Filter, RefreshCw } from 'lucide-react';

interface JobListViewProps {
  userId: string;
  onJobSelect?: (job: RankedJob) => void;
  onCompare?: (jobs: RankedJob[]) => void;
}

interface JobListData {
  reach: RankedJob[];
  target: RankedJob[];
  safety: RankedJob[];
  avoid: RankedJob[];
}

export function JobListView({ userId, onJobSelect, onCompare }: JobListViewProps) {
  const [jobs, setJobs] = useState<JobListData>({
    reach: [],
    target: [],
    safety: [],
    avoid: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<RankedJob[]>([]);
  const [filters, setFilters] = useState({
    location: '',
    minScore: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [userId, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        user_id: userId,
        ...(filters.location && { location: filters.location }),
        ...(filters.minScore > 0 && { min_fit_score: filters.minScore.toString() }),
      });

      const res = await fetch(`/api/jobs/list?${params}`);
      
      if (!res.ok) {
        throw new Error('Failed to load jobs');
      }

      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const toggleJobSelection = (job: RankedJob) => {
    setSelectedJobs(prev => {
      const isSelected = prev.some(j => j.job_id === job.job_id);
      if (isSelected) {
        return prev.filter(j => j.job_id !== job.job_id);
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), job];
      }
      return [...prev, job];
    });
  };

  const handleCompare = () => {
    if (selectedJobs.length >= 2 && onCompare) {
      onCompare(selectedJobs);
    }
  };

  const renderJobList = (jobList: RankedJob[], emptyMessage: string) => {
    if (jobList.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">{emptyMessage}</p>
          <p className="text-sm text-gray-400 mt-1">Paste job descriptions to get started</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobList.map((job) => (
          <JobCard
            key={job.job_id}
            job={job}
            isSelected={selectedJobs.some(j => j.job_id === job.job_id)}
            onSelect={() => toggleJobSelection(job)}
            onViewDetails={() => onJobSelect?.(job)}
          />
        ))}
      </div>
    );
  };

  const tabs = [
    {
      label: `Target (${jobs.target.length})`,
      content: renderJobList(jobs.target, 'No target jobs yet'),
    },
    {
      label: `Reach (${jobs.reach.length})`,
      content: renderJobList(jobs.reach, 'No reach jobs yet'),
    },
    {
      label: `Safety (${jobs.safety.length})`,
      content: renderJobList(jobs.safety, 'No safety jobs yet'),
    },
    {
      label: `Avoid (${jobs.avoid.length})`,
      content: renderJobList(jobs.avoid, 'No jobs to avoid'),
    },
  ];

  if (loading && jobs.target.length === 0) {
    return (
      <Card className="!bg-white">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="!bg-red-50 !border-red-200">
        <div className="text-center py-8">
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchJobs}>Try Again</Button>
        </div>
      </Card>
    );
  }

  const totalJobs = jobs.reach.length + jobs.target.length + jobs.safety.length + jobs.avoid.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Your Jobs</h2>
          <p className="text-sm text-gray-500">{totalJobs} jobs tracked</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={fetchJobs}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="!bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Filter by location..."
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) || 0 }))}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => setFilters({ location: '', minScore: 0 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Selected Jobs Bar */}
      {selectedJobs.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="font-medium text-blue-900">
              {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
            </p>
            <p className="text-sm text-blue-700">
              {selectedJobs.map(j => j.job_title).join(', ')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCompare}
              disabled={selectedJobs.length < 2}
            >
              Compare ({selectedJobs.length}/5)
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSelectedJobs([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Job Tabs */}
      <Tabs tabs={tabs} />
    </div>
  );
}
