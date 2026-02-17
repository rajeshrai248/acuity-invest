// ============================================================
// Acuity Invest MCP Server — Market Data Tools
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getQuote,
  getBatchQuotes,
  getMarketMovers,
  listExchanges,
  ExchangeKey,
} from '../../../backend/src/services/market.service';
import { handleServiceError } from '../errors';

function textResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Register all market data tools.
 */
export function registerMarketTools(server: McpServer): void {
  // Tool: Get a single stock quote
  (server as any).tool(
    'get_stock_quote',
    'Get a real-time stock quote with price, change, volume, and market cap. Input: { ticker: string }',
    {
      type: 'object',
      properties: {
        ticker: { type: 'string', description: 'Stock ticker symbol (e.g., AAPL, MSFT, NVDA)' },
      },
      required: ['ticker'],
    },
    async (args: { ticker: string }) => {
      try {
        const quote = await getQuote(args.ticker.toUpperCase().trim());
        return textResult(quote);
      } catch (error) {
        return handleServiceError(error, 'get_stock_quote');
      }
    }
  );

  // Tool: Get batch quotes for multiple tickers
  (server as any).tool(
    'get_batch_quotes',
    'Get real-time quotes for multiple stock tickers at once (max 20). Input: { tickers: string[] }',
    {
      type: 'object',
      properties: {
        tickers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of stock ticker symbols (max 20)',
        },
      },
      required: ['tickers'],
    },
    async (args: { tickers: string[] }) => {
      try {
        const limited = args.tickers.slice(0, 20).map((t) => t.toUpperCase().trim());
        const quotesMap = await getBatchQuotes(limited);
        const quotes = Array.from(quotesMap.values());
        return textResult(quotes);
      } catch (error) {
        return handleServiceError(error, 'get_batch_quotes');
      }
    }
  );

  // Tool: Get market movers (gainers, losers, most active)
  (server as any).tool(
    'get_market_movers',
    'Get top gainers, losers, and most active stocks for a given exchange. Exchanges: US, BRUSSELS, AMSTERDAM, BERLIN (default: US)',
    {
      type: 'object',
      properties: {
        exchange: {
          type: 'string',
          description: 'Stock exchange: US, BRUSSELS, AMSTERDAM, or BERLIN (default: US)',
        },
      },
    },
    async (args: { exchange?: string }) => {
      try {
        const validExchanges = ['US', 'BRUSSELS', 'AMSTERDAM', 'BERLIN'];
        const ex = (validExchanges.includes(args.exchange || '') ? args.exchange : 'US') as ExchangeKey;
        const movers = await getMarketMovers(ex);
        return textResult(movers);
      } catch (error) {
        return handleServiceError(error, 'get_market_movers');
      }
    }
  );

  // Tool: List available exchanges
  (server as any).tool(
    'list_exchanges',
    'List all available stock exchanges supported by Acuity Invest',
    { type: 'object', properties: {} },
    async () => {
      try {
        const exchanges = listExchanges();
        return textResult(exchanges);
      } catch (error) {
        return handleServiceError(error, 'list_exchanges');
      }
    }
  );
}
