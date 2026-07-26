# SentinelX - AI-Powered Security Operations Center Platform

A modern, full-featured SOC (Security Operations Center) platform for real-time threat detection, incident response, asset management, and security analytics.

## Features

- **Incident Management** — Track, triage, and resolve security incidents with severity levels, assignments, and status workflows
- **Asset Management** — Monitor and manage infrastructure assets with criticality ratings and detailed inventory
- **Security Analytics** — Deep analytics with trend analysis, severity/status distribution charts, and asset breakdowns
- **Reporting** — Generate detailed security reports with CSV/PDF export and executive summaries
- **Team Management** — Role-based access control (Admin, Analyst, Viewer) with team member management
- **Audit Logging** — Comprehensive audit trail of all system activities with search and filtering
- **Notification System** — Real-time notifications for incidents, alerts, and system events
- **Settings** — Customizable organization settings, security policies, appearance, and notification preferences
- **Dashboard** — Real-time SOC dashboard with key metrics, system health monitoring, and recent activity
- **Authentication** — Secure JWT-based authentication with registration and login
- **API Documentation** — Interactive Swagger/OpenAPI documentation at `/api/docs`

## Architecture

```
                     ┌─────────────┐
                     │   Browser   │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │   Nginx     │
                     │  (Reverse   │
                     │   Proxy)    │
                     └──────┬──────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
       ┌──────▼──────┐           ┌────────▼────────┐
       │   Backend   │           │   Frontend      │
       │  Express +  │           │  React + Vite   │
       │  TypeScript │           │  + Tailwind CSS │
       └──────┬──────┘           └─────────────────┘
              │
       ┌──────▼──────┐
       │  PostgreSQL │
       │   (Prisma)  │
       └──────┬──────┘
              │
       ┌──────▼──────┐
       │    Redis    │
       │  (Cache)    │
       └─────────────┘
```

## Tech Stack

### Frontend
- **React 18** — UI library with TypeScript
- **Vite 5** — Build tool and dev server
- **Tailwind CSS 3** — Utility-first CSS framework
- **Shadcn UI** — Accessible UI components (Radix primitives)
- **TanStack Query 5** — Server state management
- **Zustand 5** — Client state management
- **React Router 6** — Client-side routing with lazy loading
- **Framer Motion 11** — Animation library
- **Recharts** — Charting and data visualization
- **Socket.IO Client** — Real-time communication

### Backend
- **Node.js 20** — Runtime environment
- **Express 4** — Web framework
- **TypeScript 5** — Type safety
- **Prisma 5** — ORM with PostgreSQL
- **PostgreSQL 16** — Database
- **Redis 7** — Caching layer (optional)
- **JWT** — Authentication (jsonwebtoken)
- **Zod** — Schema validation
- **Helmet** — Security headers
- **CORS** — Cross-origin resource sharing
- **express-rate-limit** — Rate limiting
- **Socket.IO** — Real-time events

### DevOps
- **Docker** — Containerized deployment
- **Docker Compose** — Multi-container orchestration
- **Nginx** — Reverse proxy for frontend
- **Multi-stage builds** — Optimized image sizes

## Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (optional, for containerized setup)
- Redis 7+ (optional, for caching)

### Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

#### Backend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `5000` | No |
| `API_VERSION` | API version | `1.0.0` | No |
| `DATABASE_URL` | PostgreSQL connection string | — | **Yes** |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — | **Yes** |
| `JWT_EXPIRES_IN` | Token expiration | `7d` | No |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15 min) | No |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | No |
| `REDIS_URL` | Redis connection string (for caching) | — | No |
| `CLOUDINARY_URL` | Cloudinary URL for image uploads | — | No |
| `UPLOAD_DIR` | Local upload directory | `uploads` | No |
| `SENTRY_DSN` | Sentry error tracking DSN | — | No |

#### Frontend Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | — |

### Running Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate -w backend

# Push database schema
npm run db:push -w backend

# Seed database (optional)
npm run db:seed -w backend

