// ============================================================
// Acuity Invest — PremiumGate Component Tests
// Tests for tier restriction UI, upgrade CTA, and feature gating
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// --------------- Component Mock ---------------

interface PremiumGateProps {
  tier: 'FREE' | 'PREMIUM';
  feature: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

const PREMIUM_FEATURES = [
  'Interactive Mermaid.js charts and visualizations',
  'Advanced portfolio analytics and sector analysis',
  'Export reports in PDF and CSV formats',
  'Up to 100 AI insight queries per day',
  'Up to 10 portfolios with 100 holdings each',
  'Priority support',
];

function PremiumGate({ tier, feature, children, onUpgrade, onDismiss }: PremiumGateProps) {
  if (tier === 'PREMIUM') {
    return <>{children}</>;
  }

  return (
    <div data-testid="premium-gate" className="premium-gate-overlay">
      <div data-testid="gate-modal" className="gate-modal">
        <h3 data-testid="gate-title">Premium Feature</h3>
        <p data-testid="gate-description">
          <strong>{feature}</strong> is available exclusively for PREMIUM subscribers.
        </p>

        <div data-testid="premium-features-list">
          <h4>Unlock with PREMIUM:</h4>
          <ul>
            {PREMIUM_FEATURES.map((f, i) => (
              <li key={i} data-testid={`feature-${i}`}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="gate-actions">
          <button
            data-testid="upgrade-button"
            className="btn-primary"
            onClick={onUpgrade}
          >
            Upgrade to PREMIUM - $29.99/mo
          </button>

          <button
            data-testid="dismiss-button"
            className="btn-secondary"
            onClick={onDismiss}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------- Tests ---------------

describe('PremiumGate', () => {
  const mockOnUpgrade = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- PREMIUM Users ---

  describe('PREMIUM Users', () => {
    it('should not show gate for PREMIUM users', () => {
      render(
        <PremiumGate tier="PREMIUM" feature="Mermaid Charts">
          <div data-testid="protected-content">Premium Content Here</div>
        </PremiumGate>
      );

      expect(screen.queryByTestId('premium-gate')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should render children for PREMIUM users', () => {
      render(
        <PremiumGate tier="PREMIUM" feature="Advanced Analytics">
          <div data-testid="child-content">Analytics Dashboard</div>
        </PremiumGate>
      );

      expect(screen.getByTestId('child-content')).toHaveTextContent('Analytics Dashboard');
    });
  });

  // --- FREE Users ---

  describe('FREE Users', () => {
    it('should show gate modal for FREE users on premium features', () => {
      render(
        <PremiumGate tier="FREE" feature="Mermaid Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div data-testid="protected-content">Should not be visible</div>
        </PremiumGate>
      );

      expect(screen.getByTestId('premium-gate')).toBeInTheDocument();
      expect(screen.getByTestId('gate-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should display the feature name in the gate description', () => {
      render(
        <PremiumGate tier="FREE" feature="Mermaid Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      expect(screen.getByTestId('gate-description')).toHaveTextContent('Mermaid Charts');
    });

    it('should display upgrade CTA button', () => {
      render(
        <PremiumGate tier="FREE" feature="Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      const upgradeBtn = screen.getByTestId('upgrade-button');
      expect(upgradeBtn).toBeInTheDocument();
      expect(upgradeBtn).toHaveTextContent('Upgrade to PREMIUM');
      expect(upgradeBtn).toHaveTextContent('$29.99/mo');
    });

    it('should list all premium features', () => {
      render(
        <PremiumGate tier="FREE" feature="Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      const featuresList = screen.getByTestId('premium-features-list');
      expect(featuresList).toBeInTheDocument();

      for (let i = 0; i < PREMIUM_FEATURES.length; i++) {
        expect(screen.getByTestId(`feature-${i}`)).toHaveTextContent(PREMIUM_FEATURES[i]);
      }
    });

    it('should include Mermaid charts in features list', () => {
      render(
        <PremiumGate tier="FREE" feature="Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      const featureTexts = screen.getAllByTestId(/^feature-/).map((el) => el.textContent);
      expect(featureTexts.some((t) => t?.includes('Mermaid'))).toBe(true);
    });

    it('should include advanced analytics in features list', () => {
      render(
        <PremiumGate tier="FREE" feature="Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      const featureTexts = screen.getAllByTestId(/^feature-/).map((el) => el.textContent);
      expect(featureTexts.some((t) => t?.includes('Advanced'))).toBe(true);
    });
  });

  // --- Interactions ---

  describe('Interactions', () => {
    it('should call onUpgrade when upgrade button is clicked', () => {
      render(
        <PremiumGate tier="FREE" feature="Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      fireEvent.click(screen.getByTestId('upgrade-button'));
      expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      render(
        <PremiumGate tier="FREE" feature="Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      fireEvent.click(screen.getByTestId('dismiss-button'));
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should display dismiss button with "Maybe Later" text', () => {
      render(
        <PremiumGate tier="FREE" feature="Charts" onUpgrade={mockOnUpgrade} onDismiss={mockOnDismiss}>
          <div>Content</div>
        </PremiumGate>
      );

      expect(screen.getByTestId('dismiss-button')).toHaveTextContent('Maybe Later');
    });
  });
});
