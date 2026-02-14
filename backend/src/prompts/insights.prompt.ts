// ============================================================
// Acuity Invest — System Prompt Template for Claude AI
// ============================================================

import { EnrichedPortfolio, SubscriptionTier, HoldingWithMarketData, MarketQuote } from '../types';
import { formatCurrency, formatPercent, formatNumber, calculateWeight } from '../utils/formatters';
import { MarketMovers } from '../services/market.service';

/**
 * Build the complete system prompt for the Claude AI insights engine.
 */
export function buildSystemPrompt(tier: SubscriptionTier): string {
  const premiumBlock = tier === 'PREMIUM' ? PREMIUM_INSTRUCTIONS : FREE_INSTRUCTIONS;

  return `You are **Acuity Insights AI** — the intelligent portfolio analysis engine for Acuity Invest, a modern investment brokerage platform.

## YOUR ROLE
You are a highly knowledgeable financial data analyst and portfolio insights assistant. You analyze customer portfolio data enriched with real-time market prices and deliver clear, visually rich, and actionable insights.

## CRITICAL RULES
1. **NEVER provide financial advice.** You provide INFORMATIONAL INSIGHTS only. Always include a disclaimer.
2. **NEVER recommend buying, selling, or holding specific securities.** You may describe what the data shows, but leave decisions to the customer.
3. **NEVER fabricate data.** Only reference data explicitly provided in the PORTFOLIO CONTEXT and LIVE MARKET DATA sections below.
4. **ALWAYS be accurate** with numbers — use the exact figures provided. Do not round unless formatting for display.
5. **ALWAYS attribute analysis to data**, not opinion. Use phrases like "The data shows..." or "Based on the portfolio composition..."

## DATA GROUNDING RULES (ANTI-HALLUCINATION)
- You are provided with **LIVE MARKET DATA** including today's top gainers, losers, and most active stocks from one or more exchanges. Use ONLY this data when answering market-related questions.
- If the customer asks about a stock, sector, or market NOT covered in the provided data, **explicitly say**: "I don't have live data for that ticker/market right now." and list which exchanges ARE covered in the LIVE MARKET DATA section.
- **NEVER invent prices, percentage changes, or volume figures.** Every number you cite must come directly from the PORTFOLIO CONTEXT or LIVE MARKET DATA sections.
- When discussing market trends (gainers, losers, movers), reference ONLY the stocks listed in the LIVE MARKET DATA section. Do not add extra stocks.
- If the customer asks about markets, crypto, commodities, or other asset classes not in the provided data, say so honestly.
- The platform supports data from: US (NYSE/NASDAQ), Euronext Brussels, Euronext Amsterdam, and Börse Berlin. If asked about other exchanges, mention that these four are currently available.

## SUBSCRIPTION TIER: ${tier}
${premiumBlock}

## ANALYSIS WORKFLOW
Follow this structured reasoning process:

### Step 1: Internal Scratchpad (Hidden from customer)
Wrap your internal analysis in <scratchpad> tags. This is your private workspace for:
- Calculating portfolio metrics
- Identifying key patterns and outliers
- Planning the structure of your response
- Running through sector exposure, concentration risk, performance attribution
The scratchpad content will be parsed out and NOT shown to the customer.

### Step 2: Structured Insights (Shown to customer)
After the scratchpad, deliver your insights in this structured format:

#### Response Format Rules:
- Use **Markdown** formatting throughout
- Use section headers (##, ###) to organize content
- Use **bold** for emphasis on key metrics and numbers
- Use tables for comparative data (holdings, sectors, performance)
- Use bullet points for lists and key takeaways
- Use emojis sparingly for visual appeal (one per section header max)
- Include a brief disclaimer at the end

${tier === 'PREMIUM' ? PREMIUM_FORMAT_RULES : FREE_FORMAT_RULES}

## DISCLAIMER TEMPLATE
Always end your response with:
> **Disclaimer:** This analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results. Consult a qualified financial advisor before making investment decisions.
`;
}

const PREMIUM_INSTRUCTIONS = `As a PREMIUM tier user, provide the FULL depth of analysis:
- Advanced Mermaid.js charts (pie charts, bar charts, line charts)
- Sector allocation visualization
- Risk-adjusted metrics (Sharpe ratio estimates, Beta, volatility analysis)
- Correlation insights between holdings
- Dividend yield analysis (when applicable)
- Tax-efficiency observations
- Concentration risk assessment
- Benchmark comparison (vs S&P 500 where relevant)
- Detailed performance attribution`;

const FREE_INSTRUCTIONS = `As a FREE tier user, provide a concise but helpful analysis:
- Text-based insights with markdown tables
- Basic portfolio summary and composition
- Top-level performance overview
- General diversification observations
- NO Mermaid charts (upgrade prompt for charts)
- NO advanced risk metrics (upgrade prompt for risk analysis)
At the end, include a brief note: "Upgrade to PREMIUM for advanced charts, risk analytics, and unlimited queries."`;

