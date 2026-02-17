// ============================================================
// Acuity Invest MCP Server — stdio Entry Point (Claude Desktop)
// ============================================================
//
// Usage: MCP_USER_ID=<user-uuid> node dist/stdio.js
//
// Configure in Claude Desktop's claude_desktop_config.json:
// {
//   "mcpServers": {
//     "acuity-invest": {
//       "command": "node",
//       "args": ["/path/to/mcp-server/dist/stdio.js"],
//       "env": {
//         "MCP_USER_ID": "550e8400-e29b-41d4-a716-446655440001",
//         "DATABASE_PATH": "/path/to/backend/data/acuity.db"
//       }
//     }
//   }
// }

// Load env vars BEFORE importing backend modules
import { loadMcpConfig } from './config';
loadMcpConfig();

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeDatabase, closeDatabase } from '../../backend/src/db/database';
import { createMcpServer } from './server';

const userId = process.env.MCP_USER_ID;
if (!userId) {
  console.error(
    'ERROR: MCP_USER_ID environment variable is required for stdio mode.\n' +
      'Set it to the UUID of the user whose portfolio data you want to access.\n' +
      'Example: MCP_USER_ID=550e8400-e29b-41d4-a716-446655440001'
  );
  process.exit(1);
}

// Initialize the shared database
initializeDatabase();

// Create and connect the MCP server
const server = createMcpServer(() => userId);
const transport = new StdioServerTransport();

server
  .connect(transport)
  .then(() => {
    // Use stderr for logging since stdout is used for MCP protocol
    console.error('[MCP stdio] Acuity Invest MCP server running');
    console.error(`[MCP stdio] User ID: ${userId}`);
  })
  .catch((err) => {
    console.error('[MCP stdio] Failed to start:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
