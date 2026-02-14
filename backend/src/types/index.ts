// ============================================================
// Acuity Invest — Shared TypeScript Types
// ============================================================

// --- Subscription Tiers ---
export type SubscriptionTier = 'FREE' | 'PREMIUM';

// --- User ---
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

// --- Portfolio ---
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  base_currency: string;
  created_at: string;
}

export interface PortfolioWithHoldings extends Portfolio {
  holdings: Holding[];
}

// --- Holding ---
export interface Holding {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  purchase_date: string | null;
}

export interface HoldingWithMarketData extends Holding {
  current_price: number;
  market_value: number;
  total_cost: number;
  gain_loss: number;
  gain_loss_percent: number;
  day_change: number;
  day_change_percent: number;
}

// --- Market Data ---
export interface MarketQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  marketCap?: number;
  name?: string;
  timestamp: number;
}

export interface CachedQuote {
  quote: MarketQuote;
  cachedAt: number;
}

// --- Insight ---
export interface InsightLog {
  id: string;
  user_id: string;
  portfolio_id: string;
  query: string;
  response: string | null;
  tier: SubscriptionTier;
  created_at: string;
}

export interface InsightRequest {
  portfolio_id: string;
  query: string;
}

export interface InsightResponse {
  id: string;
  query: string;
  response: string;
  tier: SubscriptionTier;
  created_at: string;
  scratchpad?: string;
  insights: string;
}

// --- Auth ---
export interface AuthTokenPayload {
  userId: string;
  email: string;
  tier: SubscriptionTier;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

// --- API Response Envelope ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// --- Express Request Extension ---
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

// --- Portfolio Enriched for AI ---
export interface EnrichedPortfolio {
  portfolio: Portfolio;
  holdings: HoldingWithMarketData[];
  total_value: number;
  total_cost: number;
  total_gain_loss: number;
  total_gain_loss_percent: number;
  day_change: number;
  day_change_percent: number;
}
