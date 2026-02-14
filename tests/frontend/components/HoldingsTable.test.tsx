// ============================================================
// Acuity Invest — HoldingsTable Component Tests
// Tests for table rendering, sorting, data display, and formatting
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useState } from 'react';

// --------------- Mock Data ---------------

const mockHoldings = [
  { id: 'h1', ticker: 'AAPL', name: 'Apple Inc.', shares: 50, avg_cost: 150.0, current_price: 195.0, market_value: 9750.0, total_cost: 7500.0, gain_loss: 2250.0, gain_loss_percent: 30.0, day_change: 1.5, day_change_percent: 0.77 },
  { id: 'h2', ticker: 'MSFT', name: 'Microsoft Corporation', shares: 30, avg_cost: 300.0, current_price: 420.0, market_value: 12600.0, total_cost: 9000.0, gain_loss: 3600.0, gain_loss_percent: 40.0, day_change: -0.8, day_change_percent: -0.19 },
  { id: 'h3', ticker: 'PG', name: 'Procter & Gamble Co.', shares: 25, avg_cost: 170.0, current_price: 160.0, market_value: 4000.0, total_cost: 4250.0, gain_loss: -250.0, gain_loss_percent: -5.88, day_change: -0.3, day_change_percent: -0.19 },
  { id: 'h4', ticker: 'NVDA', name: 'NVIDIA Corporation', shares: 20, avg_cost: 500.0, current_price: 880.0, market_value: 17600.0, total_cost: 10000.0, gain_loss: 7600.0, gain_loss_percent: 76.0, day_change: 5.2, day_change_percent: 0.59 },
  { id: 'h5', ticker: 'JNJ', name: 'Johnson & Johnson', shares: 40, avg_cost: 155.0, current_price: 158.0, market_value: 6320.0, total_cost: 6200.0, gain_loss: 120.0, gain_loss_percent: 1.94, day_change: 0.5, day_change_percent: 0.32 },
  { id: 'h6', ticker: 'JPM', name: 'JPMorgan Chase & Co.', shares: 15, avg_cost: 180.0, current_price: 210.0, market_value: 3150.0, total_cost: 2700.0, gain_loss: 450.0, gain_loss_percent: 16.67, day_change: 1.0, day_change_percent: 0.48 },
  { id: 'h7', ticker: 'V', name: 'Visa Inc.', shares: 12, avg_cost: 240.0, current_price: 285.0, market_value: 3420.0, total_cost: 2880.0, gain_loss: 540.0, gain_loss_percent: 18.75, day_change: 0.8, day_change_percent: 0.28 },
  { id: 'h8', ticker: 'UNH', name: 'UnitedHealth Group', shares: 8, avg_cost: 520.0, current_price: 550.0, market_value: 4400.0, total_cost: 4160.0, gain_loss: 240.0, gain_loss_percent: 5.77, day_change: -1.2, day_change_percent: -0.22 },
  { id: 'h9', ticker: 'HD', name: 'Home Depot Inc.', shares: 10, avg_cost: 350.0, current_price: 380.0, market_value: 3800.0, total_cost: 3500.0, gain_loss: 300.0, gain_loss_percent: 8.57, day_change: 2.0, day_change_percent: 0.53 },
  { id: 'h10', ticker: 'DIS', name: 'Walt Disney Co.', shares: 35, avg_cost: 100.0, current_price: 112.0, market_value: 3920.0, total_cost: 3500.0, gain_loss: 420.0, gain_loss_percent: 12.0, day_change: 0.3, day_change_percent: 0.27 },
  { id: 'h11', ticker: 'AMZN', name: 'Amazon.com Inc.', shares: 25, avg_cost: 170.0, current_price: 195.0, market_value: 4875.0, total_cost: 4250.0, gain_loss: 625.0, gain_loss_percent: 14.71, day_change: 1.8, day_change_percent: 0.93 },
  { id: 'h12', ticker: 'TSLA', name: 'Tesla Inc.', shares: 18, avg_cost: 220.0, current_price: 250.0, market_value: 4500.0, total_cost: 3960.0, gain_loss: 540.0, gain_loss_percent: 13.64, day_change: -3.5, day_change_percent: -1.38 },
];

// --------------- Component Mock ---------------

interface HoldingsTableProps {
  holdings: typeof mockHoldings;
}

