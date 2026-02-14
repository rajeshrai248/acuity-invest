// ============================================================
// Acuity Invest — Market Data Service
// ============================================================

import { MarketQuote, CachedQuote } from '../types';
import { config } from '../config';

// In-memory cache for market quotes
const quoteCache = new Map<string, CachedQuote>();

/**
 * Get a real-time market quote for a single ticker.
 * Uses Yahoo Finance v8 chart API (free, no API key required).
 * Results are cached for 5 minutes.
 */
export async function getQuote(ticker: string): Promise<MarketQuote> {
  const normalizedTicker = ticker.toUpperCase().trim();

  // Check cache first
  const cached = quoteCache.get(normalizedTicker);
  if (cached && Date.now() - cached.cachedAt < config.marketCacheTtlMs) {
    return cached.quote;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedTicker)}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AcuityInvest/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned ${response.status} for ${normalizedTicker}`);
    }

    const data = await response.json() as any;
    const result = data?.chart?.result?.[0];

    if (!result) {
      throw new Error(`No data found for ticker: ${normalizedTicker}`);
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    const quote: MarketQuote = {
      ticker: normalizedTicker,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: meta.regularMarketVolume ?? 0,
      previousClose: parseFloat(previousClose.toFixed(2)),
      marketCap: meta.marketCap,
      name: meta.shortName || meta.longName || normalizedTicker,
      timestamp: Date.now(),
    };

    // Cache the result
    quoteCache.set(normalizedTicker, {
      quote,
      cachedAt: Date.now(),
    });

    return quote;
  } catch (error) {
    console.error(`Failed to fetch quote for ${normalizedTicker}:`, error);

    // If we have stale cache data, return it rather than failing
    if (cached) {
      console.warn(`Returning stale cache for ${normalizedTicker}`);
      return cached.quote;
    }

    // Return a placeholder quote so the system doesn't crash
    return {
      ticker: normalizedTicker,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      previousClose: 0,
      name: normalizedTicker,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get real-time quotes for multiple tickers in parallel.
 * Returns a Map of ticker -> MarketQuote.
 */
export async function getBatchQuotes(tickers: string[]): Promise<Map<string, MarketQuote>> {
  const results = new Map<string, MarketQuote>();

  // Fetch all quotes in parallel with a concurrency limit
  const BATCH_SIZE = 10;
  const uniqueTickers = [...new Set(tickers.map((t) => t.toUpperCase().trim()))];

  for (let i = 0; i < uniqueTickers.length; i += BATCH_SIZE) {
    const batch = uniqueTickers.slice(i, i + BATCH_SIZE);
    const quotes = await Promise.all(batch.map((t) => getQuote(t)));

    for (const quote of quotes) {
      results.set(quote.ticker, quote);
    }
  }

  return results;
}

/**
 * Clear the quote cache. Useful for testing.
 */
export function clearQuoteCache(): void {
  quoteCache.clear();
}

/**
 * Get cache stats for monitoring.
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: quoteCache.size,
    entries: Array.from(quoteCache.keys()),
  };
}

// ============================================================
// Exchange / Market Definitions
// ============================================================

export type ExchangeKey = 'US' | 'BRUSSELS' | 'AMSTERDAM' | 'BERLIN';

interface ExchangeDefinition {
  key: ExchangeKey;
  label: string;
  description: string;
  /** Yahoo Finance suffix for tickers on this exchange (e.g. '.BR', '.AS', '.DE'). Empty for US. */
  tickerSuffix: string;
  currency: string;
  timezone: string;
  /**
   * Yahoo Finance index symbol whose chart data can help identify this exchange,
   * or a screener scrId for US markets.
   */
  indexSymbol: string;
}

const EXCHANGES: Record<ExchangeKey, ExchangeDefinition> = {
  US: {
    key: 'US',
    label: 'US (NYSE / NASDAQ)',
    description: 'Major U.S. large-cap stocks',
    tickerSuffix: '',
    currency: 'USD',
    timezone: 'America/New_York',
    indexSymbol: '^GSPC', // S&P 500
  },
  BRUSSELS: {
    key: 'BRUSSELS',
    label: 'Euronext Brussels',
    description: 'Major Belgian stocks on Euronext Brussels',
    tickerSuffix: '.BR',
    currency: 'EUR',
    timezone: 'Europe/Brussels',
    indexSymbol: '^BFX', // BEL 20
  },
  AMSTERDAM: {
    key: 'AMSTERDAM',
    label: 'Euronext Amsterdam',
    description: 'Major Dutch stocks on Euronext Amsterdam',
    tickerSuffix: '.AS',
    currency: 'EUR',
    timezone: 'Europe/Amsterdam',
    indexSymbol: '^AEX', // AEX index
  },
  BERLIN: {
    key: 'BERLIN',
    label: 'Börse Berlin',
    description: 'Major German stocks tradable on Berlin exchange',
    tickerSuffix: '.DE',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    indexSymbol: '^GDAXI', // DAX
  },
};

/** Get exchange info for display / prompt usage */
export function getExchangeInfo(exchange: ExchangeKey = 'US') {
  return EXCHANGES[exchange] || EXCHANGES.US;
}

/** List all available exchanges */
export function listExchanges() {
  return Object.values(EXCHANGES).map(e => ({ key: e.key, label: e.label, description: e.description }));
}

export interface MarketMovers {
  gainers: MarketQuote[];
  losers: MarketQuote[];
  mostActive: MarketQuote[];
  exchange: ExchangeKey;
  exchangeLabel: string;
  currency: string;
  asOf: number;
}

// Per-exchange cache for market movers
const moversCache = new Map<ExchangeKey, { data: MarketMovers; cachedAt: number }>();

// ============================================================
// Yahoo Finance Screener (live ticker discovery)
// ============================================================

interface YahooScreenerQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketPreviousClose?: number;
  marketCap?: number;
  exchange?: string;
  [key: string]: unknown;
}

/**
 * Convert a Yahoo screener quote to our internal MarketQuote.
 */
function screenerQuoteToMarketQuote(q: YahooScreenerQuote): MarketQuote {
  const price = q.regularMarketPrice ?? 0;
  const previousClose = q.regularMarketPreviousClose ?? price;
  const change = q.regularMarketChange ?? (price - previousClose);
  const changePercent = q.regularMarketChangePercent ?? (previousClose > 0 ? (change / previousClose) * 100 : 0);

  return {
    ticker: q.symbol,
    price: parseFloat(price.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    volume: q.regularMarketVolume ?? 0,
    previousClose: parseFloat(previousClose.toFixed(2)),
    marketCap: q.marketCap,
    name: q.shortName || q.longName || q.symbol,
    timestamp: Date.now(),
  };
}

/**
 * Fetch market movers from Yahoo Finance predefined screeners.
 * Works for US markets which have `day_gainers`, `day_losers`, `most_actives`.
 */
async function fetchUSMoversFromScreener(): Promise<{ gainers: MarketQuote[]; losers: MarketQuote[]; mostActive: MarketQuote[] }> {
  const fetchScreener = async (scrId: string, count: number = 10): Promise<MarketQuote[]> => {
    const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=${scrId}&count=${count}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AcuityInvest/1.0' },
    });

    if (!res.ok) {
      throw new Error(`Yahoo screener ${scrId} returned ${res.status}`);
    }

    const data = await res.json() as any;
    const quotes: YahooScreenerQuote[] = data?.finance?.result?.[0]?.quotes || [];
    return quotes.map(screenerQuoteToMarketQuote);
  };

  const [gainers, losers, mostActive] = await Promise.all([
    fetchScreener('day_gainers', 10),
    fetchScreener('day_losers', 10),
    fetchScreener('most_actives', 10),
  ]);

  return {
    gainers: gainers.slice(0, 5),
    losers: losers.slice(0, 5),
    mostActive: mostActive.slice(0, 5),
  };
}

/**
 * Fetch market movers for European exchanges.
 * Uses the Yahoo Finance `/v1/finance/lookup` to dynamically discover tickers
 * on a specific exchange, then fetches live quotes for them.
 *
 * Strategy: search for the most common starting letters to get a diverse set
 * of tickers, then sort by volume/change to find movers.
 */
async function fetchEUMovers(exchangeDef: ExchangeDefinition): Promise<{ gainers: MarketQuote[]; losers: MarketQuote[]; mostActive: MarketQuote[] }> {
  const suffix = exchangeDef.tickerSuffix;

  // Use Yahoo Finance lookup with multiple search queries to discover tickers
  const searchLetters = ['a', 'b', 'c', 'd', 'e', 'k', 'm', 'p', 'r', 's', 'u'];
  const discoveredSymbols = new Set<string>();

  // Map Yahoo exchange codes to our exchange keys
  const exchangeCodeMap: Record<string, string> = {
    '.BR': 'BRU',
    '.AS': 'AMS',
    '.DE': 'BER',
  };
  const yahooExchangeCode = exchangeCodeMap[suffix] || '';

  // Run lookups in parallel for speed
  const lookupResults = await Promise.allSettled(
    searchLetters.map(async (letter) => {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${letter}&quotesCount=20&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AcuityInvest/1.0' },
      });
      if (!res.ok) return [];
      const data = await res.json() as any;
      return (data?.quotes || []) as { symbol: string; exchange: string; quoteType: string }[];
    })
  );

  for (const result of lookupResults) {
    if (result.status === 'fulfilled') {
      for (const q of result.value) {
        if (q.quoteType === 'EQUITY' && q.symbol.endsWith(suffix)) {
          discoveredSymbols.add(q.symbol);
        }
      }
    }
  }

  // If lookup didn't return enough, fall back to well-known indices
  if (discoveredSymbols.size < 10) {
    const fallbackTickers = getFallbackTickers(exchangeDef.key);
    for (const t of fallbackTickers) {
      discoveredSymbols.add(t);
    }
  }

  // Fetch quotes for all discovered symbols
  const tickers = Array.from(discoveredSymbols).slice(0, 30); // Cap at 30 to avoid too many requests
  const quotesMap = await getBatchQuotes(tickers);
  const allQuotes = Array.from(quotesMap.values()).filter(q => q.price > 0);

  // Sort for gainers/losers/most active
  const sorted = [...allQuotes].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();
  const mostActive = [...allQuotes].sort((a, b) => b.volume - a.volume).slice(0, 5);

  return { gainers, losers, mostActive };
}

/**
 * Small fallback list per exchange — only used when Yahoo search returns
 * fewer than 10 tickers. These are well-known, stable index constituents
 * that are unlikely to change symbols frequently.
 */
function getFallbackTickers(exchange: ExchangeKey): string[] {
  switch (exchange) {
    case 'BRUSSELS':
      return ['ABI.BR', 'KBC.BR', 'UCB.BR', 'SOLB.BR', 'ARGX.BR', 'SOF.BR', 'COLR.BR', 'AGS.BR', 'GBLB.BR', 'DIE.BR'];
    case 'AMSTERDAM':
      return ['ASML.AS', 'SHEL.AS', 'PHIA.AS', 'INGA.AS', 'AD.AS', 'UNA.AS', 'HEIA.AS', 'PRX.AS', 'WKL.AS', 'ABN.AS'];
    case 'BERLIN':
      return ['SAP.DE', 'SIE.DE', 'ALV.DE', 'BAS.DE', 'DTE.DE', 'BMW.DE', 'MBG.DE', 'ADS.DE', 'IFX.DE', 'MUV2.DE'];
    default:
      return [];
  }
}

/**
 * Get top market gainers, losers, and most active stocks for a given exchange.
 * For US: uses Yahoo Finance predefined screeners (fully dynamic, no hardcoded tickers).
 * For EU: uses Yahoo Finance search to discover tickers, with a small fallback list.
 */
export async function getMarketMovers(exchange: ExchangeKey = 'US'): Promise<MarketMovers> {
  const exchangeDef = EXCHANGES[exchange] || EXCHANGES.US;

  // Return cache if fresh
  const cached = moversCache.get(exchangeDef.key);
  if (cached && Date.now() - cached.cachedAt < config.marketCacheTtlMs) {
    return cached.data;
  }

  let result: { gainers: MarketQuote[]; losers: MarketQuote[]; mostActive: MarketQuote[] };

  if (exchangeDef.key === 'US') {
    // Use predefined Yahoo screeners — fully dynamic, zero hardcoded tickers
    result = await fetchUSMoversFromScreener();
  } else {
    // European exchanges: dynamic discovery + fallback
    result = await fetchEUMovers(exchangeDef);
  }

  const movers: MarketMovers = {
    ...result,
    exchange: exchangeDef.key,
    exchangeLabel: exchangeDef.label,
    currency: exchangeDef.currency,
    asOf: Date.now(),
  };

  moversCache.set(exchangeDef.key, { data: movers, cachedAt: Date.now() });
  return movers;
}
