import { CreditCard } from 'lucide-react';
import TierComparison from '../components/subscription/TierComparison';
import type { SubscriptionTier } from '../types';

interface SubscriptionPageProps {
  currentTier: SubscriptionTier;
  onTierChange: (tier: SubscriptionTier) => void;
}

export default function SubscriptionPage({ currentTier, onTierChange }: SubscriptionPageProps) {
  function handleUpgrade() {
    onTierChange('PREMIUM');
  }

  function handleDowngrade() {
    onTierChange('FREE');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CreditCard size={24} className="text-[#FF6200]" />
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        </div>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Choose the plan that best fits your investment analysis needs.
          Upgrade to Premium for full AI-powered analytics with interactive charts.
        </p>
      </div>

      {/* Tier Comparison */}
      <TierComparison
        currentTier={currentTier}
        onUpgrade={handleUpgrade}
        onDowngrade={handleDowngrade}
      />

      {/* Current Plan Info */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Plan</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {currentTier === 'PREMIUM' ? 'Premium' : 'Free'} Plan
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Monthly cost</p>
              <p className="text-lg font-bold text-gray-900">
                {currentTier === 'PREMIUM' ? '$19.99' : '$0.00'}
              </p>
            </div>
          </div>
          {currentTier === 'FREE' && (
            <p className="mt-3 text-xs text-gray-400 border-t border-gray-200 pt-3">
              Note: Tier changes are simulated in this demo. In production, this would integrate with a payment processor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
