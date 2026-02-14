import { Check, X, Crown, Zap } from 'lucide-react';
import type { SubscriptionTier } from '../../types';

interface TierComparisonProps {
  currentTier: SubscriptionTier;
  onUpgrade: () => void;
  onDowngrade: () => void;
}

interface Feature {
  name: string;
  free: boolean | string;
  premium: boolean | string;
}

const features: Feature[] = [
  { name: 'Portfolio Dashboard', free: true, premium: true },
  { name: 'Holdings Management', free: true, premium: true },
  { name: 'Basic AI Insights', free: true, premium: true },
  { name: 'Markdown Tables & Analysis', free: true, premium: true },
  { name: 'Interactive Mermaid Charts', free: false, premium: true },
  { name: 'Sector Allocation Pie Charts', free: false, premium: true },
  { name: 'Risk Assessment Visualizations', free: false, premium: true },
  { name: 'Advanced AI Reasoning (Scratchpad)', free: false, premium: true },
  { name: 'Detailed Performance Comparison', free: false, premium: true },
  { name: 'Tax-Loss Harvesting Analysis', free: false, premium: true },
  { name: 'Custom Query Suggestions', free: '5 / day', premium: 'Unlimited' },
  { name: 'Priority AI Processing', free: false, premium: true },
];

function FeatureIcon({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-gray-700">{value}</span>;
  }
  return value ? (
    <Check size={18} className="text-green-500" />
  ) : (
    <X size={18} className="text-gray-300" />
  );
}

export default function TierComparison({ currentTier, onUpgrade, onDowngrade }: TierComparisonProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* FREE Tier */}
      <div
        className={`rounded-2xl border-2 p-6 transition-all ${
          currentTier === 'FREE'
            ? 'border-gray-300 bg-white shadow-sm'
            : 'border-gray-100 bg-gray-50/50'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-gray-500" />
            <h3 className="text-xl font-bold text-gray-900">Free</h3>
          </div>
          {currentTier === 'FREE' && (
            <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
              CURRENT
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-6">Basic portfolio tracking and insights</p>

        <div className="mb-6">
          <span className="text-3xl font-bold text-gray-900">$0</span>
          <span className="text-gray-400 text-sm ml-1">/month</span>
        </div>

        <div className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <FeatureIcon value={feature.free} />
              <span className={`text-sm ${feature.free ? 'text-gray-700' : 'text-gray-400'}`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>

        {currentTier === 'PREMIUM' && (
          <button
            onClick={onDowngrade}
            className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Switch to Free
          </button>
        )}
      </div>

      {/* PREMIUM Tier */}
      <div
        className={`rounded-2xl border-2 p-6 relative transition-all ${
          currentTier === 'PREMIUM'
            ? 'border-[#FF6200] bg-white shadow-lg shadow-orange-100'
            : 'border-orange-200 bg-orange-50/30'
        }`}
      >
        {currentTier !== 'PREMIUM' && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 bg-[#FF6200] text-white text-xs font-bold rounded-full shadow-sm">
              RECOMMENDED
            </span>
          </div>
        )}

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-[#FF6200]" />
            <h3 className="text-xl font-bold text-gray-900">Premium</h3>
          </div>
          {currentTier === 'PREMIUM' && (
            <span className="px-3 py-1 bg-[#FF6200] text-white rounded-full text-xs font-bold">
              CURRENT
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-6">Full AI analytics with rich visualizations</p>

        <div className="mb-6">
          <span className="text-3xl font-bold text-gray-900">$19.99</span>
          <span className="text-gray-400 text-sm ml-1">/month</span>
        </div>

        <div className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <FeatureIcon value={feature.premium} />
              <span className="text-sm text-gray-700">{feature.name}</span>
            </div>
          ))}
        </div>

        {currentTier === 'FREE' && (
          <button
            onClick={onUpgrade}
            className="w-full py-2.5 bg-[#FF6200] text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
          >
            Upgrade to Premium
          </button>
        )}
      </div>
    </div>
  );
}
