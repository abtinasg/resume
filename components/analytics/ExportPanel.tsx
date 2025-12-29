'use client';

import { useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Download, FileText, Table, Loader2, Check, AlertCircle } from 'lucide-react';

interface ExportPanelProps {
  userId: string;
}

export function ExportPanel({ userId }: ExportPanelProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('csv');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('all_time');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(
        `/api/analytics/export?user_id=${userId}&format=${format}&period=${period}`
      );

      if (!res.ok) {
        throw new Error('Failed to export data');
      }

      const data = await res.json();
      
      // Create downloadable file
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data.data, null, 2) : convertToCSV(data.data)],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumeiq-analytics-${period}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: Record<string, unknown>): string => {
    // Simple CSV conversion for flat objects
    const rows: string[] = [];
    
    const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string> => {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
        } else {
          result[newKey] = String(value);
        }
      }
      return result;
    };

    const flatData = flattenObject(data);
    rows.push(Object.keys(flatData).join(','));
    rows.push(Object.values(flatData).join(','));
    
    return rows.join('\n');
  };

  return (
    <Card className="!bg-white">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Export Data</h3>
        </div>

        <p className="text-sm text-gray-600">
          Download your analytics data for external use or backup.
        </p>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                format === 'csv' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Table className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                format === 'json' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        {/* Period Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <div className="flex gap-2">
            {(['weekly', 'monthly', 'all_time'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                  period === p 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {p === 'weekly' ? 'Last Week' : p === 'monthly' ? 'Last Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <Check className="w-4 h-4" />
            Export downloaded successfully!
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download {format.toUpperCase()}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-400">
          Exported data includes applications, resume scores, and strategy metrics.
        </p>
      </div>
    </Card>
  );
}
