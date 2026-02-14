// ============================================================
// Acuity Invest — TierComparison Component Tests
// Tests for subscription tier comparison table rendering
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// --------------- Component Mock ---------------

interface TierComparisonProps {
  currentTier: 'FREE' | 'PREMIUM';
  onUpgrade?: () => void;
}

const TIERS = {
  FREE: {
    name: 'Free',
    price: '$0',
    priceNote: 'Forever free',
    features: {
      portfolios: '1 portfolio',
      holdings: '15 holdings per portfolio',
      queries: '5 AI queries per day',
      charts: 'Basic text insights',
      analytics: 'Standard metrics',
      exports: 'Not available',
      support: 'Community support',
    },
  },
  PREMIUM: {
    name: 'Premium',
    price: '$29.99',
    priceNote: 'per month',
    features: {
      portfolios: '10 portfolios',
      holdings: '100 holdings per portfolio',
      queries: '100 AI queries per day',
      charts: 'Mermaid.js interactive charts',
      analytics: 'Advanced sector & risk analytics',
      exports: 'PDF & CSV export',
      support: 'Priority email support',
    },
  },
};

function TierComparison({ currentTier, onUpgrade }: TierComparisonProps) {
  return (
    <div data-testid="tier-comparison">
      <h2 data-testid="comparison-title">Choose Your Plan</h2>

      <div className="tier-cards">
        {/* FREE Tier */}
        <div data-testid="tier-card-free" className={`tier-card ${currentTier === 'FREE' ? 'current' : ''}`}>
          <h3 data-testid="tier-name-free">{TIERS.FREE.name}</h3>
          <div data-testid="tier-price-free" className="tier-price">
            <span className="price">{TIERS.FREE.price}</span>
            <span className="note">{TIERS.FREE.priceNote}</span>
          </div>
          {currentTier === 'FREE' && <span data-testid="current-badge-free" className="badge">Current Plan</span>}

          <ul data-testid="tier-features-free">
            {Object.entries(TIERS.FREE.features).map(([key, val]) => (
              <li key={key} data-testid={`free-feature-${key}`}>{val}</li>
            ))}
          </ul>
        </div>

        {/* PREMIUM Tier */}
        <div data-testid="tier-card-premium" className={`tier-card ${currentTier === 'PREMIUM' ? 'current' : ''}`}>
          <h3 data-testid="tier-name-premium">{TIERS.PREMIUM.name}</h3>
          <div data-testid="tier-price-premium" className="tier-price">
            <span className="price">{TIERS.PREMIUM.price}</span>
            <span className="note">{TIERS.PREMIUM.priceNote}</span>
          </div>
          {currentTier === 'PREMIUM' && <span data-testid="current-badge-premium" className="badge">Current Plan</span>}

          <ul data-testid="tier-features-premium">
            {Object.entries(TIERS.PREMIUM.features).map(([key, val]) => (
              <li key={key} data-testid={`premium-feature-${key}`}>{val}</li>
            ))}
          </ul>

          {currentTier === 'FREE' && (
            <button data-testid="upgrade-cta" className="btn-upgrade" onClick={onUpgrade}>
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------- Tests ---------------

describe('TierComparison', () => {
  const mockOnUpgrade = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  describe('Rendering', () => {
    it('should render comparison title', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      expect(screen.getByTestId('comparison-title')).toHaveTextContent('Choose Your Plan');
    });

    it('should render both FREE and PREMIUM tier cards', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      expect(screen.getByTestId('tier-card-free')).toBeInTheDocument();
      expect(screen.getByTestId('tier-card-premium')).toBeInTheDocument();
    });

    it('should display FREE tier name and price', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      expect(screen.getByTestId('tier-name-free')).toHaveTextContent('Free');
      expect(screen.getByTestId('tier-price-free')).toHaveTextContent('$0');
      expect(screen.getByTestId('tier-price-free')).toHaveTextContent('Forever free');
    });

    it('should display PREMIUM tier name and price', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      expect(screen.getByTestId('tier-name-premium')).toHaveTextContent('Premium');
      expect(screen.getByTestId('tier-price-premium')).toHaveTextContent('$29.99');
      expect(screen.getByTestId('tier-price-premium')).toHaveTextContent('per month');
    });
  });

  // --- Feature Lists ---

  describe('Feature Lists', () => {
    it('should display FREE tier features', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);

      expect(screen.getByTestId('free-feature-portfolios')).toHaveTextContent('1 portfolio');
      expect(screen.getByTestId('free-feature-holdings')).toHaveTextContent('15 holdings');
      expect(screen.getByTestId('free-feature-queries')).toHaveTextContent('5 AI queries');
      expect(screen.getByTestId('free-feature-charts')).toHaveTextContent('Basic text insights');
      expect(screen.getByTestId('free-feature-exports')).toHaveTextContent('Not available');
    });

    it('should display PREMIUM tier features', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);

      expect(screen.getByTestId('premium-feature-portfolios')).toHaveTextContent('10 portfolios');
      expect(screen.getByTestId('premium-feature-holdings')).toHaveTextContent('100 holdings');
      expect(screen.getByTestId('premium-feature-queries')).toHaveTextContent('100 AI queries');
      expect(screen.getByTestId('premium-feature-charts')).toHaveTextContent('Mermaid.js interactive charts');
      expect(screen.getByTestId('premium-feature-exports')).toHaveTextContent('PDF & CSV');
    });

    it('should show that PREMIUM has more portfolios than FREE', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);

      const freePortfolios = screen.getByTestId('free-feature-portfolios').textContent;
      const premiumPortfolios = screen.getByTestId('premium-feature-portfolios').textContent;

      expect(freePortfolios).toContain('1');
      expect(premiumPortfolios).toContain('10');
    });
  });

  // --- Current Tier Badge ---

  describe('Current Tier Badge', () => {
    it('should show "Current Plan" badge on FREE card for FREE users', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      expect(screen.getByTestId('current-badge-free')).toHaveTextContent('Current Plan');
      expect(screen.queryByTestId('current-badge-premium')).not.toBeInTheDocument();
    });

    it('should show "Current Plan" badge on PREMIUM card for PREMIUM users', () => {
      render(<TierComparison currentTier="PREMIUM" />);
      expect(screen.getByTestId('current-badge-premium')).toHaveTextContent('Current Plan');
      expect(screen.queryByTestId('current-badge-free')).not.toBeInTheDocument();
    });

    it('should highlight current tier card with "current" class', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      expect(screen.getByTestId('tier-card-free').className).toContain('current');
      expect(screen.getByTestId('tier-card-premium').className).not.toContain('current');
    });
  });

  // --- Upgrade CTA ---

  describe('Upgrade CTA', () => {
    it('should show upgrade button for FREE users', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      expect(screen.getByTestId('upgrade-cta')).toBeInTheDocument();
      expect(screen.getByTestId('upgrade-cta')).toHaveTextContent('Upgrade to Premium');
    });

    it('should not show upgrade button for PREMIUM users', () => {
      render(<TierComparison currentTier="PREMIUM" />);
      expect(screen.queryByTestId('upgrade-cta')).not.toBeInTheDocument();
    });

    it('should call onUpgrade when upgrade button is clicked', () => {
      render(<TierComparison currentTier="FREE" onUpgrade={mockOnUpgrade} />);
      fireEvent.click(screen.getByTestId('upgrade-cta'));
      expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
    });
  });
});
