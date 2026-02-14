import { Briefcase } from 'lucide-react';
import AddHoldingForm from '../components/portfolio/AddHoldingForm';
import HoldingsList from '../components/portfolio/HoldingsList';
import type { Holding, HoldingWithMetrics } from '../types';

interface PortfolioPageProps {
  holdings: HoldingWithMetrics[];
  onAdd: (holding: Omit<Holding, 'current_price'>) => Promise<void>;
  onDelete: (ticker: string) => Promise<void>;
}

export default function PortfolioPage({ holdings, onAdd, onDelete }: PortfolioPageProps) {
  const existingTickers = holdings.map(h => h.ticker);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase size={24} className="text-[#FF6200]" />
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Management</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Add, view, and manage your investment holdings.
          </p>
        </div>
      </div>

      {/* Add Holding Form */}
      <AddHoldingForm onAdd={onAdd} existingTickers={existingTickers} />

      {/* Holdings List */}
      <HoldingsList holdings={holdings} onDelete={onDelete} />
    </div>
  );
}
