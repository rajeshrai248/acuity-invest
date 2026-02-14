// ============================================================
// Acuity Invest — Subscription Service
// ============================================================

import { SubscriptionTier, UserPublic } from '../types';
import { findUserById, updateUserTier, toPublicUser } from '../models/user.model';
import { AppError } from '../middleware/errorHandler.middleware';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  features: string[];
  limits: {
    insightsPerDay: number | string;
    advancedCharts: boolean;
    exportReports: boolean;
    prioritySupport: boolean;
  };
}

const TIER_DETAILS: Record<SubscriptionTier, Omit<SubscriptionInfo, 'tier'>> = {
  FREE: {
    features: [
      'Basic portfolio tracking',
      'Up to 5 AI insight queries per day',
      'Standard market data',
      'Basic text-based insights',
    ],
    limits: {
      insightsPerDay: 5,
      advancedCharts: false,
      exportReports: false,
      prioritySupport: false,
    },
  },
  PREMIUM: {
    features: [
      'Unlimited AI insight queries',
      'Advanced Mermaid.js charts and visualizations',
      'Sector allocation analysis',
      'Risk-adjusted metrics (Sharpe, Sortino, Beta)',
      'Correlation matrix heatmaps',
      'Dividend yield analysis',
      'Tax-loss harvesting suggestions',
      'Export reports as PDF',
      'Priority support',
    ],
    limits: {
      insightsPerDay: 'Unlimited',
      advancedCharts: true,
      exportReports: true,
      prioritySupport: true,
    },
  },
};

/**
 * Get the current subscription details for a user.
 */
export function getSubscription(userId: string): SubscriptionInfo {
  const user = findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const tier = user.subscription_tier;
  return {
    tier,
    ...TIER_DETAILS[tier],
  };
}

/**
 * Upgrade a user's subscription to PREMIUM.
 * In production, this would integrate with a payment processor (Stripe, etc.).
 * For now, it's a mock upgrade that succeeds immediately.
 */
export function upgradeToPremium(userId: string): { user: UserPublic; subscription: SubscriptionInfo } {
  const user = findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.subscription_tier === 'PREMIUM') {
    throw new AppError('User is already on PREMIUM tier', 400);
  }

  // Mock payment processing
  console.log(`[SUBSCRIPTION] Processing PREMIUM upgrade for user ${userId} (mock payment)`);

  const updatedUser = updateUserTier(userId, 'PREMIUM');
  if (!updatedUser) {
    throw new AppError('Failed to upgrade subscription', 500);
  }

  return {
    user: toPublicUser(updatedUser),
    subscription: {
      tier: 'PREMIUM',
      ...TIER_DETAILS.PREMIUM,
    },
  };
}
