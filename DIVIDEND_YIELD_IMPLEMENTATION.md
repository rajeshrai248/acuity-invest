# Dividend Yield Implementation Plan

## Overview
Add dividend yield data to portfolio holdings to enable insights about income generation and dividend analysis.

## 1. Database Schema Changes

### Update Holdings Table
**File**: `backend/src/db/database.ts`

Add new columns to holdings table:
```sql
ALTER TABLE holdings ADD COLUMN dividend_yield REAL DEFAULT NULL;
ALTER TABLE holdings ADD COLUMN dividend_per_share REAL DEFAULT NULL;
ALTER TABLE holdings ADD COLUMN ex_dividend_date TEXT DEFAULT NULL;
ALTER TABLE holdings ADD COLUMN dividend_frequency TEXT DEFAULT NULL; -- 'quarterly', 'annual', 'monthly', 'none'
```

**Migration SQL** (create new file: `backend/src/db/migrations/002_add_dividend_fields.sql`):
```sql
-- Add dividend fields to holdings
ALTER TABLE holdings ADD COLUMN dividend_yield REAL DEFAULT NULL;
ALTER TABLE holdings ADD COLUMN dividend_per_share REAL DEFAULT NULL;
ALTER TABLE holdings ADD COLUMN ex_dividend_date TEXT DEFAULT NULL;
ALTER TABLE holdings ADD COLUMN dividend_frequency TEXT DEFAULT NULL;

-- These fields will be populated by market data enrichment
-- dividend_yield: Annual dividend yield as percentage (e.g., 2.5 for 2.5%)
-- dividend_per_share: Annual dividend amount per share in USD/EUR
-- ex_dividend_date: ISO date string of next/last ex-dividend date
-- dividend_frequency: 'quarterly', 'annual', 'monthly', 'semi-annual', 'none'
```

## 2. TypeScript Type Updates

### Update Types
**File**: `backend/src/types/index.ts`

```typescript
// Update Holding interface
export interface Holding {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  purchase_date: string | null;
  // NEW FIELDS:
  dividend_yield?: number | null;           // Annual yield %
  dividend_per_share?: number | null;       // Annual dividend per share
  ex_dividend_date?: string | null;         // ISO date string
  dividend_frequency?: string | null;       // 'quarterly', 'annual', etc.
}

// Update HoldingWithMarketData interface
export interface HoldingWithMarketData extends Holding {
  current_price: number;
  market_value: number;
  total_cost: number;
  gain_loss: number;
  gain_loss_percent: number;
  day_change: number;
  day_change_percent: number;
  // Dividend data is inherited from Holding
  annual_dividend_income?: number;  // CALCULATED: dividend_per_share * shares
}

// Update MarketQuote interface
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
  // NEW FIELDS:
  dividendYield?: number | null;          // Annual yield %
  dividendPerShare?: number | null;       // Annual dividend amount
  exDividendDate?: string | null;         // ISO date string
  dividendFrequency?: string | null;      // Payment frequency
}
```

## 3. Market Data Service Enhancement

### Extend Yahoo Finance Data Fetching
**File**: `backend/src/services/market.service.ts`

Yahoo Finance v8 API provides dividend data in the quote summary endpoint:
```typescript
/**
 * Fetch dividend data for a ticker from Yahoo Finance
 */
async function fetchDividendData(ticker: string): Promise<{
  dividendYield: number | null;
  dividendPerShare: number | null;
  exDividendDate: string | null;
  dividendFrequency: string | null;
}> {
  try {
    // Yahoo Finance quote summary endpoint
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=summaryDetail,defaultKeyStatistics`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AcuityInvest/1.0' }
    });
    
    const data = await response.json();
    const summaryDetail = data?.quoteSummary?.result?.[0]?.summaryDetail;
    const keyStats = data?.quoteSummary?.result?.[0]?.defaultKeyStatistics;
    
    return {
      dividendYield: summaryDetail?.dividendYield?.raw 
        ? summaryDetail.dividendYield.raw * 100  // Convert to percentage
        : null,
      dividendPerShare: summaryDetail?.dividendRate?.raw ?? 
                       keyStats?.lastDividendValue?.raw ?? 
                       null,
      exDividendDate: summaryDetail?.exDividendDate?.fmt ?? null,
      dividendFrequency: inferDividendFrequency(keyStats?.lastFiscalYearEnd?.raw)
    };
  } catch (error) {
    console.warn(`Failed to fetch dividend data for ${ticker}:`, error);
    return {
      dividendYield: null,
      dividendPerShare: null,
      exDividendDate: null,
      dividendFrequency: null
    };
  }
}

function inferDividendFrequency(lastFiscalYear?: number): string | null {
  // Logic to infer frequency based on payment pattern
  // Default to 'quarterly' for US stocks, null if unknown
  return 'quarterly'; // Simplified
}

/**
 * Enhanced getQuote function with dividend data
 */
