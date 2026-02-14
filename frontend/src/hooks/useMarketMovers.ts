import { useState, useEffect, useCallback } from 'react';
import type { MarketMovers, ExchangeKey } from '../types';
import { fetchMarketMovers } from '../services/api';

export function useMarketMovers(exchange: ExchangeKey = 'US', refreshIntervalMs = 5 * 60 * 1000) {
  const [movers, setMovers] = useState<MarketMovers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchMarketMovers(exchange);
      setMovers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  }, [exchange]);

  useEffect(() => {
    load();
    const interval = setInterval(load, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [load, refreshIntervalMs]);

  return { movers, loading, error, refresh: load };
}
