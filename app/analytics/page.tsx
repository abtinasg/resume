'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { MetricsOverview, ExportPanel } from '@/components/analytics';
import { HelpWidget } from '@/components/coach';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analytics
              </h1>
              <p className="text-gray-600">
                Track your progress and measure your job search success
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Overview - Takes 2/3 */}
          <div className="lg:col-span-2">
            <MetricsOverview userId={user.id} />
          </div>

          {/* Export Panel - Takes 1/3 */}
          <div className="lg:col-span-1">
            <ExportPanel userId={user.id} />
          </div>
        </div>
      </div>

      {/* Help Widget */}
      <HelpWidget userId={user.id} />
    </div>
  );
}
