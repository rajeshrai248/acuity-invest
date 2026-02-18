import { DollarSign, TrendingUp, Percent, Hash } from 'lucide-react';
import MetricCard from '../common/MetricCard';
import { formatCurrency } from '../../utils/currency';
import type { PortfolioSummaryData } from '../../types';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryData;
  baseCurrency?: string;
}

function formatGain(value: number, currency: string): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatCurrency(value, currency)}`;
}

export default function PortfolioSummary({ summary, baseCurrency = 'EUR' }: PortfolioSummaryProps) {
  const gainTrend = summary.total_gain >= 0 ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Value"
        value={formatCurrency(summary.total_value, baseCurrency)}
        icon={<DollarSign size={22} />}
        trend="neutral"
      />
      <MetricCard
        title="Total Gain"
        value={formatGain(summary.total_gain, baseCurrency)}
        subtitle={`Cost basis: ${formatCurrency(summary.total_cost, baseCurrency)}`}
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
