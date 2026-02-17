# ============================================================
# Acuity Invest — Backend Dockerfile (multi-stage)
# ============================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Install build tools required by native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

# Install build tools required by native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Remove build tools after native modules are compiled
RUN apk del python3 make g++

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

# Switch to non-root user
USER appuser

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
