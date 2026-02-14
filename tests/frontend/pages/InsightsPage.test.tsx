// ============================================================
// Acuity Invest — InsightsPage Tests
// Tests for the insights flow: query input -> loading -> display
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useState } from 'react';

// --------------- Mock API ---------------

const mockSubmitQuery = vi.fn();

// --------------- Component Mock ---------------

interface InsightsPageProps {
  portfolioId: string;
  tier: 'FREE' | 'PREMIUM';
  remainingQueries: number;
}

function InsightsPage({ portfolioId, tier, remainingQueries }: InsightsPageProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<{ insights: string; scratchpad: string; rejected?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await mockSubmitQuery(portfolioId, trimmed, tier);
      setInsight(result);
      setQueryHistory((prev) => [...prev, trimmed]);
      setQuery('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="insights-page">
      <h1 data-testid="page-title">AI Portfolio Insights</h1>
      <span data-testid="tier-badge">{tier}</span>

      <form data-testid="query-form" onSubmit={handleSubmit}>
        <textarea
          data-testid="query-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your portfolio..."
          disabled={isLoading}
        />
        <div data-testid="remaining-count">{remainingQueries} queries remaining</div>
        <button data-testid="submit-btn" type="submit" disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Get Insights'}
        </button>
      </form>

      {isLoading && (
        <div data-testid="loading-state">
          <div className="loading-spinner" />
          <p>Analyzing your portfolio...</p>
        </div>
      )}

      {error && <div data-testid="error-state">{error}</div>}

      {insight && !isLoading && (
        <div data-testid="insight-result">
          {insight.rejected ? (
            <div data-testid="rejection-message">{insight.insights}</div>
          ) : (
            <>
              <div data-testid="insight-content" dangerouslySetInnerHTML={{ __html: insight.insights }} />
              {insight.scratchpad && (
                <details data-testid="scratchpad-toggle">
                  <summary>Show AI Thinking</summary>
                  <pre>{insight.scratchpad}</pre>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {queryHistory.length > 0 && (
        <div data-testid="query-history">
          <h3>Previous Queries</h3>
          <ul>
            {queryHistory.map((q, i) => (
              <li key={i} data-testid={`history-${i}`}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --------------- Tests ---------------

describe('InsightsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Initial Rendering ---

  describe('Initial Rendering', () => {
    it('should render page title', () => {
      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);
      expect(screen.getByTestId('page-title')).toHaveTextContent('AI Portfolio Insights');
    });

    it('should render query input form', () => {
      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);
      expect(screen.getByTestId('query-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });

    it('should display remaining queries count', () => {
      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={3} />);
      expect(screen.getByTestId('remaining-count')).toHaveTextContent('3 queries remaining');
    });

    it('should display tier badge', () => {
      render(<InsightsPage portfolioId="p1" tier="PREMIUM" remainingQueries={95} />);
      expect(screen.getByTestId('tier-badge')).toHaveTextContent('PREMIUM');
    });

    it('should not show insight result initially', () => {
      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);
      expect(screen.queryByTestId('insight-result')).not.toBeInTheDocument();
    });
  });

  // --- Query Submission ---

  describe('Query Submission', () => {
    it('should call API with query on submission', async () => {
      mockSubmitQuery.mockResolvedValue({
        insights: '## Performance\nPortfolio is up 27%.',
        scratchpad: 'Analyzing...',
      });

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      fireEvent.change(screen.getByTestId('query-input'), {
        target: { value: 'How is my portfolio performing?' },
      });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(mockSubmitQuery).toHaveBeenCalledWith('p1', 'How is my portfolio performing?', 'FREE');
      });
    });

    it('should show loading state during API call', async () => {
      mockSubmitQuery.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      fireEvent.change(screen.getByTestId('query-input'), {
        target: { value: 'Test query' },
      });
      fireEvent.submit(screen.getByTestId('query-form'));

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('should display formatted insights after successful query', async () => {
      mockSubmitQuery.mockResolvedValue({
        insights: '<h2>Performance</h2><p>Portfolio is up 27%.</p>',
        scratchpad: 'Analysis complete.',
      });

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      fireEvent.change(screen.getByTestId('query-input'), {
        target: { value: 'Summarize performance' },
      });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(screen.getByTestId('insight-result')).toBeInTheDocument();
        expect(screen.getByTestId('insight-content').innerHTML).toContain('Performance');
      });
    });

    it('should show scratchpad toggle after successful query', async () => {
      mockSubmitQuery.mockResolvedValue({
        insights: 'Results here.',
        scratchpad: 'Thinking process...',
      });

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      fireEvent.change(screen.getByTestId('query-input'), { target: { value: 'Test' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(screen.getByTestId('scratchpad-toggle')).toBeInTheDocument();
      });
    });

    it('should clear input after successful submission', async () => {
      mockSubmitQuery.mockResolvedValue({ insights: 'Done.', scratchpad: '' });

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      const input = screen.getByTestId('query-input');
      fireEvent.change(input, { target: { value: 'My query' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  // --- Financial Advice Rejection ---

  describe('Financial Advice Rejection', () => {
    it('should display rejection message when query is rejected', async () => {
      mockSubmitQuery.mockResolvedValue({
        insights: 'I am unable to provide financial advice.',
        scratchpad: 'Advice query detected.',
        rejected: true,
      });

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      fireEvent.change(screen.getByTestId('query-input'), {
        target: { value: 'Should I sell my tech stocks?' },
      });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(screen.getByTestId('rejection-message')).toHaveTextContent('unable to provide financial advice');
      });
    });
  });

  // --- Error Handling ---

  describe('Error Handling', () => {
    it('should display error state on API failure', async () => {
      mockSubmitQuery.mockRejectedValue(new Error('Service unavailable'));

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      fireEvent.change(screen.getByTestId('query-input'), { target: { value: 'Test' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Service unavailable');
      });
    });
  });

  // --- Query History ---

  describe('Query History', () => {
    it('should add query to history after submission', async () => {
      mockSubmitQuery.mockResolvedValue({ insights: 'Done.', scratchpad: '' });

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      fireEvent.change(screen.getByTestId('query-input'), {
        target: { value: 'First query' },
      });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(screen.getByTestId('history-0')).toHaveTextContent('First query');
      });
    });

    it('should allow submitting another query after first', async () => {
      mockSubmitQuery.mockResolvedValue({ insights: 'Done.', scratchpad: '' });

      render(<InsightsPage portfolioId="p1" tier="FREE" remainingQueries={5} />);

      // First query
      fireEvent.change(screen.getByTestId('query-input'), { target: { value: 'Q1' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
      });

      // Second query
      fireEvent.change(screen.getByTestId('query-input'), { target: { value: 'Q2' } });
      fireEvent.submit(screen.getByTestId('query-form'));

      await waitFor(() => {
        expect(mockSubmitQuery).toHaveBeenCalledTimes(2);
      });
    });
  });
});
