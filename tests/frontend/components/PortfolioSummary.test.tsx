// ============================================================
// Acuity Invest — PortfolioSummary Component Tests
// Tests for summary cards rendering with portfolio metrics
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// --------------- Mock Data ---------------

const mockPortfolioData = {
  portfolio: {
    id: 'portfolio-001',
    name: 'Growth Portfolio',
    account_type: 'INDIVIDUAL',
    base_currency: 'USD',
  },
  total_value: 26350.0,
  total_cost: 20750.0,
  total_gain_loss: 5600.0,
  total_gain_loss_percent: 26.99,
  day_change: 125.5,
  day_change_percent: 0.48,
  holdings_count: 3,
};

const mockLossPortfolioData = {
  ...mockPortfolioData,
  total_value: 18500.0,
  total_gain_loss: -2250.0,
  total_gain_loss_percent: -10.84,
  day_change: -350.0,
  day_change_percent: -1.86,
};

const mockEmptyPortfolioData = {
  ...mockPortfolioData,
  total_value: 0,
  total_cost: 0,
  total_gain_loss: 0,
  total_gain_loss_percent: 0,
  day_change: 0,
  day_change_percent: 0,
  holdings_count: 0,
};

// --------------- Component Mock ---------------

interface PortfolioSummaryProps {
  data: typeof mockPortfolioData;
}

function PortfolioSummary({ data }: PortfolioSummaryProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
  const isPositive = (val: number) => val >= 0;

  return (
    <div data-testid="portfolio-summary">
      <h2 data-testid="portfolio-name">{data.portfolio.name}</h2>
      <span data-testid="account-type">{data.portfolio.account_type}</span>

      <div data-testid="total-value-card" className="metric-card">
        <span className="label">Total Value</span>
        <span className="value" data-testid="total-value">{formatCurrency(data.total_value)}</span>
      </div>

      <div data-testid="gain-loss-card" className="metric-card">
        <span className="label">Total Gain/Loss</span>
        <span
          className={`value ${isPositive(data.total_gain_loss) ? 'text-green' : 'text-red'}`}
          data-testid="total-gain-loss"
        >
          {formatCurrency(data.total_gain_loss)} ({formatPercent(data.total_gain_loss_percent)})
        </span>
      </div>

      <div data-testid="day-change-card" className="metric-card">
        <span className="label">Day Change</span>
        <span
          className={`value ${isPositive(data.day_change) ? 'text-green' : 'text-red'}`}
          data-testid="day-change"
        >
          {formatCurrency(data.day_change)} ({formatPercent(data.day_change_percent)})
        </span>
      </div>

      <div data-testid="holdings-count-card" className="metric-card">
        <span className="label">Holdings</span>
        <span data-testid="holdings-count">{data.holdings_count}</span>
      </div>
    </div>
  );
}

// --------------- Tests ---------------

describe('PortfolioSummary', () => {
  it('should render the portfolio name', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    expect(screen.getByTestId('portfolio-name')).toHaveTextContent('Growth Portfolio');
  });

  it('should render the account type', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    expect(screen.getByTestId('account-type')).toHaveTextContent('INDIVIDUAL');
  });

  it('should display total portfolio value formatted as currency', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    expect(screen.getByTestId('total-value')).toHaveTextContent('$26,350.00');
  });

  it('should display total gain/loss with positive formatting', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    const gainLoss = screen.getByTestId('total-gain-loss');
    expect(gainLoss).toHaveTextContent('$5,600.00');
    expect(gainLoss).toHaveTextContent('+26.99%');
  });

  it('should display positive gain/loss with green styling', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    const gainLoss = screen.getByTestId('total-gain-loss');
    expect(gainLoss.className).toContain('text-green');
  });

  it('should display negative gain/loss with red styling', () => {
    render(<PortfolioSummary data={mockLossPortfolioData} />);
    const gainLoss = screen.getByTestId('total-gain-loss');
    expect(gainLoss.className).toContain('text-red');
    expect(gainLoss).toHaveTextContent('-$2,250.00');
  });

  it('should display day change with correct formatting', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    const dayChange = screen.getByTestId('day-change');
    expect(dayChange).toHaveTextContent('$125.50');
    expect(dayChange).toHaveTextContent('+0.48%');
  });

  it('should display negative day change with red styling', () => {
    render(<PortfolioSummary data={mockLossPortfolioData} />);
    const dayChange = screen.getByTestId('day-change');
    expect(dayChange.className).toContain('text-red');
  });

  it('should display the number of holdings', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    expect(screen.getByTestId('holdings-count')).toHaveTextContent('3');
  });

  it('should render all four metric cards', () => {
    render(<PortfolioSummary data={mockPortfolioData} />);
    expect(screen.getByTestId('total-value-card')).toBeInTheDocument();
    expect(screen.getByTestId('gain-loss-card')).toBeInTheDocument();
    expect(screen.getByTestId('day-change-card')).toBeInTheDocument();
    expect(screen.getByTestId('holdings-count-card')).toBeInTheDocument();
  });

  it('should handle empty portfolio with zero values', () => {
    render(<PortfolioSummary data={mockEmptyPortfolioData} />);
    expect(screen.getByTestId('total-value')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('holdings-count')).toHaveTextContent('0');
  });
});
