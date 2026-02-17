// ============================================================
// Acuity Invest MCP Server — Portfolio Tools
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { enrichPortfolio, listPortfolios } from '../../../backend/src/services/portfolio.service';
import { handleServiceError } from '../errors';

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

/**
 * Register portfolio-related tools.
 */
export function registerPortfolioTools(
  server: McpServer,
  getUserId: () => string
): void {
  // Tool: Get enriched portfolio summary with live market data
  (server as any).tool(
    'get_portfolio_summary',
    'Get a portfolio summary enriched with live market data, P&L, and totals. Returns detailed per-holding performance and portfolio-level aggregates.',
    {
      type: 'object',
      properties: {
        portfolio_id: {
          type: 'string',
          description: 'Portfolio ID to get summary for. Use list_portfolios to find available IDs.',
        },
      },
      required: ['portfolio_id'],
    },
    async (args: { portfolio_id: string }) => {
      try {
        const userId = getUserId();
        const enriched = await enrichPortfolio(args.portfolio_id, userId);
        const summary = formatPortfolioSummary(enriched);
        return textResult(summary);
      } catch (error) {
        return handleServiceError(error, 'get_portfolio_summary');
      }
    }
  );

  // Tool: List all portfolios
  (server as any).tool(
    'list_portfolios',
    'List all portfolios for the authenticated user. Returns portfolio IDs, names, and account types.',
    { type: 'object', properties: {} },
    async () => {
      try {
        const userId = getUserId();
        const portfolios = listPortfolios(userId);
        return textResult(JSON.stringify(portfolios, null, 2));
      } catch (error) {
        return handleServiceError(error, 'list_portfolios');
      }
    }
  );
}

/**
 * Format an enriched portfolio into a readable text summary + JSON data.
 */
function formatPortfolioSummary(enriched: {
  portfolio: { name: string; account_type: string; base_currency: string };
  holdings: Array<{
    ticker: string; name: string; shares: number; avg_cost: number;
    current_price: number; market_value: number; gain_loss: number; gain_loss_percent: number;
  }>;
  total_value: number; total_cost: number;
  total_gain_loss: number; total_gain_loss_percent: number;
  day_change: number; day_change_percent: number;
}): string {
  const p = enriched.portfolio;
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lines: string[] = [
    `# ${p.name}`,
    `Account: ${p.account_type} | Currency: ${p.base_currency}`,
    '',
    `## Portfolio Totals`,
    `- Total Value: $${fmt(enriched.total_value)}`,
    `- Total Cost: $${fmt(enriched.total_cost)}`,
    `- Total Gain/Loss: $${fmt(enriched.total_gain_loss)} (${enriched.total_gain_loss_percent.toFixed(2)}%)`,
    `- Day Change: $${fmt(enriched.day_change)} (${enriched.day_change_percent.toFixed(2)}%)`,
    '',
    `## Holdings (${enriched.holdings.length})`,
    '',
  ];

  for (const h of enriched.holdings) {
    const sign = h.gain_loss >= 0 ? '+' : '';
    lines.push(
      `**${h.ticker}** - ${h.name}`,
      `  ${h.shares} shares @ $${h.avg_cost.toFixed(2)} avg | Current: $${h.current_price.toFixed(2)} | Value: $${h.market_value.toFixed(2)} | P&L: ${sign}$${h.gain_loss.toFixed(2)} (${sign}${h.gain_loss_percent.toFixed(2)}%)`,
      ''
    );
  }

  lines.push('', '## Raw Data', '```json', JSON.stringify(enriched, null, 2), '```');
  return lines.join('\n');
}
