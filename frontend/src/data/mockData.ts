import type { Portfolio } from '../types';

export const mockPortfolio: Portfolio = {
  customer_id: "ACU-2024-07842",
  customer_name: "Rajesh Menon",
  account_type: "Individual Brokerage",
  base_currency: "USD",
  subscription_tier: "PREMIUM" as const,
  holdings: [
    { ticker: "AAPL", name: "Apple Inc.", shares: 45, avg_cost: 178.50, current_price: 246.81, purchase_date: "2024-06-15" },
    { ticker: "MSFT", name: "Microsoft Corp", shares: 30, avg_cost: 380.25, current_price: 454.07, purchase_date: "2024-03-10" },
    { ticker: "GOOGL", name: "Alphabet Inc", shares: 20, avg_cost: 155.80, current_price: 323.30, purchase_date: "2024-07-22" },
    { ticker: "AMZN", name: "Amazon.com", shares: 25, avg_cost: 178.25, current_price: 229.61, purchase_date: "2024-05-18" },
    { ticker: "NVDA", name: "NVIDIA Corp", shares: 15, avg_cost: 120.50, current_price: 182.88, purchase_date: "2024-08-05" },
    { ticker: "JPM", name: "JPMorgan Chase", shares: 35, avg_cost: 195.40, current_price: 301.58, purchase_date: "2024-04-12" },
    { ticker: "JNJ", name: "Johnson & Johnson", shares: 40, avg_cost: 158.20, current_price: 237.00, purchase_date: "2024-06-28" },
    { ticker: "V", name: "Visa Inc", shares: 20, avg_cost: 275.60, current_price: 314.17, purchase_date: "2024-02-14" },
    { ticker: "PG", name: "Procter & Gamble", shares: 30, avg_cost: 165.80, current_price: 160.10, purchase_date: "2024-09-01" },
    { ticker: "XOM", name: "Exxon Mobil", shares: 25, avg_cost: 105.30, current_price: 150.03, purchase_date: "2024-01-20" },
    { ticker: "VTI", name: "Vanguard Total Stock Mkt ETF", shares: 50, avg_cost: 245.00, current_price: 336.01, purchase_date: "2024-05-10" },
    { ticker: "BND", name: "Vanguard Total Bond Mkt ETF", shares: 100, avg_cost: 72.50, current_price: 74.46, purchase_date: "2024-03-15" },
  ],
};

export const mockInsightResponse = `
<scratchpad>
- Customer wants comprehensive portfolio overview
- PREMIUM tier - full Mermaid charts and advanced analytics
- Need to calculate: total value, gains/losses, sector allocation, performance comparison
- Portfolio has 12 holdings across tech, finance, healthcare, consumer, energy, and ETFs
- Total cost basis: $74,605.25 | Total market value: $98,796.95
- Best performer: GOOGL (+107.5%), Worst: PG (-3.4%)
</scratchpad>

<insights>
## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Total Portfolio Value** | **$98,796.95** |
| **Total Cost Basis** | $74,605.25 |
| **Total Unrealized Gain** | **+$24,191.70** |
| **Overall Return** | **+32.43%** |

---

## PORTFOLIO ALLOCATION

\`\`\`mermaid
pie title Portfolio Allocation by Sector ($98,797 Total)
    "Technology" : 34.4
    "Financial Services" : 17.0
    "Broad Market ETF" : 17.0
    "Healthcare" : 9.6
    "Fixed Income ETF" : 7.5
    "Consumer Discretionary" : 5.8
    "Consumer Staples" : 4.9
    "Energy" : 3.8
\`\`\`

---

## TOP PERFORMERS

| Ticker | Name | Return | Status |
|--------|------|--------|--------|
| GOOGL | Alphabet Inc | +107.5% | Top Performer |
| JPM | JPMorgan Chase | +54.3% | Strong |
| NVDA | NVIDIA Corp | +51.8% | Strong |
| XOM | Exxon Mobil | +42.5% | Strong |
| AAPL | Apple Inc | +38.3% | Solid |

---

## RISK ASSESSMENT

\`\`\`mermaid
pie title Risk Distribution
    "Low Risk" : 24.5
    "Medium Risk" : 58.3
    "High Risk" : 17.2
\`\`\`

---

## HOLDINGS PERFORMANCE

| Ticker | Name | Shares | Avg Cost | Current | Market Value | Return |
|--------|------|--------|----------|---------|-------------|--------|
| GOOGL | Alphabet Inc | 20 | $155.80 | $323.30 | $6,466.00 | +107.5% |
| JPM | JPMorgan Chase | 35 | $195.40 | $301.58 | $10,555.30 | +54.3% |
| NVDA | NVIDIA Corp | 15 | $120.50 | $182.88 | $2,743.20 | +51.8% |
| XOM | Exxon Mobil | 25 | $105.30 | $150.03 | $3,750.75 | +42.5% |
| JNJ | Johnson & Johnson | 40 | $158.20 | $237.00 | $9,480.00 | +49.8% |
| AAPL | Apple Inc | 45 | $178.50 | $246.81 | $11,106.45 | +38.3% |
| VTI | Vanguard ETF | 50 | $245.00 | $336.01 | $16,800.50 | +37.1% |
| AMZN | Amazon.com | 25 | $178.25 | $229.61 | $5,740.25 | +28.8% |
| MSFT | Microsoft | 30 | $380.25 | $454.07 | $13,622.10 | +19.4% |
| V | Visa Inc | 20 | $275.60 | $314.17 | $6,283.40 | +14.0% |
| BND | Vanguard Bond ETF | 100 | $72.50 | $74.46 | $7,446.00 | +2.7% |
| PG | Procter & Gamble | 30 | $165.80 | $160.10 | $4,803.00 | -3.4% |

---

## RECOMMENDATIONS

1. **Rebalance Technology Exposure** - Tech sector at 34.4% is above the recommended 25-30% allocation. Consider trimming GOOGL after its strong 107.5% run.
2. **Increase Fixed Income** - Bond allocation at 7.5% is low for a balanced portfolio. Consider adding to BND position.
3. **Monitor PG Position** - Only holding with negative returns (-3.4%). Evaluate if the thesis still holds.
4. **Tax-Loss Harvesting** - PG presents an opportunity for tax-loss harvesting if desired.
</insights>
`;

export const suggestedQueries = [
  "Give me a comprehensive portfolio overview with charts",
  "What are my top performing holdings and why?",
  "Analyze my sector allocation and suggest rebalancing",
  "Show me a risk assessment of my portfolio",
  "What tax-loss harvesting opportunities exist?",
  "Compare my portfolio performance against the S&P 500",
  "Which holdings should I consider selling?",
  "Analyze the dividend yield of my portfolio",
];
