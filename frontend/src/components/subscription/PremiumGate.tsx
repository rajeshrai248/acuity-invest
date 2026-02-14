import { Crown, X, BarChart3, PieChart, Brain, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumGateProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const premiumFeatures = [
  { icon: PieChart, label: 'Interactive Mermaid Charts' },
  { icon: BarChart3, label: 'Advanced Analytics & Visualizations' },
  { icon: Brain, label: 'AI Reasoning Scratchpad' },
  { icon: Zap, label: 'Unlimited AI Queries' },
];

export default function PremiumGate({ isOpen, onClose, featureName }: PremiumGateProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF6200] to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <Crown size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Premium Feature</h2>
          {featureName && (
            <p className="text-sm text-[#FF6200] font-medium">{featureName}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Upgrade to Premium to unlock full AI-powered analytics with rich visualizations and unlimited insights.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {premiumFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-orange-50 rounded-lg">
              <feature.icon size={18} className="text-[#FF6200]" />
              <span className="text-sm font-medium text-gray-700">{feature.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-5">
          <span className="text-2xl font-bold text-gray-900">$19.99</span>
          <span className="text-gray-400 text-sm">/month</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={() => { onClose(); navigate('/subscription'); }}
            className="flex-1 py-2.5 bg-[#FF6200] text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}
