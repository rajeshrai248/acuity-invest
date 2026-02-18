import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import DashboardPage from './pages/DashboardPage';
import InsightsPage from './pages/InsightsPage';
import PortfolioPage from './pages/PortfolioPage';
import SubscriptionPage from './pages/SubscriptionPage';
import LoginPage from './pages/LoginPage';
import { usePortfolio } from './hooks/usePortfolio';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const auth = useAuth();

  // Show login page if not authenticated
  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={auth.login}
              onRegister={auth.register}
              loading={auth.loading}
              error={auth.error}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedApp onLogout={auth.logout} userName={auth.user?.name} />;
}

function AuthenticatedApp({ onLogout, userName }: { onLogout: () => void; userName?: string }) {
  const {
    portfolio,
    portfolioId,
    holdingsWithMetrics,
    summary,
    tier,
    addHolding,
    deleteHolding,
    setSubscriptionTier,
  } = usePortfolio();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar tier={tier} customerName={userName || portfolio.customer_name} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                summary={summary}
                holdings={holdingsWithMetrics}
                customerName={userName || portfolio.customer_name}
                baseCurrency={portfolio.base_currency}
              />
            }
          />
          <Route
            path="/insights"
            element={
              <InsightsPage
                portfolioId={portfolioId}
                tier={tier}
              />
            }
          />
          <Route
            path="/portfolio"
            element={
              <PortfolioPage
                holdings={holdingsWithMetrics}
                onAdd={addHolding}
                onDelete={deleteHolding}
              />
            }
          />
          <Route
            path="/subscription"
            element={
              <SubscriptionPage
                currentTier={tier}
                onTierChange={setSubscriptionTier}
              />
            }
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
