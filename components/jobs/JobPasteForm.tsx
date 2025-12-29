'use client';

import { useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Loader2, Plus, Check, AlertCircle } from 'lucide-react';

interface JobPasteFormProps {
  userId: string;
  onJobAdded?: (job: unknown) => void;
}

export function JobPasteForm({ userId, onJobAdded }: JobPasteFormProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [metadata, setMetadata] = useState({
    jobTitle: '',
    company: '',
    location: '',
    jobUrl: '',
  });
  const [showMetadata, setShowMetadata] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (jobDescription.length < 50) {
      setError('Job description must be at least 50 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/jobs/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: jobDescription,
          user_id: userId,
          metadata: {
            job_title: metadata.jobTitle || undefined,
            company: metadata.company || undefined,
            location: metadata.location || undefined,
            job_url: metadata.jobUrl || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process job');
      }

      setSuccess(true);
      setJobDescription('');
      setMetadata({ jobTitle: '', company: '', location: '', jobUrl: '' });
      
      if (onJobAdded && data.job) {
        onJobAdded(data.job);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="!bg-white">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            <Plus className="w-5 h-5 inline-block mr-2 text-blue-500" />
            Paste Job Description
          </h3>
          <p className="text-sm text-gray-500">
            Paste a job posting to analyze fit and get a ranking
          </p>
        </div>

        {/* Job Description Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-48 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            required
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              Minimum 50 characters
            </span>
            <span className={`text-xs ${jobDescription.length < 50 ? 'text-red-500' : 'text-gray-400'}`}>
              {jobDescription.length} characters
            </span>
          </div>
        </div>

        {/* Optional Metadata Toggle */}
        <button
          type="button"
          onClick={() => setShowMetadata(!showMetadata)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showMetadata ? '− Hide' : '+ Add'} optional details
        </button>

        {/* Optional Metadata Fields */}
        {showMetadata && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={metadata.jobTitle}
                onChange={(e) => setMetadata(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={metadata.company}
                onChange={(e) => setMetadata(prev => ({ ...prev, company: e.target.value }))}
                placeholder="e.g., Tech Corp"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={metadata.location}
                onChange={(e) => setMetadata(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., San Francisco, CA"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job URL
              </label>
              <input
                type="url"
                value={metadata.jobUrl}
                onChange={(e) => setMetadata(prev => ({ ...prev, jobUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <Check className="w-4 h-4" />
            Job added and ranked successfully!
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || jobDescription.length < 50}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Parse & Rank Job
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
