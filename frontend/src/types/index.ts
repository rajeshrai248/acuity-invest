export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface Holding {
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  purchase_date: string;
}

export interface Portfolio {
  customer_id: string;
  customer_name: string;
  account_type: string;
  base_currency: string;
  subscription_tier: SubscriptionTier;
  holdings: Holding[];
}

export interface HoldingWithMetrics extends Holding {
  market_value: number;
  gain_loss: number;
  return_pct: number;
}

export interface PortfolioSummaryData {
  total_value: number;
  total_cost: number;
  total_gain: number;
  return_pct: number;
  holdings_count: number;
}

export interface InsightResponse {
  scratchpad: string;
  insights: string;
  raw: string;
}

export interface InsightQuery {
  query: string;
  portfolio_id: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof HoldingWithMetrics;
  direction: SortDirection;
}

// --- Market ---
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

export type ExchangeKey = 'US' | 'BRUSSELS' | 'AMSTERDAM' | 'BERLIN';

export interface ExchangeOption {
  key: ExchangeKey;
  label: string;
  description: string;
}

export const EXCHANGE_OPTIONS: ExchangeOption[] = [
  { key: 'US', label: 'US (NYSE / NASDAQ)', description: 'Major U.S. large-cap stocks' },
  { key: 'BRUSSELS', label: 'Euronext Brussels', description: 'Major Belgian stocks' },
  { key: 'AMSTERDAM', label: 'Euronext Amsterdam', description: 'Major Dutch stocks' },
  { key: 'BERLIN', label: 'Börse Berlin', description: 'Major German stocks' },
];

export interface MarketMovers {
  gainers: MarketQuote[];
  losers: MarketQuote[];
  mostActive: MarketQuote[];
  exchange: ExchangeKey;
  exchangeLabel: string;
  currency: string;
  asOf: number;
}

// --- Auth ---
export interface UserPublic {
  id: string;
  name: string;
  email: string;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
