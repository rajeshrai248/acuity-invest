import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrencyByTicker } from '../../utils/currency';
import type { HoldingWithMetrics } from '../../types';

interface HoldingsListProps {
  holdings: HoldingWithMetrics[];
  onDelete: (ticker: string) => Promise<void>;
}

export default function HoldingsList({ holdings, onDelete }: HoldingsListProps) {
  const [deletingTicker, setDeletingTicker] = useState<string | null>(null);
  const [confirmTicker, setConfirmTicker] = useState<string | null>(null);

  async function handleDelete(ticker: string) {
    if (confirmTicker !== ticker) {
      setConfirmTicker(ticker);
      return;
    }
    setDeletingTicker(ticker);
    try {
      await onDelete(ticker);
    } finally {
      setDeletingTicker(null);
      setConfirmTicker(null);
    }
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-400 text-sm">No holdings in your portfolio yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Manage Holdings</h3>
        <p className="text-sm text-gray-500 mt-0.5">{holdings.length} position{holdings.length !== 1 ? 's' : ''} in portfolio</p>
      </div>
      <div className="divide-y divide-gray-50">
        {holdings.map(holding => {
          const isConfirming = confirmTicker === holding.ticker;
          const isDeleting = deletingTicker === holding.ticker;

          return (
            <div
              key={holding.ticker}
              className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors ${
                isConfirming ? 'bg-red-50/50' : ''
              }`}
            >
              {/* Ticker and Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{holding.ticker}</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-sm text-gray-600 truncate">{holding.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{holding.shares} shares</span>
                  <span>Avg {formatCurrencyByTicker(holding.avg_cost, holding.ticker)}</span>
                  <span>Purchased {holding.purchase_date}</span>
                </div>
              </div>

              {/* Value and Return */}
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900 tabular-nums">
                  {formatCurrencyByTicker(holding.market_value, holding.ticker)}
                </div>
                <div
                  className={`text-xs font-medium tabular-nums ${
                    holding.return_pct >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {holding.return_pct >= 0 ? '+' : ''}
                  {holding.return_pct.toFixed(1)}%
                </div>
              </div>

              {/* Delete Action */}
              <div className="flex items-center gap-2">
                {isConfirming && !isDeleting && (
                  <button
                    onClick={() => setConfirmTicker(null)}
                    className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => handleDelete(holding.ticker)}
                  disabled={isDeleting}
                  className={`p-2 rounded-lg transition-colors ${
                    isConfirming
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                  } disabled:opacity-50`}
                  title={isConfirming ? 'Click again to confirm' : 'Delete holding'}
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : isConfirming ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
