// ============================================================
// Acuity Invest MCP Server — Error Handling Utilities
// ============================================================

import { AppError } from '../../backend/src/middleware/errorHandler.middleware';

/**
 * Convert a service-layer error into an MCP tool error response.
 * MCP tools return { content, isError } — we format errors as JSON text.
 */
export function handleServiceError(error: unknown, toolName: string) {
  if (error instanceof AppError) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: true,
            message: error.message,
            code: error.statusCode,
          }),
        },
      ],
      isError: true,
    };
  }

  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[MCP] Error in tool ${toolName}:`, err.message);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          error: true,
          message: err.message || 'An unexpected error occurred',
        }),
      },
    ],
    isError: true,
  };
}
