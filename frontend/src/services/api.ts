import axios from 'axios';
import type { Portfolio, Holding, InsightQuery, AuthResponse, LoginCredentials, RegisterCredentials, MarketMovers } from '../types';
import { mockPortfolio, mockInsightResponse } from '../data/mockData';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally (token expired, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Flag to use mock data (set to true while backend is not connected)
const USE_MOCK = false;

// Backend response envelope
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Backend portfolio shape
interface BackendPortfolio {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  base_currency: string;
  created_at: string;
  holdings?: BackendHolding[];
}

interface BackendHolding {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  purchase_date: string | null;
}

export interface FetchPortfolioResult {
  portfolioId: string;
  portfolio: Portfolio;
}

/**
 * Fetch the authenticated user's first portfolio with holdings.
 * Maps backend shape to frontend Portfolio type.
 */
export async function fetchPortfolio(): Promise<FetchPortfolioResult> {
  if (USE_MOCK) {
    await delay(300);
    return { portfolioId: 'mock-id', portfolio: mockPortfolio };
  }

  // 1. List user's portfolios
  const listResp = await api.get<ApiEnvelope<BackendPortfolio[]>>('/portfolio');
  const portfolios = listResp.data.data;

  if (!portfolios || portfolios.length === 0) {
    // Return empty portfolio
    return {
      portfolioId: '',
      portfolio: {
        customer_id: '',
        customer_name: '',
        account_type: '',
        base_currency: 'USD',
        subscription_tier: 'FREE',
        holdings: [],
      },
    };
  }

  const firstPortfolio = portfolios[0];

  // 2. Get portfolio with holdings
  const detailResp = await api.get<ApiEnvelope<BackendPortfolio>>(`/portfolio/${firstPortfolio.id}`);
  const detail = detailResp.data.data;

  // 3. Get user info for name and tier
  const userRaw = localStorage.getItem('auth_user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  // 4. Map to frontend Portfolio shape
  const portfolio: Portfolio = {
    customer_id: detail.id,
    customer_name: user?.name || 'User',
    account_type: detail.account_type,
    base_currency: detail.base_currency,
    subscription_tier: user?.subscription_tier || 'FREE',
    holdings: (detail.holdings || []).map((h) => ({
      ticker: h.ticker,
      name: h.name,
      shares: h.shares,
      avg_cost: h.avg_cost,
      current_price: h.avg_cost, // Will be enriched by market data if available
      purchase_date: h.purchase_date || '',
    })),
  };

  return { portfolioId: detail.id, portfolio };
}

export async function addHolding(portfolioId: string, holding: Omit<Holding, 'current_price'>): Promise<Holding> {
  if (USE_MOCK) {
    await delay(500);
    return { ...holding, current_price: holding.avg_cost * (1 + Math.random() * 0.4 - 0.1) };
  }
  const response = await api.post<ApiEnvelope<BackendHolding>>(`/portfolio/${portfolioId}/holdings`, holding);
  const h = response.data.data;
  return {
    ticker: h.ticker,
    name: h.name,
    shares: h.shares,
    avg_cost: h.avg_cost,
    current_price: h.avg_cost,
    purchase_date: h.purchase_date || '',
  };
}

export async function deleteHolding(portfolioId: string, ticker: string): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    return;
  }
  await api.delete(`/portfolio/${portfolioId}/holdings/${ticker}`);
}

export async function fetchInsight(query: InsightQuery): Promise<string> {
  if (USE_MOCK) {
    await delay(2000); // Simulate AI processing time
    return mockInsightResponse;
  }
  const response = await api.post<ApiEnvelope<{ insights: string; response?: string }>>('/insights', query);
  const data = response.data.data;
  return data.response || data.insights || '';
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Market API ---

export async function fetchMarketMovers(exchange: string = 'US'): Promise<MarketMovers> {
  const response = await api.get<ApiEnvelope<MarketMovers>>(`/market/movers?exchange=${exchange}`);
  return response.data.data;
}

// --- Auth API ---

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
  const { token, user } = response.data.data;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  return { token, user };
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', credentials);
  const { token, user } = response.data.data;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  return { token, user };
}

export function logoutUser(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export default api;
