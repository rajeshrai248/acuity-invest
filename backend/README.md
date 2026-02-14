# Backend — Acuity Invest

A Node.js/Express API server providing authentication, portfolio management, AI-powered insights, and market data endpoints.

## Overview

The backend is built with Express.js and TypeScript, providing a robust RESTful API with middleware for authentication, rate limiting, validation, and error handling. Integration with Google Gemini AI enables intelligent portfolio analysis, while Langfuse provides observability and response scoring.

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express.js** — Web application framework
- **TypeScript** — Type-safe development
- **SQLite (better-sqlite3)** — Lightweight relational database
- **JWT (jsonwebtoken)** — Stateless authentication
- **bcryptjs** — Password hashing
- **Google Generative AI (Gemini)** — LLM for insights generation
- **Langfuse** — LLM observability and evaluation
- **Zod** — Input validation and schema definition
- **Helmet.js** — HTTP security headers
- **CORS** — Cross-origin request handling
- **express-rate-limit** — API rate limiting

## Project Structure

```
src/
├── config/
│   └── index.ts           # Environment configuration and validation
├── controllers/
│   ├── auth.controller.ts         # Login, register endpoints
│   ├── insights.controller.ts     # AI insight generation
│   ├── market.controller.ts       # Market data endpoints
│   ├── portfolio.controller.ts    # Portfolio CRUD operations
│   └── subscription.controller.ts # Subscription management
├── db/
│   ├── database.ts        # SQLite initialization and connection
│   └── seed.ts            # Database seeding for development
├── middleware/
│   ├── auth.middleware.ts           # JWT verification
│   ├── errorHandler.middleware.ts   # Global error handling
│   ├── rateLimiter.middleware.ts    # Rate limiting per endpoint
│   ├── subscription.middleware.ts   # Tier-based access control
│   └── validation.middleware.ts     # Request validation with Zod
├── models/
│   ├── user.model.ts      # User schema and queries
│   ├── portfolio.model.ts  # Portfolio schema and queries
│   └── insight.model.ts    # Insight schema and queries
├── prompts/
│   └── insights.prompt.ts  # AI prompt templates
├── routes/
│   ├── auth.routes.ts           # Authentication routes
│   ├── insights.routes.ts       # Insights endpoints
│   ├── market.routes.ts         # Market data endpoints
│   ├── portfolio.routes.ts      # Portfolio endpoints
│   └── subscription.routes.ts   # Subscription endpoints
├── services/
│   ├── ai.service.ts        # Google Gemini integration
│   ├── auth.service.ts      # Authentication logic
│   ├── langfuse.service.ts  # Langfuse observability
│   ├── market.service.ts    # Market data fetching
│   ├── portfolio.service.ts # Portfolio business logic
│   └── subscription.service.ts # Subscription tier logic
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   ├── formatters.ts        # Data formatting utilities
│   └── validators.ts        # Custom validation functions
├── app.ts                   # Express app setup
└── index.ts                 # Server entry point
```

## Core Features

### Authentication
- Email/password registration and login
- JWT token generation (24h expiration)
- Automatic token validation on protected routes
- bcrypt password hashing (salt rounds: 10)
- Secure token storage recommendations

### Portfolio Management
- Create multiple portfolios per user
- Add/update/delete holdings
- Calculate portfolio performance
- Track cost basis and gains/losses
- Support for multiple asset types

### AI Insights Generation
- Powered by Google Gemini 2.0-Flash
- Rate-limited by subscription tier
  - **FREE:** 5 insights/day
  - **PREMIUM:** Unlimited insights
- Markdown-formatted responses
- Mermaid diagram support
- Langfuse integration for scoring and evaluation

### Market Data
- Real-time price fetching from multiple sources
- Market movers (top gainers/losers)
- Historical price data
- Cache layer (5-minute TTL)
- Fallback data sources for reliability

### Subscription Management
- FREE and PREMIUM tiers
- Tier-based API rate limiting
- Usage tracking and enforcement
- Upgrade/downgrade workflows

### Security
- JWT-based stateless authentication
- Rate limiting on sensitive endpoints
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries)
- CORS configuration for frontend access
- Helmet.js for security headers
- HTTPS recommendation for production

## API Endpoints

### Authentication
```
POST   /auth/register      Register new user
POST   /auth/login         Authenticate user, return JWT
POST   /auth/refresh       Refresh expired token
```

