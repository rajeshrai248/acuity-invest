import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export default function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-gray-700';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={`mt-2 text-2xl font-bold tabular-nums ${trendColor}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`mt-1 text-sm ${trendColor} opacity-80`}>{subtitle}</p>
          )}
        </div>
        <div className="ml-4 p-3 bg-orange-50 rounded-lg text-[#FF6200]">
          {icon}
        </div>
      </div>
    </div>
  );
}
