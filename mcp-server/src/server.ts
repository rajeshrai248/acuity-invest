// ============================================================
// Acuity Invest MCP Server — Server Factory
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPortfolioResources } from './resources/portfolios';
import { registerMarketTools } from './tools/market';
import { registerPortfolioTools } from './tools/portfolio';
import { registerInsightsTools } from './tools/insights';

/**
 * Create a configured MCP server instance with all resources and tools registered.
 *
 * @param getUserId - Function that returns the authenticated user's ID.
 *                    For stdio transport, this reads from MCP_USER_ID env var.
 *                    For HTTP transport, this is resolved from the API key per session.
 */
export function createMcpServer(getUserId: () => string): McpServer {
  const server = new McpServer(
    {
      name: 'acuity-invest',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        logging: {},
      },
    }
  );

  // Register resources (read-only data access)
  registerPortfolioResources(server, getUserId);

  // Register tools (callable actions)
  registerMarketTools(server);
  registerPortfolioTools(server, getUserId);
  registerInsightsTools(server, getUserId);

  return server;
}