### Portfolio Management
```
GET    /portfolio          List user portfolios
POST   /portfolio          Create new portfolio
GET    /portfolio/:id      Get portfolio details
PATCH  /portfolio/:id      Update portfolio
DELETE /portfolio/:id      Delete portfolio

POST   /portfolio/:id/holdings     Add holding
PATCH  /portfolio/:id/holdings/:hid Update holding
DELETE /portfolio/:id/holdings/:hid Delete holding
```

### AI Insights
```
POST   /insights           Generate insight for portfolio
GET    /insights           List user insights
GET    /insights/:id       Get specific insight
DELETE /insights/:id       Delete insight
```

### Market Data
```
GET    /market/movers      Get market gainers/losers
GET    /market/price/:symbol Get current price
GET    /market/history/:symbol Get historical data
```

### Subscription
```
GET    /subscription/current     Get current tier and usage
POST   /subscription/upgrade     Upgrade to PREMIUM
POST   /subscription/downgrade   Downgrade to FREE
```

## Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API key

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Create a `.env` file in the backend root:

```env
# Server
PORT=3001
NODE_ENV=development

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# JWT
JWT_SECRET=your_secure_random_secret_key

# CORS
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_PATH=./data/acuity.db

# Langfuse (optional)
LANGFUSE_SECRET_KEY=your_langfuse_secret
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_BASEURL=https://cloud.langfuse.com
```

### Running the Server

**Development with auto-reload:**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

Server runs at `http://localhost:3001` by default.

### Database Setup

**Initialize database:**
```bash
npm run seed
```

This creates tables and populates with sample data.

## Configuration Details

### Rate Limiting

Configured per endpoint in routes. Example:

```typescript
// 5 requests per minute for FREE tier
// Unlimited for PREMIUM
const insightsLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: (req) => {
    const tier = req.user?.subscriptionTier || 'free';
    return tier === 'premium' ? Infinity : 5;
  },
});
```

### JWT Configuration

- **Secret:** Must be changed in production (minimum 32 characters recommended)
- **Expiration:** 24 hours
- **Algorithm:** HS256 (HMAC SHA-256)
- **Refresh:** Frontend should request new token before expiration

### Database

Using SQLite with better-sqlite3 for synchronous operations:

```
data/acuity.db
```

Tables:
- `users` — User accounts and authentication
- `portfolios` — User investment portfolios
- `holdings` — Individual stock/security positions
- `insights` — Generated AI insights
- `subscriptions` — User tier and usage tracking

### Error Handling

All errors are caught by the global error handler middleware and return standardized JSON responses:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2026-02-14T10:30:00Z"
}
```

## Testing

```bash
# Run all tests
npm test

# Run specific suite
npm test -- tests/unit/
npm test -- tests/integration/
npm test -- tests/security/
```

Test files in `tests/backend/`.

## Logging & Observability

### Console Logging
Basic logging to console in development mode.

### Langfuse Integration
When configured with API keys, automatic logging of:
- LLM API calls to Google Gemini
- Token usage and costs
- Response quality scoring
- Error tracking

Enable via environment variables in `.env`.

## Deployment

For production deployment, see [Architecture Document](../docs/architecture.md#8-deployment-architecture).

### Pre-deployment Checklist
- [ ] Set secure `JWT_SECRET` (32+ characters)
- [ ] Set valid `GEMINI_API_KEY`
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (not HTTP)
- [ ] Configure `FRONTEND_URL` for CORS
- [ ] Set up database backups
- [ ] Enable Langfuse for monitoring
- [ ] Use environment variable manager (e.g., AWS Secrets Manager)

## Troubleshooting

### GEMINI_API_KEY not set
Ensure your `.env` file contains a valid Google Gemini API key. Get one at https://ai.google.dev/

### Database locked
If you see "database is locked" errors:
1. Ensure only one server instance is running
2. Check file permissions on `data/acuity.db`
3. Restart the server

### CORS errors
Update `FRONTEND_URL` in `.env` to match your frontend domain.

### Rate limit issues
Check user's subscription tier with `GET /subscription/current`.

## Documentation

- [Project Root README](../README.md) — Overall application overview
- [Architecture Document](../docs/architecture.md) — System design and integration
- [UX Design](../docs/ux-design.md) — Frontend design specifications
- [Frontend Documentation](../frontend/README.md) — Client-side code
