import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Lightbulb, Briefcase, CreditCard, LogOut } from 'lucide-react';
import type { SubscriptionTier } from '../../types';

interface NavbarProps {
  tier: SubscriptionTier;
  customerName: string;
  onLogout?: () => void;
}

const navLinks = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/subscription', label: 'Subscription', icon: CreditCard },
];

export default function Navbar({ tier, customerName, onLogout }: NavbarProps) {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-[#FF6200] rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-900">Acuity</span>
              <span className="text-lg font-light text-[#FF6200] ml-1">Invest</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-orange-50 text-[#FF6200]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                tier === 'PREMIUM'
                  ? 'bg-gradient-to-r from-[#FF6200] to-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {tier}
            </span>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                {customerName
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </div>
              <span className="text-sm font-medium text-gray-700">{customerName}</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navLinks.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-[#FF6200]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