export async function getQuote(ticker: string): Promise<MarketQuote> {
  // ... existing price fetching logic ...
  
  // Fetch dividend data in parallel
  const [priceData, dividendData] = await Promise.all([
    fetchPriceData(ticker),
    fetchDividendData(ticker)
  ]);
  
  const quote: MarketQuote = {
    // ... existing fields ...
    dividendYield: dividendData.dividendYield,
    dividendPerShare: dividendData.dividendPerShare,
    exDividendDate: dividendData.exDividendDate,
    dividendFrequency: dividendData.dividendFrequency,
  };
  
  return quote;
}
```

## 4. Portfolio Enrichment Update

### Enrich Holdings with Dividend Data
**File**: `backend/src/services/portfolio.service.ts`

```typescript
export async function enrichPortfolio(
  portfolioId: string,
  userId: string
): Promise<EnrichedPortfolio> {
  // ... existing code ...
  
  const enrichedHoldings: HoldingWithMarketData[] = portfolioWithHoldings.holdings.map((holding) => {
    const quote = quotes.get(holding.ticker);
    // ... existing calculations ...
    
    // Calculate annual dividend income
    const annualDividendIncome = quote?.dividendPerShare 
      ? quote.dividendPerShare * holding.shares 
      : undefined;
    
    return {
      ...holding,
      // ... existing fields ...
      // Add dividend fields from quote
      dividend_yield: quote?.dividendYield,
      dividend_per_share: quote?.dividendPerShare,
      ex_dividend_date: quote?.exDividendDate,
      dividend_frequency: quote?.dividendFrequency,
      annual_dividend_income: annualDividendIncome,
    };
  });
  
  // Calculate portfolio-level dividend metrics
  const totalAnnualDividendIncome = enrichedHoldings.reduce((sum, h) => 
    sum + (h.annual_dividend_income ?? 0), 0);
  const portfolioDividendYield = totalValue > 0 
    ? (totalAnnualDividendIncome / totalValue) * 100 
    : 0;
  
  return {
    portfolio: portfolioWithHoldings,
    holdings: enrichedHoldings,
    // ... existing fields ...
    // NEW FIELDS:
    total_annual_dividend_income: totalAnnualDividendIncome,
    portfolio_dividend_yield: portfolioDividendYield,
  };
}
```

## 5. Prompt Enhancement

### Update System Prompt
**File**: `backend/src/prompts/insights.prompt.ts`

Update the prompt to include dividend information:

```typescript
export function buildUserMessage(
  enrichedPortfolio: EnrichedPortfolio,
  query: string,
  tier: SubscriptionTier,
  marketMovers?: MarketMovers[] | null
): string {
  const holdingsData = holdings.map((h: HoldingWithMarketData) => {
    const weight = calculateWeight(h.market_value, total_value);
    
    // Format dividend data
    const dividendInfo = h.dividend_yield 
      ? `| Dividend Yield: ${formatPercent(h.dividend_yield)} | Annual Income: ${formatCurrency(h.annual_dividend_income ?? 0)}`
      : '| No dividend';
    
    return `- **${h.ticker}** (${h.name}): ${h.shares} shares @ avg cost ${formatCurrency(h.avg_cost)} | Current: ${formatCurrency(h.current_price)} | Market Value: ${formatCurrency(h.market_value)} | Gain/Loss: ${formatCurrency(h.gain_loss)} (${formatPercent(h.gain_loss_percent)}) | Day Change: ${formatCurrency(h.day_change)} (${formatPercent(h.day_change_percent)}) | Weight: ${formatNumber(weight, 1)}% ${dividendInfo}`;
  }).join('\n');
  
  return `## PORTFOLIO CONTEXT

**Portfolio Name:** ${portfolio.name}
**Account Type:** ${portfolio.account_type}
**Base Currency:** ${portfolio.base_currency}
**Number of Holdings:** ${holdings.length}
**Subscription Tier:** ${tier}

### Portfolio Summary
- **Total Market Value:** ${formatCurrency(total_value)}
- **Total Cost Basis:** ${formatCurrency(total_cost)}
- **Total Gain/Loss:** ${formatCurrency(total_gain_loss)} (${formatPercent(total_gain_loss_percent)})
- **Today's Change:** ${formatCurrency(day_change)} (${formatPercent(day_change_percent)})
- **Total Annual Dividend Income:** ${formatCurrency(enrichedPortfolio.total_annual_dividend_income ?? 0)}
- **Portfolio Dividend Yield:** ${formatPercent(enrichedPortfolio.portfolio_dividend_yield ?? 0)}

### Holdings (with real-time market data${enrichedPortfolio.total_annual_dividend_income ? ' and dividend information' : ''})
${holdingsData}
...`;
}
```

### Add Dividend Analysis to Instructions

```typescript
const PREMIUM_INSTRUCTIONS = `As a PREMIUM tier user, provide the FULL depth of analysis:
- Interactive charts — Use strategically based on query type
- Sector allocation visualization (donut chart)
- Performance comparison (bar chart with green/red coloring)
- Risk profile visualization (radar chart)
- Value distribution (area or bar chart)
- **Dividend analysis** — yield by holding, income distribution, payout frequency
- Risk-adjusted metrics (concentration scores, volatility observations)
...
`;
```

## 6. Frontend Display Updates

### Add Dividend Columns to Holdings Table
**File**: `frontend/src/components/portfolio/HoldingsTable.tsx`

```tsx
// Add dividend columns
<th>Div Yield</th>
<th>Annual Income</th>