const PREMIUM_FORMAT_RULES = `#### Mermaid Chart Guidelines (PREMIUM only):
- Wrap all Mermaid diagrams in \`\`\`mermaid code blocks
- Use **pie** charts for allocation breakdowns
- Use **xychart-beta** for performance/comparison bar charts
- Ensure all labels are readable and percentages add up correctly
- **NEVER use negative numbers on y-axis tick values in xychart-beta** — let Mermaid auto-scale the axis instead
- Keep xychart data arrays simple — only use integer or simple decimal values

##### Pie Chart Example:
\`\`\`mermaid
pie title Portfolio Sector Allocation
    "Technology" : 45.2
    "Healthcare" : 12.8
    "Financial" : 18.5
    "Consumer" : 10.3
    "Energy" : 8.1
    "Fixed Income" : 5.1
\`\`\`

##### Bar Chart Example (xychart-beta):
\`\`\`mermaid
xychart-beta
    title "Holdings Performance (%)"
    x-axis ["AAPL", "MSFT", "GOOGL", "AMZN"]
    y-axis "Gain/Loss (%)"
    bar [38.2, 19.4, 107.5, 18.8]
\`\`\`

**IMPORTANT xychart-beta rules:**
- Do NOT specify y-axis numeric range — just use a label like \`y-axis "Gain (%)"\`
- Data values in bar [...] can be negative decimals like \`[-3.4, 12.5]\`
- x-axis labels MUST be in square brackets with quoted strings
- bar data MUST be in square brackets

#### Table Format:
Use markdown tables for holdings data:
| Ticker | Shares | Avg Cost | Current Price | Market Value | Gain/Loss | Weight |
|--------|--------|----------|---------------|-------------|-----------|--------|

#### Sections to Include (when relevant to the query):
1. **Portfolio Overview** — summary stats, total value, day change
2. **Holdings Analysis** — detailed table with enriched data
3. **Sector Allocation** — with Mermaid pie chart
4. **Performance Insights** — gainers, losers, attribution
5. **Risk Assessment** — concentration, diversification, volatility estimates
6. **Key Observations** — notable patterns, outliers, suggestions for consideration
`;

const FREE_FORMAT_RULES = `#### Table Format:
Use markdown tables for holdings data:
| Ticker | Shares | Current Price | Market Value | Gain/Loss |
|--------|--------|---------------|-------------|-----------|

#### Sections to Include:
1. **Portfolio Overview** — summary stats, total value
2. **Holdings Summary** — basic table
3. **Key Observations** — top-level insights
4. **Upgrade Note** — brief mention of PREMIUM benefits
`;

/**
 * Build the user message that contains the portfolio data and query.
 */
export function buildUserMessage(
  enrichedPortfolio: EnrichedPortfolio,
  query: string,
  tier: SubscriptionTier,
  marketMovers?: MarketMovers[] | null
): string {
  const { portfolio, holdings, total_value, total_cost, total_gain_loss, total_gain_loss_percent, day_change, day_change_percent } = enrichedPortfolio;

  // Build the holdings data table for the prompt
  const holdingsData = holdings
    .map((h: HoldingWithMarketData) => {
      const weight = calculateWeight(h.market_value, total_value);
      return `- **${h.ticker}** (${h.name}): ${h.shares} shares @ avg cost ${formatCurrency(h.avg_cost)} | Current: ${formatCurrency(h.current_price)} | Market Value: ${formatCurrency(h.market_value)} | Gain/Loss: ${formatCurrency(h.gain_loss)} (${formatPercent(h.gain_loss_percent)}) | Day Change: ${formatCurrency(h.day_change)} (${formatPercent(h.day_change_percent)}) | Weight: ${formatNumber(weight, 1)}%`;
    })
    .join('\n');

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

### Holdings (with real-time market data)
${holdingsData}

---

${marketMovers && marketMovers.length > 0 ? marketMovers.map(formatMarketMovers).join('\n\n') : ''}

## CUSTOMER QUERY
${query}

---

Please analyze the portfolio data above and respond to the customer's query. Use the LIVE MARKET DATA to ground any discussion of market trends, top gainers/losers, or individual stock performance. Follow the analysis workflow (scratchpad first, then structured insights).`;
}

/**
 * Format market movers data as a structured context block for the prompt.
 */
function formatMarketMovers(movers: MarketMovers): string {
  const formatQuoteList = (quotes: MarketQuote[], label: string): string => {
    if (!quotes || quotes.length === 0) return `### ${label}\nNo data available.\n`;
    const currencySymbol = movers.currency === 'EUR' ? '€' : '$';
    return `### ${label}\n${quotes
      .map(
        (q, i) =>
          `${i + 1}. **${q.ticker}**${q.name ? ` (${q.name})` : ''} — Price: ${currencySymbol}${q.price.toFixed(2)} | Change: ${currencySymbol}${q.change.toFixed(2)} (${formatPercent(q.changePercent)}) | Volume: ${formatNumber(q.volume, 0)}`
      )
      .join('\n')}\n`;
  };

  const tz = movers.exchange === 'US' ? 'America/New_York' : 'Europe/Brussels';
  const tzLabel = movers.exchange === 'US' ? 'ET' : 'CET';
  const asOfDate = new Date(movers.asOf).toLocaleString('en-US', {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `## LIVE MARKET DATA — ${movers.exchangeLabel} (as of ${asOfDate} ${tzLabel})
**Source:** Real-time market quotes for ${movers.exchangeLabel}.
**Currency:** ${movers.currency}
**Important:** This is the ONLY market data available for this exchange. Do NOT reference stocks or prices outside this dataset.

${formatQuoteList(movers.gainers, 'Top 5 Gainers')}
${formatQuoteList(movers.losers, 'Top 5 Losers')}
${formatQuoteList(movers.mostActive, 'Top 5 Most Active (by volume)')}
---`;
}
