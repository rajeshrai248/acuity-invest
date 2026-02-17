// ============================================================
// Acuity Invest MCP Server — Configuration
// ============================================================

import dotenv from 'dotenv';
import path from 'path';

// Load the backend's .env file BEFORE any backend imports
// (backend config reads process.env at import time)
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

export interface McpConfig {
  mcpPort: number;
  nodeEnv: string;
  isDev: boolean;
}

export function loadMcpConfig(): McpConfig {
  return {
    mcpPort: parseInt(process.env.MCP_PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
  };
}
