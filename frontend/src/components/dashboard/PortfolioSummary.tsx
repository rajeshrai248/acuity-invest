import { DollarSign, TrendingUp, Percent, Hash } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import type { PortfolioSummaryData } from '../../types';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryData;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGain(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
}

export default function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const gainTrend = summary.total_gain >= 0 ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Value"
        value={formatCurrency(summary.total_value)}
        icon={<DollarSign size={22} />}
        trend="neutral"
      />
      <MetricCard
        title="Total Gain"
        value={formatGain(summary.total_gain)}
        subtitle={`Cost basis: ${formatCurrency(summary.total_cost)}`}
        icon={<TrendingUp size={22} />}
        trend={gainTrend}
      />
      <MetricCard
        title="Return"
        value={`${summary.return_pct >= 0 ? '+' : ''}${summary.return_pct.toFixed(2)}%`}
        icon={<Percent size={22} />}
        trend={gainTrend}
      />
      <MetricCard
        title="Holdings"
        value={String(summary.holdings_count)}
        subtitle="Active positions"
        icon={<Hash size={22} />}
        trend="neutral"
      />
    </div>
  );
}
