import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, ChevronDown } from 'lucide-react';
import type { MarketQuote, ExchangeKey } from '../../types';
import { EXCHANGE_OPTIONS } from '../../types';
import { useMarketMovers } from '../../hooks/useMarketMovers';

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(1) + 'B';
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + 'M';
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + 'K';
  return vol.toString();
}

function QuoteRow({ quote, showVolume, currency }: { quote: MarketQuote; showVolume?: boolean; currency?: string }) {
  const isPositive = quote.change >= 0;
  const symbol = currency === 'EUR' ? '€' : '$';
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{quote.ticker}</p>
        <p className="text-xs text-gray-500 truncate max-w-[120px]">{quote.name}</p>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="text-sm font-medium text-gray-900">{symbol}{quote.price.toFixed(2)}</p>
        {showVolume ? (
          <p className="text-xs text-gray-500">{formatVolume(quote.volume)} vol</p>
        ) : (
          <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

export default function MarketMovers() {
  const [exchange, setExchange] = useState<ExchangeKey>('US');
  const { movers, loading, error, refresh } = useMarketMovers(exchange);

  const currentExchange = EXCHANGE_OPTIONS.find(e => e.key === exchange) || EXCHANGE_OPTIONS[0];
  const currency = movers?.currency || (exchange === 'US' ? 'USD' : 'EUR');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-[#FF6200]" />
          <h3 className="text-lg font-semibold text-gray-900">Market Movers</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Exchange Dropdown */}
          <div className="relative">
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value as ExchangeKey)}
              className="appearance-none bg-gray-50 border border-gray-200 text-sm text-gray-700 py-1.5 pl-3 pr-8 rounded-lg cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF6200]/20 focus:border-[#FF6200] transition-colors"
            >
              {EXCHANGE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={refresh}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || !movers ? (
        <p className="text-sm text-gray-500 text-center py-8">Unable to load market data for {currentExchange.label}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Gainers */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <TrendingUp size={14} className="text-green-600" />
                <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wide">Top Gainers</h4>
              </div>
              <div className="space-y-0.5">
                {movers.gainers.map((q) => (
                  <QuoteRow key={q.ticker} quote={q} currency={currency} />
                ))}
                {movers.gainers.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-4 text-center">No data</p>
                )}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <TrendingDown size={14} className="text-red-600" />
                <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide">Top Losers</h4>
              </div>
              <div className="space-y-0.5">
                {movers.losers.map((q) => (
                  <QuoteRow key={q.ticker} quote={q} currency={currency} />
                ))}
                {movers.losers.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-4 text-center">No data</p>
                )}
              </div>
            </div>

            {/* Most Active */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <BarChart3 size={14} className="text-blue-600" />
                <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Most Active</h4>
              </div>
              <div className="space-y-0.5">
                {movers.mostActive.map((q) => (
                  <QuoteRow key={q.ticker} quote={q} showVolume currency={currency} />
                ))}
                {movers.mostActive.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-4 text-center">No data</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-4 text-right">
            {currentExchange.description} · Yahoo Finance · Updated {new Date(movers.asOf).toLocaleTimeString()}
          </p>
        </>
      )}
    </div>
  );
}
