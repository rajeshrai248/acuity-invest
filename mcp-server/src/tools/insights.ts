// ============================================================
// Acuity Invest MCP Server — AI Insights Tools
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateInsights } from '../../../backend/src/services/ai.service';
import { getSubscription } from '../../../backend/src/services/subscription.service';
import { findUserById } from '../../../backend/src/models/user.model';
import { handleServiceError } from '../errors';

function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

/**
 * Register AI insights and subscription tools.
 */
export function registerInsightsTools(
  server: McpServer,
  getUserId: () => string
): void {
  // Tool: Generate AI-powered portfolio insights
  (server as any).tool(
    'generate_ai_insights',
    'Generate AI-powered portfolio analysis using Google Gemini. Analyzes holdings with live market data. Examples: "How is my portfolio performing?", "What sectors am I overweight in?", "Analyze my risk exposure".',
    {
      type: 'object',
      properties: {
        portfolio_id: {
          type: 'string',
          description: 'Portfolio ID to analyze',
        },
        query: {
          type: 'string',
          description: 'Your analysis question or request (max 500 chars)',
        },
      },
      required: ['portfolio_id', 'query'],
    },
    async (args: { portfolio_id: string; query: string }) => {
      try {
        const userId = getUserId();
        const user = findUserById(userId);
        const tier = user?.subscription_tier || 'FREE';
        const query = args.query.slice(0, 500);
        const result = await generateInsights(userId, args.portfolio_id, query, tier);
        return textResult(result.insights || result.response);
      } catch (error) {
        return handleServiceError(error, 'generate_ai_insights');
      }
    }
  );

  // Tool: Get subscription info
  (server as any).tool(
    'get_subscription_info',
    "Get the current user's subscription tier, features, and usage limits",
    { type: 'object', properties: {} },
    async () => {
      try {
        const userId = getUserId();
        const subscription = getSubscription(userId);
        return textResult(JSON.stringify(subscription, null, 2));
      } catch (error) {
        return handleServiceError(error, 'get_subscription_info');
      }
    }
  );
}
