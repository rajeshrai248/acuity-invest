// ============================================================
// Acuity Invest — Express App Configuration
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import portfolioRoutes from './routes/portfolio.routes';
import marketRoutes from './routes/market.routes';
import subscriptionRoutes from './routes/subscription.routes';
import insightsRoutes from './routes/insights.routes';

const app = express();

// ============================================================
// Security Middleware
// ============================================================

// Helmet — set various HTTP security headers
app.use(helmet());

// CORS — allow requests from the frontend origin
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// General rate limiter — 100 requests per 15 minutes per IP
app.use(generalRateLimiter);

// ============================================================
// Body Parsing
// ============================================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Health Check
// ============================================================

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================
// API Routes
// ============================================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/insights', insightsRoutes);

// ============================================================
// Error Handling
// ============================================================

// 404 — catch unmatched routes
app.use(notFoundHandler);

// Global error handler — MUST be last
app.use(errorHandler);

export default app;
