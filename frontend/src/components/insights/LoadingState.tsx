import { Sparkles } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Sparkles size={24} className="text-[#FF6200] animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#FF6200]">Analyzing your portfolio...</p>
          <p className="text-xs text-gray-400 mt-0.5">AI is generating insights with charts and recommendations</p>
        </div>
      </div>

      {/* Summary card skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        <div className="flex justify-center">
          <div className="w-48 h-48 rounded-full bg-gray-100 border-8 border-gray-200" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-52 mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded flex-1" />
            <div className="h-4 bg-gray-100 rounded w-20" />
            <div className="h-4 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pt-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#FF6200]"
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
