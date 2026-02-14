import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import type { HoldingWithMetrics, SortConfig } from '../../types';

interface HoldingsTableProps {
  holdings: HoldingWithMetrics[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusEmoji(returnPct: number): string {
  if (returnPct >= 50) return '🔥';
  if (returnPct >= 20) return '✅';
  if (returnPct >= 0) return '👍';
  if (returnPct >= -10) return '📉';
  return '🚨';
}

type SortKey = keyof HoldingWithMetrics;

const columns: { key: SortKey; label: string; align?: string }[] = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'name', label: 'Name' },
  { key: 'shares', label: 'Shares', align: 'right' },
  { key: 'avg_cost', label: 'Avg Cost', align: 'right' },
  { key: 'current_price', label: 'Current', align: 'right' },
  { key: 'market_value', label: 'Market Value', align: 'right' },
  { key: 'gain_loss', label: 'Gain/Loss', align: 'right' },
  { key: 'return_pct', label: 'Return %', align: 'right' },
];

export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'return_pct',
    direction: 'desc',
  });

  const sortedHoldings = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });
    return sorted;
  }, [holdings, sortConfig]);

  function handleSort(key: SortKey) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function SortIcon({ columnKey }: { columnKey: SortKey }) {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={14} className="text-gray-300" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-[#FF6200]" />
    ) : (
      <ArrowDown size={14} className="text-[#FF6200]" />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Holdings</h3>
        <p className="text-sm text-gray-500 mt-0.5">Click column headers to sort</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors select-none ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon columnKey={col.key} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedHoldings.map(holding => (
              <tr
                key={holding.ticker}
                className="hover:bg-orange-50/30 transition-colors duration-100"
              >
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-900 text-sm">{holding.ticker}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                  {holding.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 text-right tabular-nums">
                  {holding.shares}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 text-right tabular-nums">
                  {formatCurrency(holding.avg_cost)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 text-right tabular-nums">
                  {formatCurrency(holding.current_price)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right tabular-nums">
                  {formatCurrency(holding.market_value)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      holding.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {holding.gain_loss >= 0 ? '+' : ''}
                    {formatCurrency(holding.gain_loss)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge value={holding.return_pct} />
                </td>
                <td className="px-4 py-3 text-center text-base">
                  {getStatusEmoji(holding.return_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
