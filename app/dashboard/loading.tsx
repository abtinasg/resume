export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-12 w-48 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Primary Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resume Score Card Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="flex items-center justify-center mb-4">
              <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Daily Tasks Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mx-auto mb-4" />
                <div className="h-10 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Plan Section Skeleton */}
        <div className="mt-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
