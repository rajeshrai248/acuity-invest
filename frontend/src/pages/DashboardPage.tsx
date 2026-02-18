import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import QuickQuery from '../components/dashboard/QuickQuery';
import MarketMovers from '../components/dashboard/MarketMovers';
import type { HoldingWithMetrics, PortfolioSummaryData } from '../types';

interface DashboardPageProps {
  summary: PortfolioSummaryData;
  holdings: HoldingWithMetrics[];
  customerName: string;
  baseCurrency?: string;
}

export default function DashboardPage({ summary, holdings, customerName, baseCurrency }: DashboardPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {customerName.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here is your portfolio overview as of today.
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      <PortfolioSummary summary={summary} baseCurrency={baseCurrency} />

      {/* Market Movers */}
      <MarketMovers />

      {/* Quick AI Query */}
      <QuickQuery />

      {/* Holdings Table */}
      <HoldingsTable holdings={holdings} />
    </div>
  );
}
