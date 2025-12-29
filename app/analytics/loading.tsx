export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse" />
            <div>
              <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Chart Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Progress Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-[300px] w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>

            {/* Application Funnel Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-[250px] w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>

            {/* Timeline Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-[250px] w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            {/* Export Panel Skeleton */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
