import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Lightbulb, RefreshCw } from 'lucide-react';
import QueryInput from '../components/insights/QueryInput';
import InsightDisplay from '../components/insights/InsightDisplay';
import Scratchpad from '../components/insights/Scratchpad';
import LoadingState from '../components/insights/LoadingState';
import PremiumGate from '../components/subscription/PremiumGate';
import type { InsightResponse, SubscriptionTier } from '../types';
import { useInsights } from '../hooks/useInsights';

interface InsightsPageProps {
  portfolioId: string;
  tier: SubscriptionTier;
}

export default function InsightsPage({ portfolioId, tier }: InsightsPageProps) {
  const location = useLocation();
  const { response, loading, error, submitQuery, clearResponse } = useInsights(portfolioId);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const initialQuery = (location.state as { query?: string } | null)?.query || '';

  // Auto-submit if navigated here with a query from dashboard
  // Wait until portfolioId is available before submitting
  useEffect(() => {
    if (initialQuery && portfolioId) {
      submitQuery(initialQuery);
      // Clear the state so refreshing doesn't re-submit
      window.history.replaceState({}, document.title);
    }
  }, [initialQuery, portfolioId, submitQuery]);

  function handleSubmit(query: string) {
    submitQuery(query);
  }

  function handleChartFeatureCheck(insightResponse: InsightResponse): InsightResponse {
    // If FREE tier and response contains mermaid charts, gate it
    const hasCharts = insightResponse.insights.includes('```mermaid') || insightResponse.insights.includes('```chart-data');
    if (tier === 'FREE' && hasCharts) {
      // Strip mermaid and chart-data blocks for free users
      const strippedInsights = insightResponse.insights.replace(
        /```(?:mermaid|chart-data)[\s\S]*?```/g,
        '\n> *[Chart visualization available for Premium subscribers]*\n'
      );
      setShowPremiumGate(true);
      return { ...insightResponse, insights: strippedInsights };
    }
    return insightResponse;
  }

  const displayResponse = response ? handleChartFeatureCheck(response) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb size={24} className="text-[#FF6200]" />
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Ask questions about your portfolio and receive AI-powered analysis with visualizations.
          </p>
        </div>
        {response && (
          <button
            onClick={clearResponse}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            New Query
          </button>
        )}
      </div>

      {/* Query Input */}
      <QueryInput onSubmit={handleSubmit} loading={loading || !portfolioId} initialQuery={initialQuery} />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => submitQuery('Give me a comprehensive portfolio overview')}
            className="mt-3 text-red-700 underline text-sm hover:no-underline"
          >
            Try again with a default query
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Results */}
      {displayResponse && !loading && (
        <div className="space-y-4">
          {/* Scratchpad (AI Reasoning) */}
          {displayResponse.scratchpad && (
            <Scratchpad content={displayResponse.scratchpad} />
          )}

          {/* Insight Content */}
          <InsightDisplay content={displayResponse.insights} />
        </div>
      )}

      {/* Premium Gate Modal */}
      <PremiumGate
        isOpen={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        featureName="Interactive Charts & Visualizations"
      />
    </div>
  );
}