function HoldingsTable({ holdings }: HoldingsTableProps) {
  const [sortField, setSortField] = useState<string>('ticker');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sorted = [...holdings].sort((a: any, b: any) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (typeof aVal === 'string') return aVal.localeCompare(bVal) * modifier;
    return (aVal - bVal) * modifier;
  });

  return (
    <table data-testid="holdings-table">
      <thead>
        <tr>
          <th data-testid="sort-ticker" onClick={() => handleSort('ticker')}>Ticker</th>
          <th>Name</th>
          <th>Shares</th>
          <th>Avg Cost</th>
          <th>Price</th>
          <th data-testid="sort-market-value" onClick={() => handleSort('market_value')}>Market Value</th>
          <th>Gain/Loss</th>
          <th data-testid="sort-return" onClick={() => handleSort('gain_loss_percent')}>Return %</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((h) => (
          <tr key={h.id} data-testid={`holding-row-${h.ticker}`}>
            <td data-testid={`ticker-${h.ticker}`}>{h.ticker}</td>
            <td>{h.name}</td>
            <td>{h.shares}</td>
            <td>{formatCurrency(h.avg_cost)}</td>
            <td>{formatCurrency(h.current_price)}</td>
            <td data-testid={`market-value-${h.ticker}`}>{formatCurrency(h.market_value)}</td>
            <td className={h.gain_loss >= 0 ? 'text-green' : 'text-red'} data-testid={`gain-loss-${h.ticker}`}>
              {formatCurrency(h.gain_loss)}
            </td>
            <td className={h.gain_loss_percent >= 0 ? 'text-green' : 'text-red'} data-testid={`return-${h.ticker}`}>
              {formatPercent(h.gain_loss_percent)}
            </td>
            <td data-testid={`status-${h.ticker}`}>
              {h.gain_loss_percent > 20 ? '🚀' : h.gain_loss_percent > 0 ? '📈' : h.gain_loss_percent === 0 ? '➡️' : '📉'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --------------- Tests ---------------

describe('HoldingsTable', () => {
  // --- Rendering ---

  describe('Data Rendering', () => {
    it('should render all 12 holdings', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const rows = screen.getAllByTestId(/^holding-row-/);
      expect(rows).toHaveLength(12);
    });

    it('should display correct ticker symbols', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const expectedTickers = ['AAPL', 'MSFT', 'PG', 'NVDA', 'JNJ', 'JPM', 'V', 'UNH', 'HD', 'DIS', 'AMZN', 'TSLA'];
      for (const ticker of expectedTickers) {
        expect(screen.getByTestId(`ticker-${ticker}`)).toHaveTextContent(ticker);
      }
    });

    it('should format currency values correctly ($XXX.XX)', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      expect(screen.getByTestId('market-value-AAPL')).toHaveTextContent('$9,750.00');
      expect(screen.getByTestId('market-value-MSFT')).toHaveTextContent('$12,600.00');
      expect(screen.getByTestId('market-value-PG')).toHaveTextContent('$4,000.00');
    });

    it('should format percentages correctly (+XX.X%)', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      expect(screen.getByTestId('return-AAPL')).toHaveTextContent('+30.0%');
      expect(screen.getByTestId('return-MSFT')).toHaveTextContent('+40.0%');
      expect(screen.getByTestId('return-NVDA')).toHaveTextContent('+76.0%');
    });

    it('should format negative percentages correctly (-X.X%)', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      expect(screen.getByTestId('return-PG')).toHaveTextContent('-5.9%');
    });
  });

  // --- Color Coding ---

  describe('Color Coding', () => {
    it('should show green for positive gains', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const aaplGain = screen.getByTestId('gain-loss-AAPL');
      expect(aaplGain.className).toContain('text-green');
    });

    it('should show red for negative gains (PG)', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const pgGain = screen.getByTestId('gain-loss-PG');
      expect(pgGain.className).toContain('text-red');
    });

    it('should show green return % for positive returns', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const msftReturn = screen.getByTestId('return-MSFT');
      expect(msftReturn.className).toContain('text-green');
    });

    it('should show red return % for negative returns', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const pgReturn = screen.getByTestId('return-PG');
      expect(pgReturn.className).toContain('text-red');
    });
  });

  // --- Sorting ---

  describe('Sorting', () => {
    it('should sort by ticker ascending by default', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const rows = screen.getAllByTestId(/^holding-row-/);
      // Alphabetical order: AAPL, AMZN, DIS, HD, JNJ, JPM, MSFT, NVDA, PG, TSLA, UNH, V
      expect(rows[0]).toHaveAttribute('data-testid', 'holding-row-AAPL');
      expect(rows[1]).toHaveAttribute('data-testid', 'holding-row-AMZN');
    });

    it('should sort by ticker descending on second click', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const tickerHeader = screen.getByTestId('sort-ticker');

      fireEvent.click(tickerHeader); // Now descending

      const rows = screen.getAllByTestId(/^holding-row-/);
      expect(rows[0]).toHaveAttribute('data-testid', 'holding-row-V');
    });

    it('should sort by market value when clicking market value header', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const mvHeader = screen.getByTestId('sort-market-value');

      fireEvent.click(mvHeader);

      const rows = screen.getAllByTestId(/^holding-row-/);
      // Ascending by market value: JPM (3150), V (3420), HD (3800), ...
      expect(rows[0]).toHaveAttribute('data-testid', 'holding-row-JPM');
    });

    it('should sort by return percentage when clicking return header', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      const returnHeader = screen.getByTestId('sort-return');

      fireEvent.click(returnHeader);

      const rows = screen.getAllByTestId(/^holding-row-/);
      // Ascending: PG (-5.88), JNJ (1.94), UNH (5.77), ...
      expect(rows[0]).toHaveAttribute('data-testid', 'holding-row-PG');
    });
  });

  // --- Status Emojis ---

  describe('Status Emojis', () => {
    it('should show rocket emoji for gains > 20%', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      expect(screen.getByTestId('status-AAPL')).toHaveTextContent('🚀'); // 30%
      expect(screen.getByTestId('status-MSFT')).toHaveTextContent('🚀'); // 40%
      expect(screen.getByTestId('status-NVDA')).toHaveTextContent('🚀'); // 76%
    });

    it('should show chart up emoji for 0-20% gains', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      expect(screen.getByTestId('status-JNJ')).toHaveTextContent('📈'); // 1.94%
      expect(screen.getByTestId('status-DIS')).toHaveTextContent('📈'); // 12%
    });

    it('should show chart down emoji for negative gains', () => {
      render(<HoldingsTable holdings={mockHoldings} />);
      expect(screen.getByTestId('status-PG')).toHaveTextContent('📉'); // -5.88%
    });
  });

  // --- Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty holdings array', () => {
      render(<HoldingsTable holdings={[]} />);
      const rows = screen.queryAllByTestId(/^holding-row-/);
      expect(rows).toHaveLength(0);
    });

    it('should handle single holding', () => {
      render(<HoldingsTable holdings={[mockHoldings[0]]} />);
      const rows = screen.getAllByTestId(/^holding-row-/);
      expect(rows).toHaveLength(1);
    });
  });
});
