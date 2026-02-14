import { useState, useEffect, useCallback } from 'react';
import type { Portfolio, Holding, HoldingWithMetrics, PortfolioSummaryData, SubscriptionTier } from '../types';
import { fetchPortfolio, addHolding as apiAddHolding, deleteHolding as apiDeleteHolding } from '../services/api';
import { mockPortfolio } from '../data/mockData';

function computeMetrics(holding: Holding): HoldingWithMetrics {
  const market_value = holding.shares * holding.current_price;
  const cost_basis = holding.shares * holding.avg_cost;
  const gain_loss = market_value - cost_basis;
  const return_pct = ((holding.current_price - holding.avg_cost) / holding.avg_cost) * 100;
  return { ...holding, market_value, gain_loss, return_pct };
}

function computeSummary(holdings: HoldingWithMetrics[]): PortfolioSummaryData {
  const total_value = holdings.reduce((sum, h) => sum + h.market_value, 0);
  const total_cost = holdings.reduce((sum, h) => sum + h.shares * h.avg_cost, 0);
  const total_gain = total_value - total_cost;
  const return_pct = total_cost > 0 ? (total_gain / total_cost) * 100 : 0;
  return {
    total_value,
    total_cost,
    total_gain,
    return_pct,
    holdings_count: holdings.length,
  };
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio>(mockPortfolio);
  const [portfolioId, setPortfolioId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holdingsWithMetrics: HoldingWithMetrics[] = portfolio.holdings.map(computeMetrics);
  const summary: PortfolioSummaryData = computeSummary(holdingsWithMetrics);
  const tier: SubscriptionTier = portfolio.subscription_tier;

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPortfolio();
      setPortfolio(result.portfolio);
      setPortfolioId(result.portfolioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddHolding = useCallback(async (holding: Omit<Holding, 'current_price'>) => {
    setError(null);
    try {
      const newHolding = await apiAddHolding(portfolioId, holding);
      setPortfolio(prev => ({
        ...prev,
        holdings: [...prev.holdings, newHolding],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add holding');
      throw err;
    }
  }, [portfolioId]);

  const handleDeleteHolding = useCallback(async (ticker: string) => {
    setError(null);
    try {
      await apiDeleteHolding(portfolioId, ticker);
      setPortfolio(prev => ({
        ...prev,
        holdings: prev.holdings.filter(h => h.ticker !== ticker),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete holding');
    }
  }, [portfolioId]);

  const setSubscriptionTier = useCallback((newTier: SubscriptionTier) => {
    setPortfolio(prev => ({ ...prev, subscription_tier: newTier }));
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  return {
    portfolio,
    portfolioId,
    holdingsWithMetrics,
    summary,
    tier,
    loading,
    error,
    addHolding: handleAddHolding,
    deleteHolding: handleDeleteHolding,
    setSubscriptionTier,
    refresh: loadPortfolio,
  };
}
