// ============================================================
// Acuity Invest — MetricCard Component Tests
// Tests for KPI card rendering with various data formats
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// --------------- Component Mock ---------------

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  format?: 'currency' | 'percent' | 'number';
  icon?: string;
  className?: string;
}

function MetricCard({ label, value, change, changePercent, format, icon, className = '' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      case 'percent':
        return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(val);
      default:
        return String(val);
    }
  };

  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <div data-testid="metric-card" className={`metric-card ${className}`}>
      {icon && <span data-testid="metric-icon" className="metric-icon">{icon}</span>}
      <div className="metric-content">
        <span data-testid="metric-label" className="metric-label">{label}</span>
        <span data-testid="metric-value" className="metric-value">{formatValue(value)}</span>
        {change !== undefined && (
          <span
            data-testid="metric-change"
            className={`metric-change ${isPositive ? 'text-green' : 'text-red'}`}
          >
            {change >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(change)}
            {changePercent !== undefined && ` (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`}
          </span>
        )}
      </div>
    </div>
  );
}

// --------------- Tests ---------------

describe('MetricCard', () => {
  // --- Basic Rendering ---

  describe('Basic Rendering', () => {
    it('should render label and value', () => {
      render(<MetricCard label="Total Value" value="$26,350.00" />);

      expect(screen.getByTestId('metric-label')).toHaveTextContent('Total Value');
      expect(screen.getByTestId('metric-value')).toHaveTextContent('$26,350.00');
    });

    it('should render with icon', () => {
      render(<MetricCard label="Holdings" value={12} icon="📊" />);

      expect(screen.getByTestId('metric-icon')).toHaveTextContent('📊');
    });

    it('should not render icon when not provided', () => {
      render(<MetricCard label="Holdings" value={12} />);

      expect(screen.queryByTestId('metric-icon')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<MetricCard label="Test" value="123" className="custom-class" />);

      expect(screen.getByTestId('metric-card').className).toContain('custom-class');
    });
  });

  // --- Currency Formatting ---

  describe('Currency Formatting', () => {
    it('should format numeric value as currency', () => {
      render(<MetricCard label="Portfolio Value" value={26350} format="currency" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('$26,350.00');
    });

    it('should format large currency values with commas', () => {
      render(<MetricCard label="Market Cap" value={3010000000} format="currency" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('$3,010,000,000.00');
    });

    it('should format small currency values correctly', () => {
      render(<MetricCard label="Price" value={0.5} format="currency" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('$0.50');
    });
  });

  // --- Percentage Formatting ---

  describe('Percentage Formatting', () => {
    it('should format positive percentage with + sign', () => {
      render(<MetricCard label="Return" value={26.99} format="percent" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('+26.99%');
    });

    it('should format negative percentage with - sign', () => {
      render(<MetricCard label="Return" value={-5.88} format="percent" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('-5.88%');
    });

    it('should format zero percentage', () => {
      render(<MetricCard label="Return" value={0} format="percent" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('+0.00%');
    });
  });

  // --- Change Indicator ---

  describe('Change Indicator', () => {
    it('should display positive change in green', () => {
      render(<MetricCard label="Day Change" value="$125.50" change={125.5} changePercent={0.48} />);

      const changeEl = screen.getByTestId('metric-change');
      expect(changeEl.className).toContain('text-green');
      expect(changeEl).toHaveTextContent('+$125.50');
      expect(changeEl).toHaveTextContent('+0.48%');
    });

    it('should display negative change in red', () => {
      render(<MetricCard label="Day Change" value="-$350.00" change={-350} changePercent={-1.86} />);

      const changeEl = screen.getByTestId('metric-change');
      expect(changeEl.className).toContain('text-red');
      expect(changeEl).toHaveTextContent('-$350.00');
    });

    it('should not show change when not provided', () => {
      render(<MetricCard label="Holdings" value={12} />);

      expect(screen.queryByTestId('metric-change')).not.toBeInTheDocument();
    });

    it('should show change without percent when changePercent is not provided', () => {
      render(<MetricCard label="Change" value="$100" change={100} />);

      const changeEl = screen.getByTestId('metric-change');
      expect(changeEl).toHaveTextContent('+$100.00');
      expect(changeEl.textContent).not.toContain('%');
    });
  });

  // --- Number Formatting ---

  describe('Number Formatting', () => {
    it('should format number with commas', () => {
      render(<MetricCard label="Volume" value={52340000} format="number" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('52,340,000');
    });

    it('should handle string values as-is', () => {
      render(<MetricCard label="Status" value="Active" />);

      expect(screen.getByTestId('metric-value')).toHaveTextContent('Active');
    });
  });
});
