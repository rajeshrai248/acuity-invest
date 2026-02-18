/** Infer currency code from ticker suffix. EU exchange tickers end in .BR, .AS, .DE */
export function getCurrencyForTicker(ticker: string): 'EUR' | 'USD' {
  if (ticker.endsWith('.BR') || ticker.endsWith('.AS') || ticker.endsWith('.DE') || ticker.endsWith('.PA')) {
    return 'EUR';
  }
  return 'USD';
}

/** Get the display symbol for a currency code */
export function getCurrencySymbol(currency: string): string {
  return currency === 'EUR' ? '\u20AC' : '$';
}

/** Format a number as currency using the inferred or explicit currency code */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat(currency === 'EUR' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a number as currency using ticker to infer currency */
export function formatCurrencyByTicker(value: number, ticker: string): string {
  return formatCurrency(value, getCurrencyForTicker(ticker));
}

/** Get the region/group label for a ticker */
export function getRegionForTicker(ticker: string): string {
  if (ticker.endsWith('.BR')) return 'Euronext Brussels';
  if (ticker.endsWith('.AS')) return 'Euronext Amsterdam';
  if (ticker.endsWith('.DE')) return 'Börse Frankfurt';
  if (ticker.endsWith('.PA')) return 'Euronext Paris';
  return 'US (NYSE/NASDAQ)';
}

/** Get a broad region category for grouping */
export function getRegionGroup(ticker: string): 'US Equities' | 'European Equities' | 'Global ETFs' | 'Fixed Income' | 'Alternatives' {
  const etfTickers = ['IWDA.AS', 'VWCE.DE', 'IMAE.AS', 'VTI'];
  const bondTickers = ['IEGA.AS', 'BND', 'AGG', 'VCIT', 'MUB'];
  const altTickers = ['GLD', 'IAU', 'VNQ', 'VNQI'];

  if (etfTickers.includes(ticker)) return 'Global ETFs';
  if (bondTickers.includes(ticker)) return 'Fixed Income';
  if (altTickers.includes(ticker)) return 'Alternatives';
  if (ticker.endsWith('.BR') || ticker.endsWith('.AS') || ticker.endsWith('.DE') || ticker.endsWith('.PA')) return 'European Equities';
  return 'US Equities';
}
