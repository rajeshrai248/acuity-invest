# Acuity Invest

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

The application is fully containerized and deployed as a single Docker Compose stack with both frontend and backend services.

### Prerequisites
- Docker and Docker Compose
- Access to required environment variables

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd acuity-invest

# Create .env file with required variables
cp .env.example .env
# Edit .env with your configuration values

# Start the application
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost
# - Backend API: http://localhost/api
```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=production

# Database
DATABASE_PATH=./data/acuity.db

# Authentication
JWT_SECRET=your-secure-random-secret-key

# AI/ML
GEMINI_API_KEY=your-google-gemini-api-key

# Observability (Optional)
LANGFUSE_SECRET_KEY=your-langfuse-secret-key
LANGFUSE_PUBLIC_KEY=your-langfuse-public-key

# Frontend Configuration
VITE_API_BASE_URL=http://localhost/api
```

### Docker Compose Management

```bash
# Start services in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images (after code changes)
docker-compose up -d --build

# Remove data and restart clean
docker-compose down -v
docker-compose up -d
```

### Database Initialization

The database is automatically initialized on first run. To seed with sample data:

```bash
# Access the backend container
docker-compose exec backend npm run db:seed
```

### Production Deployment Checklist

1. **Environment Variables** — Secure all sensitive variables (use secrets management, not version control)
2. **JWT Secret** — Generate a strong, random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **SSL/TLS** — Use a reverse proxy (nginx, Traefik) for HTTPS
4. **Rate Limiting** — Adjust rate limit configuration for your traffic
5. **Database Backups** — Implement regular backups of the SQLite database
6. **Monitoring & Logging** — Set up log aggregation and error tracking
7. **Docker Registry** — Push images to a private docker registry for production

### Verification

```bash
# Check if containers are running
docker-compose ps

# Test backend API
curl http://localhost/api/health

# Access frontend
open http://localhost
```

For detailed architecture information, see [Architecture Document](./docs/architecture.md).

## Support & Contributing

For issues, questions, or contributions, please refer to the documentation in the `docs/` folder.

## License

ISC
