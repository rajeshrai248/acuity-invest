<<<<<<< HEAD
# Frontend — Acuity Invest

A modern React SPA providing an intuitive interface for portfolio management and AI-powered financial insights.

## Overview

The frontend is built with React 19, TypeScript, and Tailwind CSS, delivering a responsive and accessible user experience. It features a clean dashboard-first design aligned with ING's design principles: clarity, simplicity, and forward-looking aesthetics.

## Tech Stack

- **React 19** — Modern UI library with hooks
- **TypeScript** — Type-safe development
- **Vite** — Next-generation build tool with instant HMR
- **Tailwind CSS 4** — Utility-first CSS framework
- **React Router v7** — Client-side routing
- **Axios** — HTTP client for API communication
- **React Markdown** — Render markdown AI insights with GitHub Flavored Markdown (GFM)
- **Mermaid** — Diagram rendering for financial visualizations
- **Lucide React** — Icon library
- **ESLint** — Code linting and quality

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components (buttons, modals, etc.)
│   ├── dashboard/       # Dashboard layout and hero components
│   ├── insights/        # AI insights display components
│   ├── layout/          # App layout, navigation, sidebar
│   ├── portfolio/       # Portfolio editor and viewer components
│   └── subscription/    # Subscription tier display and upgrade
├── data/
│   └── mockData.ts      # Mock data for development
├── hooks/
│   ├── useAuth.ts       # Authentication state management
│   ├── useInsights.ts   # AI insights fetching and caching
│   ├── useMarketMovers.ts # Market data fetching
│   ├── usePortfolio.ts  # Portfolio CRUD operations
├── pages/
│   ├── DashboardPage.tsx      # Home/dashboard view
│   ├── InsightsPage.tsx       # Detailed insights view
│   ├── LoginPage.tsx          # Authentication
│   ├── PortfolioPage.tsx      # Portfolio management
│   └── SubscriptionPage.tsx   # Tier management
├── services/
│   └── api.ts           # Axios instance and API helper methods
├── types/
│   └── index.ts         # TypeScript interfaces and types
├── App.tsx              # Main app component with routing
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## Features

### Authentication
- Login with email/password
- JWT token management
- Automatic token refresh
- Protected routes

### Dashboard
- Portfolio overview
- Performance metrics
- Market movers display
- Quick insight generation
- Subscription tier badge

### Portfolio Management
- Create multiple portfolios
- Add/edit/delete holdings
- Real-time value calculations
- Performance tracking
- Export capabilities

### AI Insights
- Generate insights with one click
- AI-powered market analysis
- Markdown-formatted responses
- Mermaid chart support
- Insight history

### Market Data
- Real-time price updates
- Market movers (gainers/losers)
- Historical price trends
- Cache optimization

### Subscription Management
- Tier display (FREE/PREMIUM)
- Upgrade workflow
- Usage statistics
- Limits display

## Color Palette

### Brand Colors
- **Primary Orange** — `#FF6200` (CTAs, active states)
- **Positive Green** — `#00875A` (gains, uptrends)
- **Negative Red** — `#DE350B` (losses, downtrends)
- **Neutral Gray** — `#6B778C` (unchanged values)

See [UX Design](../docs/ux-design.md#12-color-palette) for complete palette and usage guidelines.

## Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
=======
# Frontend

This folder contains the client-side code for Acuity Invest.

## Setup
>>>>>>> c68661a9d582f3c944e0045bf72774e27609c3f0

```bash
cd frontend
npm install
<<<<<<< HEAD
```

### Development Server

```bash
npm run dev
```

Server runs at http://localhost:5173 with hot module reloading (HMR).

### Building for Production

```bash
npm run build
```

Outputs optimized build to `dist/`.

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## API Integration

All API calls go through the centralized `src/services/api.ts` service.

### Key Endpoints
- `POST /auth/register` — Create account
- `POST /auth/login` — Authenticate user
- `GET /portfolio` — Fetch user portfolios
- `POST /portfolio` — Create portfolio
- `PATCH /portfolio/:id` — Update portfolio
- `POST /insights` — Generate AI insight
- `GET /market/movers` — Get market data

See [Backend Documentation](../backend/README.md#api-endpoints) for full API reference.

## Custom Hooks

### useAuth
Manages authentication state and JWT token handling.

```typescript
const { user, token, login, logout, register } = useAuth();
```

### usePortfolio
Handles portfolio CRUD operations.

```typescript
const { portfolios, loading, add, update, delete } = usePortfolio();
```

### useInsights
Fetches and manages AI insights.

```typescript
const { insights, loading, generateInsight } = useInsights();
```

### useMarketMovers
Fetches market data and price updates.

```typescript
const { movers, loading } = useMarketMovers();
```

## Responsive Design

Tailwind CSS breakpoints:
- `sm` — 640px (tablets)
- `md` — 768px (small laptops)
- `lg` — 1024px (laptops)
- `xl` — 1280px (desktops)

All components are tested for responsiveness across device sizes.

## Accessibility (a11y)

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Focus management

See [UX Design](../docs/ux-design.md#6-accessibility-a11y-requirements) for detailed a11y specifications.

## Performance Optimization

- Code splitting with React.lazy
- Image optimization
- API response caching
- Debounced search inputs
- Lazy-loaded routes

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

Test files are located in `tests/frontend/`.

## Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 5174
```

### Environment Variables
Create a `.env.local` file in the frontend root:
```
VITE_API_URL=http://localhost:3001
```

### CORS Errors
Ensure the backend is running and CORS is configured correctly. Check [Backend Setup](../backend/README.md#cors-configuration).

## Documentation

- [Project Root README](../README.md) — Overall application overview
- [UX Design Specification](../docs/ux-design.md) — Design system and component specs
- [Architecture Document](../docs/architecture.md) — System design and data flow
- [Backend Documentation](../backend/README.md) — API reference
=======
npm run dev
```

## Features
- Modern dashboard UI
- Insights, portfolio, subscription management
- Responsive design
- API integration with backend

## Documentation
- [Project Root README](../README.md)
- [Architecture](../docs/architecture.md)
- [UX Design](../docs/ux-design.md)
>>>>>>> c68661a9d582f3c944e0045bf72774e27609c3f0