# Start development servers
npm run dev
```

The backend will start at `http://localhost:5000` and the frontend at `http://localhost:5173`.

### Using Redis Caching (Optional)

Set the `REDIS_URL` environment variable to enable Redis caching:

```bash
REDIS_URL=redis://localhost:6379
```

When Redis is not configured, the application falls back gracefully without caching. Cached data includes:
- Dashboard statistics (30s TTL)
- Analytics overview, incidents, assets, trends (60-120s TTL)
- Reports data (120s TTL)
- Asset statistics (30s TTL)

Cache is automatically invalidated when underlying data changes (incident/asset CRUD operations).

## Docker Setup

### Build and Run

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Remove volumes (resets database)
docker compose down -v
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 16 database |
| `redis` | 6379 | Redis 7 cache (optional) |
| `backend` | 5000 | Express API server |
| `frontend` | 80 | Nginx-served React app |

### Production Build

```bash
# Build all services
npm run build

# Or build individually
npm run build -w backend
npm run build -w frontend
```

## Performance Optimizations

- **Redis Caching** — Reduces database load for dashboard, analytics, and reports
- **Efficient Prisma Queries** — Parallelized count/find queries with selective includes
- **Pagination** — All list endpoints support pagination with configurable page/limit
- **Sort Field Validation** — Sort fields are whitelisted to prevent errors
- **Selective Includes** — Only requested relations are loaded
- **Connection Pooling** — Prisma handles connection pooling automatically

## Security

- **Helmet** — Comprehensive security headers (HSTS, XSS, nosniff, frameguard, referrer policy)
- **CORS** — Strict origin checking with credentials support
- **Rate Limiting** — 100 requests per 15-minute window (configurable)
- **Request Size Limits** — 10KB JSON body limit, 10KB URL-encoded limit
- **Input Validation** — Zod schemas on all API endpoints
- **JWT Authentication** — Bearer token with 7-day expiration (configurable)
- **Role-Based Access Control** — Admin, Analyst, Viewer roles with granular permissions
- **Password Hashing** — bcrypt with 12 rounds
- **Error Handling** — Structured error responses, no stack traces in production
- **Nginx Security Headers** — X-Frame-Options, X-Content-Type-Options, XSS Protection, Permissions-Policy

## API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

### Endpoints

#### System
- `GET /api/health` — Health check with database status

#### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login with email/password
- `GET /api/auth/profile` — Get current user profile (auth required)

#### Incidents
- `GET /api/incidents` — List incidents (paginated, filterable)
- `POST /api/incidents` — Create incident (Admin/Analyst)
- `GET /api/incidents/stats` — Dashboard statistics
- `GET /api/incidents/:id` — Get incident details
- `PUT /api/incidents/:id` — Update incident (Admin/Analyst)
- `DELETE /api/incidents/:id` — Delete incident (Admin)

#### Assets
- `GET /api/assets` — List assets (paginated, filterable)
- `POST /api/assets` — Create asset (Admin/Analyst)
- `GET /api/assets/stats` — Asset dashboard statistics
- `GET /api/assets/:id` — Get asset details
- `PUT /api/assets/:id` — Update asset (Admin/Analyst)
- `DELETE /api/assets/:id` — Delete asset (Admin)

#### Analytics
- `GET /api/analytics/overview` — Analytics overview
- `GET /api/analytics/incidents` — Incident analytics
- `GET /api/analytics/assets` — Asset analytics
- `GET /api/analytics/trends` — Trend data

#### Reports
- `GET /api/reports/incidents` — Incident report
- `GET /api/reports/assets` — Asset report
- `GET /api/reports/summary` — Executive summary
- `POST /api/reports/export` — Export report data (PDF/CSV)

#### Team
- `GET /api/team` — List team members
- `POST /api/team` — Create team member (Admin)
- `PUT /api/team/:id` — Update team member (Admin)
- `DELETE /api/team/:id` — Delete team member (Admin)

