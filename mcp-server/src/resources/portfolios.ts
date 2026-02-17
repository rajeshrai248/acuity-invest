// ============================================================
// Acuity Invest MCP Server — Portfolio Resources
// ============================================================

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as PortfolioModel from '../../../backend/src/models/portfolio.model';
import { enrichPortfolio } from '../../../backend/src/services/portfolio.service';

/**
 * Register all portfolio-related MCP resources.
 */
export function registerPortfolioResources(
  server: McpServer,
  getUserId: () => string
): void {
  // Resource 1: List all portfolios for the authenticated user
  server.resource(
    'user-portfolios',
    'portfolio://user/portfolios',
    {
      description: 'List of all portfolios for the authenticated user',
      mimeType: 'application/json',
    },
    async (uri) => {
      const userId = getUserId();
      const portfolios = PortfolioModel.findPortfoliosByUserId(userId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(portfolios, null, 2),
          },
        ],
      };
    }
  );

  // Resource 2: Single portfolio with holdings (dynamic URI)
  server.resource(
    'portfolio-details',
    new ResourceTemplate('portfolio://{portfolioId}/details', {
      list: async () => {
        const userId = getUserId();
        const portfolios = PortfolioModel.findPortfoliosByUserId(userId);
        return {
          resources: portfolios.map((p) => ({
            uri: `portfolio://${p.id}/details`,
            name: `${p.name} (${p.account_type})`,
            description: `Portfolio: ${p.name}, Currency: ${p.base_currency}`,
            mimeType: 'application/json' as const,
          })),
        };
      },
    }),
    {
      description: 'A portfolio with all its holdings',
      mimeType: 'application/json',
    },
    async (uri, { portfolioId }) => {
      const userId = getUserId();
      const portfolio = PortfolioModel.findPortfolioWithHoldings(
        portfolioId as string,
        userId
      );
      if (!portfolio) {
        throw new Error(`Portfolio ${portfolioId} not found`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(portfolio, null, 2),
          },
        ],
      };
    }
  );

  // Resource 3: Enriched portfolio with live market data + P&L
  server.resource(
    'portfolio-enriched',
    new ResourceTemplate('portfolio://{portfolioId}/enriched', {
      list: async () => {
        const userId = getUserId();
        const portfolios = PortfolioModel.findPortfoliosByUserId(userId);
        return {
          resources: portfolios.map((p) => ({
            uri: `portfolio://${p.id}/enriched`,
            name: `${p.name} (Live Data)`,
            description: `Live market data and P&L for: ${p.name}`,
            mimeType: 'application/json' as const,
          })),
        };
      },
    }),
    {
      description:
        'Portfolio enriched with live market data, P&L calculations, and daily changes',
      mimeType: 'application/json',
    },
    async (uri, { portfolioId }) => {
      const userId = getUserId();
      const enriched = await enrichPortfolio(portfolioId as string, userId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(enriched, null, 2),
          },
        ],
      };
    }
  );
}
