import { useState } from 'react';
import type { LoginCredentials, RegisterCredentials } from '../types';

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onRegister: (credentials: RegisterCredentials) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function LoginPage({ onLogin, onRegister, loading, error }: LoginPageProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await onRegister({ name, email, password });
      } else {
        await onLogin({ email, password });
      }
    } catch {
      // error is handled by the hook
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-11 h-11 bg-[#FF6200] rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">Acuity</span>
              <span className="text-2xl font-light text-[#FF6200] ml-1">Invest</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-1">AI-Powered Portfolio Insights</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isRegisterMode ? 'Create an Account' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#FF6200] hover:bg-orange-600 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait...'
                : isRegisterMode
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isRegisterMode ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsRegisterMode(false)}
                  className="text-[#FF6200] hover:underline font-medium"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsRegisterMode(true)}
                  className="text-[#FF6200] hover:underline font-medium"
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </div>

        {/* Seed user hint (dev only) */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <strong>Demo account:</strong> rajesh@acuityinvest.com / Premium@123
        </div>
      </div>
    </div>
  );
}
