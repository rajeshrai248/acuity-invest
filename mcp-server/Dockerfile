# ============================================================
# Acuity Invest — MCP Server Dockerfile (multi-stage)
# ============================================================
# Build context must be the project root (not mcp-server/)
# because we need access to backend/src/ for shared imports.

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Install build tools required by native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install backend dependencies (needed for shared source compilation)
COPY backend/package.json backend/package-lock.json* backend/
RUN cd backend && npm ci

# Copy backend source
COPY backend/tsconfig.json backend/
COPY backend/src/ backend/src/

# Build backend
RUN cd backend && npm run build

# Install MCP server dependencies
COPY mcp-server/package.json mcp-server/package-lock.json* mcp-server/
RUN cd mcp-server && npm ci

# Copy MCP server source
COPY mcp-server/tsconfig.json mcp-server/
COPY mcp-server/src/ mcp-server/src/

# Build MCP server
RUN cd mcp-server && npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

# Install build tools required by native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install production deps for both packages
COPY backend/package.json backend/package-lock.json* backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

COPY mcp-server/package.json mcp-server/package-lock.json* mcp-server/
RUN cd mcp-server && npm ci --omit=dev && npm cache clean --force

# Remove build tools after native modules are compiled
RUN apk del python3 make g++

# Copy compiled output from builder
COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/mcp-server/dist mcp-server/dist

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

USER appuser

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "mcp-server/dist/mcp-server/src/index.js"]
