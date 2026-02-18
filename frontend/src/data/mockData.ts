import type { Portfolio } from '../types';

export const mockPortfolio: Portfolio = {
  customer_id: "ACU-2024-18523",
  customer_name: "Marc De Smedt",
  account_type: "Private Banking",
  base_currency: "EUR",
  subscription_tier: "PREMIUM" as const,
  holdings: [
    // US Equities
    { ticker: "AAPL", name: "Apple Inc.", shares: 120, avg_cost: 178.50, current_price: 246.81, purchase_date: "2024-03-15" },
    { ticker: "MSFT", name: "Microsoft Corp", shares: 55, avg_cost: 380.25, current_price: 454.07, purchase_date: "2024-01-22" },
    { ticker: "NVDA", name: "NVIDIA Corp", shares: 60, avg_cost: 120.50, current_price: 182.88, purchase_date: "2024-06-10" },
    { ticker: "JPM", name: "JPMorgan Chase", shares: 85, avg_cost: 195.40, current_price: 301.58, purchase_date: "2024-02-18" },
    // European Equities
    { ticker: "ABI.BR", name: "AB InBev SA/NV", shares: 200, avg_cost: 52.30, current_price: 58.45, purchase_date: "2024-04-08" },
    { ticker: "KBC.BR", name: "KBC Group NV", shares: 130, avg_cost: 62.80, current_price: 71.24, purchase_date: "2024-05-14" },
    { ticker: "UCB.BR", name: "UCB SA", shares: 55, avg_cost: 85.60, current_price: 146.30, purchase_date: "2024-01-10" },
    { ticker: "ASML.AS", name: "ASML Holding NV", shares: 18, avg_cost: 620.00, current_price: 710.85, purchase_date: "2024-03-28" },
    { ticker: "AGS.BR", name: "Ageas SA/NV", shares: 220, avg_cost: 41.50, current_price: 46.28, purchase_date: "2024-07-02" },
    // Global ETFs
    { ticker: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", shares: 400, avg_cost: 76.50, current_price: 88.42, purchase_date: "2024-02-05" },
    { ticker: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF", shares: 200, avg_cost: 98.20, current_price: 112.65, purchase_date: "2024-04-20" },
    { ticker: "IMAE.AS", name: "iShares MSCI Europe UCITS ETF", shares: 250, avg_cost: 42.80, current_price: 46.52, purchase_date: "2024-06-15" },
    // Fixed Income
    { ticker: "IEGA.AS", name: "iShares Core EUR Govt Bond UCITS ETF", shares: 350, avg_cost: 124.20, current_price: 122.85, purchase_date: "2024-01-30" },
    { ticker: "BND", name: "Vanguard Total Bond Market ETF", shares: 200, avg_cost: 75.80, current_price: 74.46, purchase_date: "2024-03-12" },
    // Alternatives
    { ticker: "GLD", name: "SPDR Gold Shares", shares: 45, avg_cost: 185.30, current_price: 242.50, purchase_date: "2024-05-08" },
    { ticker: "VNQ", name: "Vanguard Real Estate ETF", shares: 80, avg_cost: 82.60, current_price: 88.15, purchase_date: "2024-08-20" },
  ],
};

export const mockInsightResponse = `
<scratchpad>
- Customer wants comprehensive portfolio overview
- PREMIUM tier - full charts and advanced analytics
- Multi-currency portfolio: EUR base with USD-denominated US holdings
- 16 holdings across US equities, EU equities, global ETFs, fixed income, and alternatives
- Geographic split: ~41% US listed, ~38% EU listed, ~21% Global ETFs
- Total portfolio value (EUR equiv): ~€278,630
- Total cost basis (EUR equiv): ~€236,610
- Total unrealized gain: ~€42,020 (+17.8%)
- Best performer: UCB.BR (+70.9%), Weakest: BND (-1.8%)
- Bond positions slightly negative reflecting rate environment
- Strong diversification across regions, sectors, and asset classes
</scratchpad>

<insights>
## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Total Portfolio Value** | **€278,630** |
| **Total Cost Basis** | €236,610 |
| **Total Unrealized Gain** | **+€42,020** |
| **Overall Return** | **+17.76%** |
| **Holdings** | 16 across 5 asset classes |
| **Currencies** | EUR, USD |

---

## PORTFOLIO ALLOCATION

\`\`\`chart-data
{"type":"donut","title":"Allocation by Asset Class","centerLabel":"€278,630","valueLabel":"%","data":[{"name":"US Equities","value":30.1},{"name":"European Equities","value":18.7},{"name":"Global ETFs","value":25.0},{"name":"Fixed Income","value":20.3},{"name":"Alternatives","value":5.9}]}
\`\`\`

---

## HOLDINGS PERFORMANCE

\`\`\`chart-data
{"type":"bar","title":"Holdings Performance","yAxisLabel":"Return (%)","bars":[{"dataKey":"value","label":"Return %"}],"data":[{"name":"UCB.BR","value":70.9},{"name":"JPM","value":54.3},{"name":"NVDA","value":51.8},{"name":"AAPL","value":38.3},{"name":"GLD","value":30.9},{"name":"MSFT","value":19.4},{"name":"IWDA","value":15.6},{"name":"ASML","value":14.7},{"name":"VWCE","value":14.7},{"name":"KBC.BR","value":13.4},{"name":"ABI.BR","value":11.8},{"name":"AGS.BR","value":11.5},{"name":"IMAE","value":8.7},{"name":"VNQ","value":6.7},{"name":"IEGA","value":-1.1},{"name":"BND","value":-1.8}]}
\`\`\`

| Ticker | Name | Shares | Avg Cost | Current | Value (€) | Return |
|--------|------|--------|----------|---------|-----------|--------|
| UCB.BR | UCB SA | 55 | €85.60 | €146.30 | €8,047 | +70.9% |
| JPM | JPMorgan Chase | 85 | $195.40 | $301.58 | €23,583 | +54.3% |
| NVDA | NVIDIA Corp | 60 | $120.50 | $182.88 | €10,095 | +51.8% |
| AAPL | Apple Inc | 120 | $178.50 | $246.81 | €27,248 | +38.3% |
| GLD | SPDR Gold Shares | 45 | $185.30 | $242.50 | €10,040 | +30.9% |
| MSFT | Microsoft Corp | 55 | $380.25 | $454.07 | €22,976 | +19.4% |
| IWDA.AS | iShares MSCI World | 400 | €76.50 | €88.42 | €35,368 | +15.6% |
| ASML.AS | ASML Holding | 18 | €620.00 | €710.85 | €12,795 | +14.7% |
| VWCE.DE | Vanguard All-World | 200 | €98.20 | €112.65 | €22,530 | +14.7% |
| KBC.BR | KBC Group | 130 | €62.80 | €71.24 | €9,261 | +13.4% |
| ABI.BR | AB InBev | 200 | €52.30 | €58.45 | €11,690 | +11.8% |
| AGS.BR | Ageas | 220 | €41.50 | €46.28 | €10,182 | +11.5% |
| IMAE.AS | iShares Europe | 250 | €42.80 | €46.52 | €11,630 | +8.7% |
| VNQ | Vanguard Real Estate | 80 | $82.60 | $88.15 | €6,488 | +6.7% |
| IEGA.AS | EUR Govt Bond | 350 | €124.20 | €122.85 | €42,998 | -1.1% |
| BND | US Bond Market | 200 | $75.80 | $74.46 | €13,701 | -1.8% |

---

## RISK PROFILE

\`\`\`chart-data
{"type":"radar","title":"Portfolio Risk Profile","data":[{"axis":"Diversification","value":82,"fullMark":100},{"axis":"Geographic Spread","value":78,"fullMark":100},{"axis":"Sector Balance","value":68,"fullMark":100},{"axis":"Volatility Mgmt","value":72,"fullMark":100},{"axis":"Income Stability","value":55,"fullMark":100},{"axis":"Growth Potential","value":75,"fullMark":100}]}
\`\`\`

---

## VALUE DISTRIBUTION

\`\`\`chart-data
{"type":"area","title":"Market Value by Holding","yAxisLabel":"Market Value (€)","areas":[{"dataKey":"value","label":"Market Value"}],"data":[{"name":"IEGA","value":42998},{"name":"IWDA","value":35368},{"name":"AAPL","value":27248},{"name":"JPM","value":23583},{"name":"MSFT","value":22976},{"name":"VWCE","value":22530},{"name":"BND","value":13701},{"name":"ASML","value":12795},{"name":"ABI","value":11690},{"name":"IMAE","value":11630},{"name":"AGS","value":10182},{"name":"NVDA","value":10095},{"name":"GLD","value":10040},{"name":"KBC","value":9261},{"name":"UCB","value":8047},{"name":"VNQ","value":6488}]}
\`\`\`

---

## RECOMMENDATIONS

1. **Strong Geographic Diversification** — The portfolio is well-balanced between US (41%) and European (38%) positions with global ETF coverage (21%). This spread provides resilience against regional downturns.
2. **Review Fixed Income Duration** — Both bond holdings show slight losses (IEGA -1.1%, BND -1.8%) reflecting the rate environment. Shorter-duration alternatives may reduce interest rate sensitivity.
3. **Consider Profit-Taking on Top Performers** — UCB (+70.9%) and JPM (+54.3%) have run significantly. Rebalancing could lock in gains and reduce single-position concentration.
4. **Alternatives Allocation Below Target** — At 5.9%, alternative assets (gold, real estate) are below the 8-10% typically recommended for HNW portfolios. Gold (GLD) has been a strong performer at +30.9%.

> **Disclaimer:** This analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results. Consult a qualified financial advisor before making investment decisions.
</insights>
`;

export const suggestedQueries = [
  "Give me a comprehensive portfolio overview with charts",
  "What are my top performing holdings and why?",
  "Analyze my sector allocation and suggest rebalancing",
  "Show me a risk assessment of my portfolio",
  "Compare my US vs European holdings performance",
  "Analyze my geographic diversification",
  "What tax-loss harvesting opportunities exist?",
  "Analyze the dividend yield of my portfolio",
];
