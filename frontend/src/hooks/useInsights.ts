import { useState, useCallback } from 'react';
import type { InsightResponse } from '../types';
import { fetchInsight } from '../services/api';

function parseInsightResponse(raw: string): InsightResponse {
  let scratchpad = '';
  let insights = '';

  const scratchpadMatch = raw.match(/<scratchpad>([\s\S]*?)<\/scratchpad>/);
  if (scratchpadMatch) {
    scratchpad = scratchpadMatch[1].trim();
  }

  const insightsMatch = raw.match(/<insights>([\s\S]*?)<\/insights>/);
  if (insightsMatch) {
    insights = insightsMatch[1].trim();
  }

  // If no tags found, treat the entire response as insights
  if (!insights && !scratchpad) {
    insights = raw.trim();
  }

  return { scratchpad, insights, raw };
}

export function useInsights(portfolioId: string) {
  const [response, setResponse] = useState<InsightResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const submitQuery = useCallback(async (query: string) => {
    if (!portfolioId) {
      setError('Portfolio is still loading. Please wait a moment and try again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchInsight({ query, portfolio_id: portfolioId });
      const parsed = parseInsightResponse(raw);
      setResponse(parsed);
      setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insight');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    response,
    loading,
    error,
    queryHistory,
    submitQuery,
    clearResponse,
  };
}
