# Acuity Invest

<<<<<<< HEAD
An AI-powered financial insights platform that delivers intelligent portfolio analysis and market insights through a clean, modern interface.

## Application Overview

Acuity Invest is a subscription-based SaaS platform that combines portfolio management with AI-powered market insights. Users can manage their investment portfolios and receive AI-generated insights powered by Google Gemini, with full observability through Langfuse.

### Key Features

- **AI-Powered Insights** — Generate intelligent market analysis and portfolio recommendations using Google Gemini
- **Portfolio Management** — Create, edit, and track multiple investment portfolios
- **Market Intelligence** — Real-time market data and price tracking
- **Subscription Tiers** — FREE and PREMIUM tier support with rate limiting
- **Secure Authentication** — JWT-based authentication with bcrypt password hashing
- **Rate Limiting** — Protect API endpoints with configurable rate limits
- **Observability** — Langfuse integration for LLM monitoring and response scoring
- **Responsive Design** — Mobile-first UI built with React and Tailwind CSS

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for HTTP requests
- **React Markdown** with Mermaid support for AI-generated content
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQLite** (better-sqlite3) for data persistence
- **Google Generative AI (Gemini)** for AI insights
- **JWT** for authentication
- **Langfuse** for LLM observability
- **Zod** for request validation
- **bcryptjs** for password hashing

## Project Structure

```
acuity-invest/
├── frontend/           # React SPA client application
├── backend/            # Express.js API server
├── docs/               # Architecture and design documentation
├── tests/              # Test suites (unit, integration, e2e, security)
└── README.md           # This file
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd acuity-invest
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure environment variables
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Environment Configuration

Both frontend and backend require environment variables. See the respective `.env.example` files for required settings.

### Critical Environment Variables
- `GEMINI_API_KEY` — Google Gemini API key (required for AI insights)
- `JWT_SECRET` — JWT signing secret (must be changed in production)
- `DATABASE_PATH` — SQLite database file location (backend)
- `LANGFUSE_SECRET_KEY` / `LANGFUSE_PUBLIC_KEY` — Langfuse API keys (optional but recommended)

## Documentation

- [Frontend Documentation](./frontend/README.md) — UI components, hooks, and development guide
- [Backend Documentation](./backend/README.md) — API endpoints, services, and database schema
- [Architecture Document](./docs/architecture.md) — System design, data models, and deployment architecture
- [UX Design Specification](./docs/ux-design.md) — Design system, color palette, and interaction patterns

## Features by Tier

### FREE Tier
- Basic portfolio management
- 5 AI insights per day
- Standard rate limiting
- Read-only market data

### PREMIUM Tier
- Unlimited AI insights
- Advanced portfolio analytics
- Priority API access
- Full market data access

## Security Features

- JWT-based authentication
- bcrypt password hashing (salt rounds: 10)
- CORS configuration for frontend access
- Rate limiting on all API endpoints
- Input validation using Zod schemas
- Helmet.js for HTTP security headers
- Protected sensitive routes with subscription middleware

## Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/unit/
npm test -- tests/integration/
npm test -- tests/e2e/
npm test -- tests/security/
```

## Deployment

See [Architecture Document](./docs/architecture.md#8-deployment-architecture) for deployment strategies and infrastructure setup.

## Support & Contributing

For issues, questions, or contributions, please refer to the documentation in the `docs/` folder.

## License

ISC
=======
Welcome to Acuity Invest!
This project contains both frontend and backend code.

## Project Structure
- [frontend/](./frontend) — Client-side application
- [backend/](./backend) — Server-side API
- [docs/](./docs) — Architecture and UX design

## Application Overview
Acuity Invest is a financial insights platform providing:
- AI-powered market insights
- Portfolio management tools
- Subscription-based access
- Secure authentication and rate limiting
- Observability and scoring via Langfuse

## Documentation
- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [Architecture](./docs/architecture.md)
- [UX Design](./docs/ux-design.md)
>>>>>>> c68661a9d582f3c944e0045bf72774e27609c3f0
