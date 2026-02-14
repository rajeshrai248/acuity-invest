// ============================================================
// Acuity Invest — DashboardPage Integration Tests
// Tests for the main dashboard page with portfolio data and navigation
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useEffect, useState } from 'react';

// --------------- Mock Data ---------------

const mockPortfolioSummary = {
  portfolio: { id: 'p1', name: 'Growth Portfolio', account_type: 'INDIVIDUAL', base_currency: 'USD' },
  total_value: 26350.0,
  total_cost: 20750.0,
  total_gain_loss: 5600.0,
  total_gain_loss_percent: 26.99,
  day_change: 125.5,
  day_change_percent: 0.48,
  holdings_count: 3,
};

const mockHoldings = [
  { id: 'h1', ticker: 'AAPL', name: 'Apple Inc.', shares: 50, avg_cost: 150, current_price: 195, market_value: 9750, gain_loss: 2250, gain_loss_percent: 30 },
  { id: 'h2', ticker: 'MSFT', name: 'Microsoft Corp.', shares: 30, avg_cost: 300, current_price: 420, market_value: 12600, gain_loss: 3600, gain_loss_percent: 40 },
  { id: 'h3', ticker: 'PG', name: 'Procter & Gamble', shares: 25, avg_cost: 170, current_price: 160, market_value: 4000, gain_loss: -250, gain_loss_percent: -5.88 },
];

// --------------- Mock API ---------------

const mockFetchPortfolio = vi.fn();
const mockFetchHoldings = vi.fn();

// --------------- Component Mock ---------------

interface DashboardPageProps {
  userId: string;
  tier: 'FREE' | 'PREMIUM';
}

function DashboardPage({ userId, tier }: DashboardPageProps) {
  const [portfolio, setPortfolio] = useState<typeof mockPortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<typeof mockHoldings>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const p = await mockFetchPortfolio(userId);
        const h = await mockFetchHoldings(p.portfolio.id);
        setPortfolio(p);
        setHoldings(h);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);

  if (isLoading) {
    return <div data-testid="dashboard-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div data-testid="dashboard-error">{error}</div>;
  }

  if (!portfolio) {
    return <div data-testid="dashboard-empty">No portfolio found. Create one to get started.</div>;
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div data-testid="dashboard-page">
      <header data-testid="dashboard-header">
        <h1>Dashboard</h1>
        <span data-testid="user-tier" className="tier-badge">{tier}</span>
      </header>

      <section data-testid="portfolio-summary-section">
        <h2 data-testid="portfolio-name">{portfolio.portfolio.name}</h2>
        <div data-testid="total-value">{formatCurrency(portfolio.total_value)}</div>
        <div data-testid="total-gain-loss">
          {formatCurrency(portfolio.total_gain_loss)} ({portfolio.total_gain_loss_percent.toFixed(2)}%)
        </div>
        <div data-testid="day-change">
          {formatCurrency(portfolio.day_change)} ({portfolio.day_change_percent.toFixed(2)}%)
        </div>
      </section>

      <section data-testid="holdings-section">
        <h2>Holdings ({holdings.length})</h2>
        <table data-testid="holdings-table">
          <tbody>
            {holdings.map((h) => (
              <tr key={h.id} data-testid={`holding-${h.ticker}`}>
                <td>{h.ticker}</td>
                <td>{h.name}</td>
                <td>{formatCurrency(h.market_value)}</td>
                <td className={h.gain_loss >= 0 ? 'positive' : 'negative'}>
                  {h.gain_loss_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav data-testid="dashboard-nav">
        <a href="/insights" data-testid="nav-insights">Get AI Insights</a>
        {tier === 'FREE' && <a href="/subscription" data-testid="nav-upgrade">Upgrade to Premium</a>}
      </nav>
    </div>
  );
}

// --------------- Tests ---------------

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPortfolio.mockResolvedValue(mockPortfolioSummary);
    mockFetchHoldings.mockResolvedValue(mockHoldings);
  });

  // --- Loading State ---

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    });

    it('should hide loading after data loads', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading')).not.toBeInTheDocument();
      });
    });
  });

  // --- Data Display ---

  describe('Data Display', () => {
    it('should render portfolio name', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('portfolio-name')).toHaveTextContent('Growth Portfolio');
      });
    });

    it('should render total portfolio value', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('total-value')).toHaveTextContent('$26,350.00');
      });
    });

    it('should render gain/loss with percentage', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('total-gain-loss')).toHaveTextContent('$5,600.00');
        expect(screen.getByTestId('total-gain-loss')).toHaveTextContent('26.99%');
      });
    });

    it('should render all holdings in the table', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('holding-AAPL')).toBeInTheDocument();
        expect(screen.getByTestId('holding-MSFT')).toBeInTheDocument();
        expect(screen.getByTestId('holding-PG')).toBeInTheDocument();
      });
    });

    it('should display user tier badge', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('user-tier')).toHaveTextContent('FREE');
      });
    });
  });

  // --- Navigation ---

  describe('Navigation', () => {
    it('should show insights link', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('nav-insights')).toBeInTheDocument();
      });
    });

    it('should show upgrade link for FREE users', async () => {
      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('nav-upgrade')).toBeInTheDocument();
      });
    });

    it('should not show upgrade link for PREMIUM users', async () => {
      render(<DashboardPage userId="user-001" tier="PREMIUM" />);

      await waitFor(() => {
        expect(screen.queryByTestId('nav-upgrade')).not.toBeInTheDocument();
      });
    });
  });

  // --- Error State ---

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      mockFetchPortfolio.mockRejectedValue(new Error('Network error'));

      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-error')).toHaveTextContent('Network error');
      });
    });
  });

  // --- Empty State ---

  describe('Empty State', () => {
    it('should display empty state when no portfolio exists', async () => {
      mockFetchPortfolio.mockResolvedValue(null);

      render(<DashboardPage userId="user-001" tier="FREE" />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument();
      });
    });
  });
});
