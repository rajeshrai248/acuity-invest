// ============================================================
// Acuity Invest MCP Server — Streamable HTTP Entry Point
// ============================================================
//
// Usage: node dist/index.js
// Endpoint: http://localhost:3002/mcp
// Auth: OAuth 2.1 (Dynamic Client Registration) or Bearer API key

// Load env vars BEFORE importing backend modules
import { loadMcpConfig } from './config';
const mcpConfig = loadMcpConfig();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { initializeDatabase, closeDatabase } from '../../backend/src/db/database';
import { createMcpServer } from './server';
import { validateApiKey, McpUser } from './auth/api-key';
import { createOAuthRouter, validateAccessToken, getActiveTokenCount } from './auth/oauth';

// Initialize the shared database
initializeDatabase();

const PORT = mcpConfig.mcpPort;
const BASE_URL = process.env.MCP_BASE_URL || `http://localhost:${PORT}`;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount OAuth 2.1 endpoints (metadata, registration, authorize, token)
app.use(createOAuthRouter(BASE_URL));

// Session management: maps session IDs to transports and users
const sessions = new Map<
  string,
  {
    transport: StreamableHTTPServerTransport;
    user: McpUser;
  }
>();

/**
 * Authenticate a request using an OAuth access token or API key.
 * Tries OAuth token first, then falls back to API key validation.
 */
function authenticate(req: Request, res: Response): McpUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No Bearer token in request');
    res
      .status(401)
      .set('WWW-Authenticate', `Bearer resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"`)
      .json({ error: 'Authorization header with Bearer token required' });
    return null;
  }

  const token = authHeader.substring(7).trim();
  console.log(`[Auth] Token received: ${token.substring(0, 20)}...`);

  // Try OAuth access token first
  const oauthUser = validateAccessToken(token);
  if (oauthUser) {
    console.log(`[Auth] OAuth token valid for user: ${oauthUser.userId}`);
    return oauthUser;
  }

  // Fall back to legacy API key
  const apiKeyUser = validateApiKey(token);
  if (apiKeyUser) {
    console.log(`[Auth] API key valid for user: ${apiKeyUser.userId}`);
    return apiKeyUser;
  }

  console.log(`[Auth] Token/key rejected. Active OAuth tokens: ${getActiveTokenCount()}`);
  res
    .status(401)
    .set('WWW-Authenticate', `Bearer resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"`)
    .json({ error: 'Invalid token or API key' });
  return null;
}

// ---- MCP Endpoint (POST) ----
app.post('/mcp', async (req: Request, res: Response) => {
  const user = authenticate(req, res);
  if (!user) return;

  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const body = req.body;

  console.log(`[MCP POST] sessionId=${sessionId || '(none)'}, isInit=${isInitializeRequest(body)}, method=${body?.method || body?.[0]?.method || '(unknown)'}`);

  // If there's an existing session, reuse it
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    if (session.user.userId !== user.userId) {
      res
        .status(403)
        .json({ error: 'Session does not belong to this user' });
      return;
    }
    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  // If the client sends a stale/unknown session ID with a non-initialize request,
  // tell it the session is gone so it can re-initialize
  if (sessionId && !sessions.has(sessionId) && !isInitializeRequest(body)) {
    console.log(`[MCP POST] Unknown session ${sessionId}, telling client to re-initialize`);
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Session not found. Please re-initialize.' },
      id: body?.id || null,
    });
    return;
  }

  // New session: create if it's an initialize request
  if (isInitializeRequest(body)) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    const server = createMcpServer(() => user.userId);
    await server.connect(transport);

    // handleRequest processes the initialize and sets the session ID
    await transport.handleRequest(req, res, req.body);

    // Read sessionId AFTER handleRequest — it's only set during request handling
    const newSessionId = transport.sessionId;
    if (newSessionId) {
      sessions.set(newSessionId, { transport, user });
      console.log(`[MCP POST] New session created: ${newSessionId}`);
    } else {
      console.log(`[MCP POST] WARNING: session ID still undefined after handleRequest`);
    }
    return;
  }

  console.log(`[MCP POST] Rejected: no session, not initialize. Body: ${JSON.stringify(body).substring(0, 200)}`);
  res.status(400).json({
    error:
      'Bad request: send an initialize request to start a new session',
  });
});

// ---- MCP Endpoint (GET) — SSE stream for server notifications ----
app.get('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }
  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
});

// ---- MCP Endpoint (DELETE) — session termination ----
app.delete('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }
  const session = sessions.get(sessionId)!;
  await session.transport.handleRequest(req, res);
  sessions.delete(sessionId);
});

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    activeSessions: sessions.size,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const httpServer = app.listen(PORT, () => {
  console.log('');
  console.log('==============================================');
  console.log('  Acuity Invest MCP Server');
  console.log('==============================================');
  console.log(`  Port        : ${PORT}`);
  console.log(`  Transport   : Streamable HTTP`);
  console.log(`  Endpoint    : ${BASE_URL}/mcp`);
  console.log(`  OAuth Meta  : ${BASE_URL}/.well-known/oauth-authorization-server`);
  console.log(`  Health      : ${BASE_URL}/health`);
  console.log('==============================================');
  console.log('');
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down MCP server...`);
  httpServer.close(() => {
    closeDatabase();
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
