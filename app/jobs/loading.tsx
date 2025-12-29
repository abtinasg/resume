export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['Target', 'Reach', 'Safety', 'Avoid'].map((tab, i) => (
            <div
              key={tab}
              className={`h-10 w-24 rounded-lg animate-pulse ${
                i === 0 ? 'bg-blue-200' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Job Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              {/* Job Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              </div>

              {/* Location and Details */}
              <div className="space-y-2 mb-4">
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"
                  />
                ))}
              </div>

              {/* Description Lines */}
              <div className="space-y-2 mb-4">
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Action Button */}
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