#### Settings
- `GET /api/settings` — Get application settings
- `PUT /api/settings` — Update settings (Admin)
- `POST /api/settings/reset` — Reset settings (Admin)
- `GET /api/settings/system` — System information
- `POST /api/settings/logo` — Upload organization logo

#### Notifications
- `GET /api/notifications` — List notifications
- `POST /api/notifications` — Create notification
- `PUT /api/notifications/read-all` — Mark all as read
- `PUT /api/notifications/:id/read` — Mark notification as read
- `DELETE /api/notifications/:id` — Delete notification

#### Audit
- `GET /api/audit` — List audit logs (paginated, filterable)
- `GET /api/audit/:id` — Get audit log details
- `DELETE /api/audit/:id` — Delete audit log (Admin)
- `DELETE /api/audit` — Clear all audit logs (Admin)

## Project Structure

```
SentinelX/
├── backend/
│   ├── prisma/                    # Database schema, migrations, seed
│   └── src/
│       ├── config/                # Env, database, redis, swagger, sentry
│       ├── middleware/            # Auth, authorization, error handling, validation
│       ├── modules/               # Feature modules (auth, incidents, assets, etc.)
│       │   ├── auth/
│       │   ├── incidents/
│       │   ├── assets/
│       │   ├── analytics/
│       │   ├── reports/
│       │   ├── team/
│       │   ├── settings/
│       │   ├── notifications/
│       │   └── audit/
│       ├── types/                 # TypeScript interfaces
│       ├── utils/                 # JWT, password, PDF, socket, cache utilities
│       ├── app.ts                 # Express application setup
│       └── server.ts              # Server entry point
├── frontend/
│   └── src/
│       ├── components/            # Reusable UI components
│       ├── hooks/                 # Custom React hooks
│       ├── lib/                   # API client (domain-split modules)
│       │   ├── client.ts          # Shared HTTP client
│       │   ├── api.ts             # Backward-compatible re-exports
│       │   ├── auth.ts
│       │   ├── incidents.ts
│       │   ├── assets.ts
│       │   ├── analytics.ts
│       │   ├── reports.ts
│       │   ├── notifications.ts
│       │   ├── audit.ts
│       │   ├── settings.ts
│       │   ├── users.ts
│       │   └── dashboard.ts
│       ├── pages/                 # Route pages (14 pages)
│       ├── providers/             # Theme provider
│       ├── store/                 # Zustand stores
│       └── styles/                # Global CSS with Tailwind
├── docker/
│   ├── Dockerfile.backend         # Backend multi-stage build
│   ├── Dockerfile.frontend        # Frontend multi-stage build
│   ├── entrypoint.sh              # Database migration script
│   └── nginx.conf                 # Nginx configuration
├── docker-compose.yml             # Production Docker Compose
├── package.json                   # Root workspace configuration
└── README.md                      # This file
```

## Deployment

### Production Checklist

- [x] JWT secret with 32+ random characters
- [x] Helmet security headers enabled
- [x] CORS restricted to known origins
- [x] Rate limiting configured
- [x] Input validation (Zod) on all endpoints
- [x] Role-based access control
- [x] Password hashing (bcrypt, 12 rounds)
- [x] Database connection pooling (Prisma)
- [x] Redis caching (optional)
- [x] Graceful shutdown handling
- [x] Health check endpoint
- [x] API documentation (Swagger)
- [x] Docker multi-stage builds
- [x] Docker HEALTHCHECK configured
- [x] Nginx security headers
- [x] Request size limits
- [x] Missing env var validation on startup
- [x] Unhandled promise rejection handling
- [x] Accessible UI (aria labels, roles, semantic HTML)

### Deploy with Docker

```bash
# 1. Set production environment variables
export JWT_SECRET=<your-strong-random-secret>

# 2. Build and start
docker compose up --build -d

# 3. Verify health
curl http://localhost:5000/api/health

# 4. Access application
open http://localhost
```

## License

MIT
