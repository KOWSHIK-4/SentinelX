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
- **React Hook Form + Zod** — Form validation
- **Lucide React** — Icon library

### Backend
- **Node.js 20** — Runtime environment
- **Express 4** — Web framework
- **TypeScript 5** — Type safety
- **Prisma 5** — ORM with PostgreSQL
- **PostgreSQL 16** — Database
- **JWT** — Authentication (jsonwebtoken)
- **Zod** — Schema validation
- **Helmet** — Security headers
- **CORS** — Cross-origin resource sharing
- **express-rate-limit** — Rate limiting
- **Morgan** — Request logging
- **Swagger/OpenAPI** — API documentation
- **bcryptjs** — Password hashing (12 rounds)

### DevOps
- **Docker** — Containerized deployment
- **Docker Compose** — Multi-container orchestration
- **Nginx** — Reverse proxy for frontend
- **Multi-stage builds** — Optimized image sizes

## Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Docker (optional)

### Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `API_VERSION` | API version | `1.0.0` |
| `DATABASE_URL` | PostgreSQL connection string | *required* |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | *required* |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

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

## Docker Setup

### Build and Run

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 16 database |
| `backend` | 5000 | Express API server |
| `frontend` | 80 | Nginx-served React app |

### Dockerfiles

- **`docker/Dockerfile.backend`** — Multi-stage build (builder + runner), Node 20-slim, includes Prisma migrations
- **`docker/Dockerfile.frontend`** — Multi-stage build, Node 20-alpine builder + Nginx alpine runner

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
- `POST /api/reports/export` — Export report data

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

## Screenshots

> Screenshots section — add images of the dashboard, incident management, analytics, and other key pages.

## Folder Structure

```
SentinelX/
├── backend/
│   ├── prisma/                    # Database schema and migrations
│   └── src/
│       ├── config/                # Environment, database, swagger config
│       ├── middleware/            # Auth, authorization, error handling, validation
│       ├── modules/
│       │   ├── auth/              # Authentication (register, login, profile)
│       │   ├── incidents/         # Incident CRUD and dashboard stats
│       │   ├── assets/            # Asset management
│       │   ├── analytics/         # Analytics and trends
│       │   ├── reports/           # Report generation and export
│       │   ├── team/              # Team member management
│       │   ├── settings/          # Application settings
│       │   ├── notifications/     # Notification system
│       │   └── audit/             # Audit logging
│       ├── types/                 # TypeScript interfaces
│       ├── utils/                 # JWT and password utilities
│       ├── app.ts                 # Express application setup
│       └── server.ts              # Server entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── auth/              # Protected route wrapper
│       │   ├── incidents/         # Incident form, detail, confirm dialog
│       │   ├── assets/            # Asset form and detail
│       │   ├── landing/           # Landing page sections
│       │   ├── layout/            # App layout, sidebar, header, footer
│       │   ├── theme/             # Theme toggle
│       │   └── ui/                # Shadcn UI primitives
│       ├── hooks/                 # Custom React hooks
│       ├── lib/                   # API client and utilities
│       ├── pages/                 # Route pages (12 pages)
│       ├── providers/             # Theme provider
│       ├── store/                 # Zustand stores (auth, notifications)
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
- [x] Request logging enabled (morgan)
- [x] Input validation (Zod) on all endpoints
- [x] Role-based access control
- [x] Password hashing (bcrypt, 12 rounds)
- [x] Database connection pooling (Prisma)
- [x] Graceful shutdown handling
- [x] Health check endpoint
- [x] API documentation (Swagger)
- [x] Docker multi-stage builds
- [x] Docker HEALTHCHECK configured
- [x] Missing env var validation on startup
- [x] Prisma error handling
- [x] JWT error handling
- [x] Unhandled promise rejection handling
- [x] Page titles and SEO meta tags
- [x] Custom favicon
- [x] Accessible UI (aria labels, roles, semantic HTML)

### Deploy

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

## Future Improvements

- Multi-factor authentication (MFA/TOTP)
- Email/SMS alert integrations
- Real-time WebSocket notifications
- Advanced SIEM integrations
- Custom dashboard widgets
- Scheduled report delivery
- Dark/light system theme detection
- Mobile-responsive sidebar
- Keyboard shortcut navigation

## License

MIT