// In the row rendering:
<td className="text-right">
  {holding.dividend_yield 
    ? `${holding.dividend_yield.toFixed(2)}%` 
    : '-'}
</td>
<td className="text-right text-green-600">
  {holding.annual_dividend_income 
    ? formatCurrency(holding.annual_dividend_income) 
    : '-'}
</td>
```

### Add Portfolio Summary Card
**File**: `frontend/src/components/dashboard/DividendSummary.tsx` (NEW FILE)

```tsx
export default function DividendSummary({ portfolio }: { portfolio: Portfolio }) {
  const totalDividendIncome = portfolio.holdings.reduce((sum, h) => 
    sum + (h.annual_dividend_income || 0), 0);
  
  const dividendPayers = portfolio.holdings.filter(h => 
    h.dividend_yield && h.dividend_yield > 0);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">💰 Dividend Income</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Annual Income</span>
          <span className="font-semibold text-green-600">
            {formatCurrency(totalDividendIncome)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Portfolio Yield</span>
          <span className="font-semibold">
            {((totalDividendIncome / totalValue) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Dividend Payers</span>
          <span className="font-semibold">
            {dividendPayers.length} / {portfolio.holdings.length}
          </span>
        </div>
      </div>
    </div>
  );
}
```

## 7. AI Insights Examples

With dividend data available, the AI can now answer:

✅ **"What's the dividend yield of my portfolio?"**
- Shows total annual income
- Portfolio yield percentage
- Breakdown by holding
- Dividend payers vs non-payers

✅ **"Which holdings pay dividends?"**
- List dividend-paying stocks
- Sort by yield
- Show payment frequency
- Ex-dividend dates

✅ **"How much passive income do I generate?"**
- Total annual dividend income
- Monthly estimate
- Comparison to portfolio value
- Income vs growth focus

✅ **"Show me my highest yielding stocks"**
- Bar chart of yields
- Income contribution
- Sector breakdown of dividend income

## 8. Implementation Phases

### Phase 1: Backend Foundation (2-3 hours)
1. Update database schema
2. Update TypeScript types
3. Enhance market data fetching

### Phase 2: Data Enrichment (1-2 hours)
4. Update portfolio enrichment logic
5. Add caching for dividend data
6. Test with various tickers

### Phase 3: AI Integration (1 hour)
7. Update prompt templates
8. Add dividend-specific response modes
9. Test insights queries

### Phase 4: Frontend Display (2-3 hours)
10. Add dividend columns to tables
11. Create dividend summary cards
12. Add dividend-focused charts

### Phase 5: Testing & Documentation (1-2 hours)
13. Write unit tests
14. Update API documentation
15. Add user guide for dividend features

**Total Estimated Time**: 7-11 hours

## 9. Data Source Considerations

### Yahoo Finance API
- **Pros**: Free, no API key, reliable
- **Cons**: Rate limits, may not have data for all stocks
- **Fallback**: Return null for missing dividend data

### Alternative: Financial Modeling Prep API
- More comprehensive dividend history
- Requires API key (free tier: 250 calls/day)
- Better for historical dividend tracking

### Recommended Approach
1. Start with Yahoo Finance (current provider)
2. Gracefully handle missing data (show "-" in UI)
3. Option to upgrade to premium data provider later

## 10. Error Handling

```typescript
// If dividend data unavailable:
- Show "-" or "N/A" in UI
- Don't include in calculations
- AI response: "Dividend data not available for [ticker]"

// If API rate limited:
- Use cached data (even if stale)
- Log warning
- Continue with price data only
```

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Dividend data fetches for common tickers (AAPL, MSFT, JNJ)
- [ ] Portfolio enrichment includes dividend fields
- [ ] AI can answer dividend-related queries
- [ ] Frontend displays dividend data correctly
- [ ] Graceful handling of non-dividend stocks (growth stocks)
- [ ] Performance test with large portfolios (100+ holdings)

## Future Enhancements

1. **Dividend Growth Analysis**: Track dividend increases over time
2. **Payout Ratio**: Analyze dividend sustainability
3. **Dividend Calendar**: Show upcoming ex-dividend dates
4. **DRIP Simulation**: Calculate returns with dividend reinvestment
5. **Tax Implications**: Qualified vs non-qualified dividends
6. **Dividend Aristocrats**: Highlight consistent dividend growers
