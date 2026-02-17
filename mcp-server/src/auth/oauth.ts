// ============================================================
// Acuity Invest MCP Server — OAuth 2.1 Implementation
// ============================================================
//
// Implements the OAuth 2.1 flow required by the MCP HTTP spec:
//   1. Authorization Server Metadata Discovery
//   2. Dynamic Client Registration (RFC 7591)
//   3. Authorization Code Grant (with PKCE)
//   4. Token Exchange
//
// This is a lightweight, single-user OAuth server designed for
// MCP client compatibility (VS Code, PyCharm, Claude Desktop, etc.)

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { getDatabase } from '../../../backend/src/db/database';
import { findUserById } from '../../../backend/src/models/user.model';
import { McpUser } from './api-key';

// ---- In-memory stores (sufficient for local dev / single-instance) ----

interface OAuthClient {
  client_id: string;
  client_secret?: string;
  client_name?: string;
  redirect_uris: string[];
  created_at: number;
}

interface AuthCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  user_id: string;
  code_challenge?: string;
  code_challenge_method?: string;
  expires_at: number;
}

interface AccessToken {
  token: string;
  client_id: string;
  user_id: string;
  expires_at: number;
}

const clients = new Map<string, OAuthClient>();
const authCodes = new Map<string, AuthCode>();
const accessTokens = new Map<string, AccessToken>();

// Default demo user ID (from seed)
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

// Token lifetime: 24 hours
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// Auth code lifetime: 10 minutes
const CODE_TTL_MS = 10 * 60 * 1000;

// ---- Helpers ----

function generateId(): string {
  return crypto.randomBytes(32).toString('hex');
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

/**
 * Validate an OAuth access token and return the associated user.
 */
export function validateAccessToken(token: string): McpUser | null {
  const entry = accessTokens.get(token);
  if (!entry) {
    console.log(`[OAuth] Token not found in store. Store has ${accessTokens.size} tokens.`);
    // Log first 20 chars of each stored token for debugging
    for (const [key] of accessTokens) {
      console.log(`[OAuth]   stored: ${key.substring(0, 20)}...`);
    }
    return null;
  }

  if (Date.now() > entry.expires_at) {
    accessTokens.delete(token);
    console.log(`[OAuth] Token expired`);
    return null;
  }

  const user = findUserById(entry.user_id);
  if (!user) {
    console.log(`[OAuth] User ${entry.user_id} not found in DB`);
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    tier: user.subscription_tier,
  };
}

/**
 * Get the count of active tokens (for debug logging).
 */
export function getActiveTokenCount(): number {
  return accessTokens.size;
}

// ---- Router ----

export function createOAuthRouter(baseUrl: string): Router {
  const router = Router();

  // 0. Protected Resource Metadata (RFC 9728) — tells clients where the auth server is
  // The `resource` value MUST match the MCP endpoint URL per RFC 9728
  const resourceUrl = `${baseUrl}/mcp`;

  router.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
    res.json({
      resource: resourceUrl,
      authorization_servers: [baseUrl],
      scopes_supported: ['read', 'write'],
      bearer_methods_supported: ['header'],
    });
  });

  // Also serve at /mcp path for clients that append the resource path
  router.get('/.well-known/oauth-protected-resource/mcp', (_req: Request, res: Response) => {
    res.json({
      resource: resourceUrl,
      authorization_servers: [baseUrl],
      scopes_supported: ['read', 'write'],
      bearer_methods_supported: ['header'],
    });
  });

  // 1. OAuth Authorization Server Metadata (RFC 8414)
  router.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      registration_endpoint: `${baseUrl}/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
      code_challenge_methods_supported: ['S256', 'plain'],
      scopes_supported: ['read', 'write'],
    });
  });

  // 2. Dynamic Client Registration (RFC 7591)
  router.post('/register', (req: Request, res: Response) => {
    const { client_name, redirect_uris } = req.body || {};

    const client_id = `mcp_client_${generateId()}`;
    const client_secret = `mcp_secret_${generateId()}`;

    const client: OAuthClient = {
      client_id,
      client_secret,
      client_name: client_name || 'MCP Client',
      redirect_uris: Array.isArray(redirect_uris) ? redirect_uris : [],
      created_at: Date.now(),
    };

    clients.set(client_id, client);

    console.log(`[OAuth] Registered client: ${client_id} (${client.client_name})`);

    res.status(201).json({
      client_id,
      client_secret,
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    });
  });

  // 3. Authorization Endpoint
  router.get('/authorize', (req: Request, res: Response) => {
    const {
      client_id,
      redirect_uri,
      response_type,
      state,
      code_challenge,
      code_challenge_method,
    } = req.query as Record<string, string>;

    // Validate required params
    if (response_type !== 'code') {
      res.status(400).json({ error: 'unsupported_response_type' });
      return;
    }

    if (!client_id) {
      res.status(400).json({ error: 'invalid_request', error_description: 'client_id required' });
      return;
    }

    // Accept any client_id (auto-register if unknown)
    if (!clients.has(client_id)) {
      clients.set(client_id, {
        client_id,
        redirect_uris: redirect_uri ? [redirect_uri] : [],
        created_at: Date.now(),
      });
      console.log(`[OAuth] Auto-registered client: ${client_id}`);
    }

    // Generate authorization code (auto-approve for the demo user)
    const code = generateId();
    const authCode: AuthCode = {
      code,
      client_id,
      redirect_uri: redirect_uri || '',
      user_id: DEMO_USER_ID,
      code_challenge: code_challenge || undefined,
      code_challenge_method: code_challenge_method || undefined,
      expires_at: Date.now() + CODE_TTL_MS,
    };

    authCodes.set(code, authCode);

    console.log(`[OAuth] Authorization code issued for client: ${client_id}`);

    // Redirect back to the client with the auth code
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    res.redirect(302, redirectUrl.toString());
  });

  // 4. Token Endpoint
  router.post('/token', (req: Request, res: Response) => {
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      code_verifier,
    } = req.body;

    if (grant_type !== 'authorization_code') {
      res.status(400).json({ error: 'unsupported_grant_type' });
      return;
    }

    if (!code) {
      res.status(400).json({ error: 'invalid_request', error_description: 'code required' });
      return;
    }

    const authCode = authCodes.get(code);
    if (!authCode) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' });
      return;
    }

    // Delete code (single use)
    authCodes.delete(code);

    // Check expiry
    if (Date.now() > authCode.expires_at) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code expired' });
      return;
    }

    // Validate client_id
    if (client_id && authCode.client_id !== client_id) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'client_id mismatch' });
      return;
    }

    // Validate redirect_uri
    if (redirect_uri && authCode.redirect_uri && redirect_uri !== authCode.redirect_uri) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
      return;
    }

    // Validate PKCE code_verifier if code_challenge was used
    if (authCode.code_challenge) {
      if (!code_verifier) {
        res.status(400).json({ error: 'invalid_grant', error_description: 'code_verifier required' });
        return;
      }

      const method = authCode.code_challenge_method || 'plain';
      const computed = method === 'S256' ? sha256(code_verifier) : code_verifier;

      if (computed !== authCode.code_challenge) {
        res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
        return;
      }
    }

    // Issue access token
    const token = `acuity_token_${generateId()}`;
    accessTokens.set(token, {
      token,
      client_id: authCode.client_id,
      user_id: authCode.user_id,
      expires_at: Date.now() + TOKEN_TTL_MS,
    });

    console.log(`[OAuth] Access token issued for user: ${authCode.user_id}`);

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: TOKEN_TTL_MS / 1000,
      scope: 'read write',
    });
  });

  return router;
}
