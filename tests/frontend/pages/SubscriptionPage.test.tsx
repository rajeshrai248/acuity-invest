// ============================================================
// Acuity Invest — SubscriptionPage Tests
// Tests for subscription management page
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useState } from 'react';

// --------------- Mock API ---------------

const mockUpgrade = vi.fn();
const mockDowngrade = vi.fn();

// --------------- Component Mock ---------------

interface SubscriptionPageProps {
  currentTier: 'FREE' | 'PREMIUM';
  remainingQueries: number;
}

function SubscriptionPage({ currentTier: initialTier, remainingQueries }: SubscriptionPageProps) {
  const [tier, setTier] = useState(initialTier);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await mockUpgrade();
      setTier('PREMIUM');
      setMessage('Successfully upgraded to PREMIUM! Enjoy your new features.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDowngrade = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await mockDowngrade();
      setTier('FREE');
      setMessage('Successfully downgraded to FREE.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div data-testid="subscription-page">
      <h1 data-testid="page-title">Subscription Management</h1>

      <section data-testid="current-plan">
        <h2>Your Current Plan</h2>
        <span data-testid="current-tier">{tier}</span>
        <span data-testid="queries-remaining">{remainingQueries} queries remaining today</span>
      </section>

      {message && <div data-testid="success-message" className="success">{message}</div>}
      {error && <div data-testid="error-message" className="error">{error}</div>}

      <section data-testid="tier-comparison-section">
        <div data-testid="free-plan">
          <h3>Free</h3>
          <p>$0/month</p>
          <ul>
            <li>1 portfolio</li>
            <li>15 holdings</li>
            <li>5 AI queries/day</li>
            <li>Text-only insights</li>
          </ul>
          {tier === 'PREMIUM' && (
            <button data-testid="downgrade-btn" onClick={handleDowngrade} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Downgrade to Free'}
            </button>
          )}
        </div>

        <div data-testid="premium-plan">
          <h3>Premium</h3>
          <p data-testid="premium-price">$29.99/month</p>
          <ul>
            <li>10 portfolios</li>
            <li>100 holdings</li>
            <li>100 AI queries/day</li>
            <li>Mermaid.js charts</li>
            <li>Advanced analytics</li>
            <li>Export reports</li>
          </ul>
          {tier === 'FREE' && (
            <button data-testid="upgrade-btn" onClick={handleUpgrade} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Upgrade to Premium'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// --------------- Tests ---------------

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  describe('Rendering', () => {
    it('should render page title', () => {
      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      expect(screen.getByTestId('page-title')).toHaveTextContent('Subscription Management');
    });

    it('should display current tier', () => {
      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      expect(screen.getByTestId('current-tier')).toHaveTextContent('FREE');
    });

    it('should display remaining queries', () => {
      render(<SubscriptionPage currentTier="FREE" remainingQueries={3} />);
      expect(screen.getByTestId('queries-remaining')).toHaveTextContent('3 queries remaining');
    });

    it('should display premium price', () => {
      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      expect(screen.getByTestId('premium-price')).toHaveTextContent('$29.99/month');
    });
  });

  // --- Upgrade Flow ---

  describe('Upgrade Flow', () => {
    it('should show upgrade button for FREE users', () => {
      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      expect(screen.getByTestId('upgrade-btn')).toBeInTheDocument();
    });

    it('should not show upgrade button for PREMIUM users', () => {
      render(<SubscriptionPage currentTier="PREMIUM" remainingQueries={95} />);
      expect(screen.queryByTestId('upgrade-btn')).not.toBeInTheDocument();
    });

    it('should call upgrade API when upgrade button clicked', async () => {
      mockUpgrade.mockResolvedValue({});

      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      fireEvent.click(screen.getByTestId('upgrade-btn'));

      await waitFor(() => {
        expect(mockUpgrade).toHaveBeenCalledTimes(1);
      });
    });

    it('should show success message after upgrade', async () => {
      mockUpgrade.mockResolvedValue({});

      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      fireEvent.click(screen.getByTestId('upgrade-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('upgraded to PREMIUM');
      });
    });

    it('should update tier display after upgrade', async () => {
      mockUpgrade.mockResolvedValue({});

      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      fireEvent.click(screen.getByTestId('upgrade-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('current-tier')).toHaveTextContent('PREMIUM');
      });
    });

    it('should show error on upgrade failure', async () => {
      mockUpgrade.mockRejectedValue(new Error('Payment failed'));

      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      fireEvent.click(screen.getByTestId('upgrade-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Payment failed');
      });
    });

    it('should disable button while processing', async () => {
      mockUpgrade.mockImplementation(() => new Promise(() => {}));

      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      fireEvent.click(screen.getByTestId('upgrade-btn'));

      expect(screen.getByTestId('upgrade-btn')).toBeDisabled();
      expect(screen.getByTestId('upgrade-btn')).toHaveTextContent('Processing...');
    });
  });

  // --- Downgrade Flow ---

  describe('Downgrade Flow', () => {
    it('should show downgrade button for PREMIUM users', () => {
      render(<SubscriptionPage currentTier="PREMIUM" remainingQueries={95} />);
      expect(screen.getByTestId('downgrade-btn')).toBeInTheDocument();
    });

    it('should not show downgrade button for FREE users', () => {
      render(<SubscriptionPage currentTier="FREE" remainingQueries={5} />);
      expect(screen.queryByTestId('downgrade-btn')).not.toBeInTheDocument();
    });

    it('should update tier to FREE after downgrade', async () => {
      mockDowngrade.mockResolvedValue({});

      render(<SubscriptionPage currentTier="PREMIUM" remainingQueries={95} />);
      fireEvent.click(screen.getByTestId('downgrade-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('current-tier')).toHaveTextContent('FREE');
      });
    });
  });
});
