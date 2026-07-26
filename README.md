# SentinelX

**AI-Powered Security Operations Center Platform**

SentinelX is a modern, full-featured SOC (Security Operations Center) platform for real-time threat detection, incident response, asset management, and security analytics. Built with a focus on performance, security, and usability.

---

## Features

| Capability | Description |
|---|---|
| **Incident Management** | Track, triage, and resolve security incidents with severity levels, assignments, and status workflows |
| **Asset Management** | Monitor and manage infrastructure assets with criticality ratings and detailed inventory |
| **Security Analytics** | Deep analytics with trend analysis, severity/status distribution charts, and asset breakdowns |
| **Reporting & Export** | Generate detailed security reports with CSV/PDF export and executive summaries |
| **Team Management** | Role-based access control (Admin, Analyst, Viewer) with team member management |
| **Audit Logging** | Comprehensive audit trail of all system activities with search and filtering |
| **Real-time Notifications** | Socket.IO-powered real-time notifications for incidents, alerts, and system events |
| **Configurable Settings** | Customizable organization settings, security policies, appearance, and notification preferences |
| **SOC Dashboard** | Real-time dashboard with key metrics, system health monitoring, and recent activity |
| **JWT Authentication** | Secure token-based authentication with registration and login flow |
| **API Documentation** | Interactive Swagger/OpenAPI documentation at `/api/docs` |

---

## Architecture

```
                      ┌─────────────┐
                      │   Browser   │
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │  Nginx/     │
                      │  Vercel     │
                      │ (CDN/Proxy) │
                      └──────┬──────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
        ┌──────▼──────┐           ┌────────▼────────┐
        │   Backend   │           │   Frontend      │
        │  Express +  │           │  React + Vite   │
        │  TypeScript │           │  + Tailwind CSS │
        │  (Railway)  │           │  (Vercel)       │
        └──────┬──────┘           └─────────────────┘
               │
        ┌──────▼──────┐
        │  PostgreSQL │
        │   (Prisma)  │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │    Redis    │
        │  (Optional) │
        └─────────────┘
```

## Folder Structure

```
SentinelX/
├── backend/
│   ├── prisma/                      # Database schema, migrations, seed data
│   │   ├── schema.prisma            # Data model (User, Role, Incident, Asset, etc.)
│   │   ├── seed.ts                  # Sample data seeder
│   │   └── migrations/              # Database migrations
│   └── src/
│       ├── app.ts                   # Express application setup
│       ├── server.ts                # Entry point with HTTP server + Socket.IO
│       ├── config/
│       │   ├── env.ts               # Zod-validated environment variables
│       │   ├── database.ts          # Prisma client singleton
│       │   ├── redis.ts             # Redis caching layer (optional)
│       │   ├── sentry.ts            # Error tracking initialization
│       │   ├── swagger.ts           # OpenAPI documentation
│       │   └── upload.ts            # Multer file upload config
│       ├── middleware/
│       │   ├── auth.ts              # JWT authentication middleware
│       │   ├── authorize.ts         # Role-based authorization
│       │   ├── correlationId.ts     # Request tracing
│       │   ├── errorHandler.ts      # Global error handler
│       │   ├── requirePermission.ts # Permission-based access control
│       │   └── validate.ts          # Zod request validation
│       ├── modules/
│       │   ├── analytics/           # Analytics overview, trends, distributions
│       │   ├── assets/              # Asset CRUD and statistics
│       │   ├── audit/               # Audit logging service
│       │   ├── auth/                # Registration, login, profile
│       │   ├── incidents/           # Incident CRUD and statistics
│       │   ├── notifications/       # Notification management
│       │   ├── reports/             # Report generation and export
│       │   ├── settings/            # Organization settings
│       │   └── team/                # Team member management
│       ├── types/                   # TypeScript type definitions
│       └── utils/
│           ├── cache.ts             # Cache helper with Redis
│           ├── jwt.ts               # JWT sign/verify
│           ├── password.ts          # bcrypt hash/compare
│           ├── pdf.ts               # PDF report generation
│           └── socket.ts            # Socket.IO event emitter
├── frontend/
│   └── src/
│       ├── App.tsx                  # Root component with lazy-loaded routes
│       ├── main.tsx                 # Application entry point
│       ├── components/
│       │   ├── assets/              # Asset detail and form components
│       │   ├── auth/                # ProtectedRoute wrapper
│       │   ├── incidents/           # Incident detail, form, filters, confirm
│       │   ├── landing/             # Public landing page sections
│       │   ├── layout/              # AppLayout, Sidebar, Header, Footer
│       │   ├── theme/               # ThemeToggle component
│       │   └── ui/                  # Shadcn UI primitives (button, card, table, etc.)
│       ├── hooks/                   # Custom hooks (useToast, useTheme, etc.)
│       ├── lib/                     # API client modules (domain-split)
│       ├── pages/                   # Route pages (14 pages)
│       ├── providers/               # ThemeProvider context
│       ├── store/                   # Zustand stores (auth, notifications)
│       └── styles/                  # Global CSS with Tailwind + CSS variables
├── docker/
│   ├── Dockerfile.backend          # Multi-stage backend build
│   ├── Dockerfile.frontend         # Multi-stage frontend build + Nginx
│   ├── entrypoint.sh               # DB migration + server start
│   └── nginx.conf                  # Nginx with security headers + proxy
├── docker-compose.yml              # Production-ready multi-service setup
├── railway.json                    # Railway deployment config
├── package.json                    # Workspace root configuration
└── README.md
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI library with TypeScript |
| **Vite 5** | Build tool with HMR |
| **Tailwind CSS 3** | Utility-first CSS framework |
| **Shadcn UI** | Accessible Radix UI primitives |
| **TanStack Query 5** | Server state management |
| **Zustand 5** | Client state management |
| **React Router 6** | Client-side routing with lazy loading |
| **Framer Motion 11** | Animations |
| **Recharts** | Data visualization |
| **Socket.IO Client** | Real-time communication |
| **Lucide React** | Icon library |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js 20** | Runtime |
| **Express 4** | HTTP framework |
| **TypeScript 5** | Type safety |
| **Prisma 5** | ORM with PostgreSQL |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Caching (optional) |
| **JWT (jsonwebtoken)** | Authentication |
| **Zod** | Schema validation |
| **Helmet** | Security headers |
| **Socket.IO** | WebSocket server |
| **PDFKit** | PDF report generation |
| **Swagger/OpenAPI** | API documentation |
| **Sentry** | Error tracking (optional) |

### DevOps

| Technology | Purpose |
|---|---|
| **Docker** | Containerization |
| **Docker Compose** | Multi-orchestration |
| **Nginx** | Reverse proxy |
| **Railway** | Backend deployment |
| **Vercel** | Frontend deployment |
| **GitHub Actions** | CI/CD |

---

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm 10+
- Docker & Docker Compose (optional, for containerized setup)
- Redis 7+ (optional, for caching)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/sentinelx.git
cd sentinelx

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and JWT secret

# 4. Generate Prisma client and push schema
npm run db:generate -w backend
npm run db:push -w backend

# 5. Seed the database (optional, creates sample data)
npm run db:seed -w backend

# 6. Start development servers
npm run dev
```

The backend starts at `http://localhost:5000` and the frontend at `http://localhost:5173`.

### Docker Setup

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Full reset (removes volumes)
docker compose down -v
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default | Required |
|---|---|---|---|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `5000` | No |
| `DATABASE_URL` | PostgreSQL connection string | — | **Yes** |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — | **Yes** |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` | No |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (milliseconds) | `900000` (15 min) | No |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | No |
| `API_VERSION` | API version string | `1.0.0` | No |
| `REDIS_URL` | Redis connection string | — | No |
| `CLOUDINARY_URL` | Cloudinary URL for uploads | — | No |
| `UPLOAD_DIR` | Local upload directory | `uploads` | No |
| `SENTRY_DSN` | Sentry error tracking DSN | — | No |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | — |

---

## Deployment

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set the root directory (or use the monorepo setup)
3. Railway uses `railway.json` for build/deploy configuration
4. Set required environment variables:
   - `DATABASE_URL` — Railway PostgreSQL plugin
   - `JWT_SECRET` — Generate a 64-char random string
   - `CORS_ORIGIN` — Your frontend Vercel URL

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend/`
3. Configure build command: `npm run build`
4. Set output directory: `dist`
5. Set environment variables:
   - `VITE_API_URL` — Railway backend URL (e.g., `https://your-app.railway.app/api`)
   - `VITE_SOCKET_URL` — Railway backend URL (e.g., `https://your-app.railway.app`)

### Docker (Any Cloud)

```bash
# Build and deploy with docker compose
docker compose up --build -d
```

---

## API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

### Endpoints Overview

#### System
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check with database status |

#### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login with email/password |
| GET | `/api/auth/profile` | Yes | Get current user profile |

#### Incidents
| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/api/incidents` | Yes | All |
| POST | `/api/incidents` | Yes | Admin, Analyst |
| GET | `/api/incidents/stats` | Yes | All |
| GET | `/api/incidents/:id` | Yes | All |
| PUT | `/api/incidents/:id` | Yes | Admin, Analyst |
| DELETE | `/api/incidents/:id` | Yes | Admin |

#### Assets
| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/api/assets` | Yes | All |
| POST | `/api/assets` | Yes | Admin, Analyst |
| GET | `/api/assets/stats` | Yes | All |
| GET | `/api/assets/:id` | Yes | All |
| PUT | `/api/assets/:id` | Yes | Admin, Analyst |
| DELETE | `/api/assets/:id` | Yes | Admin |

#### Analytics (all require auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/overview` | Analytics overview |
| GET | `/api/analytics/incidents` | Incident analytics |
| GET | `/api/analytics/assets` | Asset analytics |
| GET | `/api/analytics/trends` | Trend data |

#### Reports (all require auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/reports/incidents` | Incident report |
| GET | `/api/reports/assets` | Asset report |
| GET | `/api/reports/summary` | Executive summary |
| POST | `/api/reports/export` | Export (PDF/CSV) |

#### Team (all require Admin)
| Method | Path | Description |
|---|---|---|
| GET | `/api/team` | List team members |
| POST | `/api/team` | Create team member |
| PUT | `/api/team/:id` | Update team member |
| DELETE | `/api/team/:id` | Delete team member |

#### Settings (all require Admin)
| Method | Path | Description |
|---|---|---|
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/settings/reset` | Reset to defaults |
| GET | `/api/settings/system` | System info |
| POST | `/api/settings/logo` | Upload logo |

#### Notifications (all require auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications` | Create notification |
| PUT | `/api/notifications/read-all` | Mark all read |
| PUT | `/api/notifications/:id/read` | Mark one read |
| DELETE | `/api/notifications/:id` | Delete notification |

#### Audit (all require auth)
| Method | Path | Roles |
|---|---|---|
| GET | `/api/audit` | All (paginated) |
| GET | `/api/audit/:id` | All |
| DELETE | `/api/audit/:id` | Admin |
| DELETE | `/api/audit` | Admin (clear all) |

---

## Security

- **Helmet** — HSTS, XSS filter, nosniff, frameguard, referrer policy
- **CORS** — Strict origin checking with credentials, whitelist-based
- **Rate Limiting** — 100 requests per 15 minutes (configurable), 5 login attempts per minute
- **Input Validation** — Zod schemas on every API endpoint
- **JWT Authentication** — Bearer tokens with configurable expiration
- **Role-Based Access Control** — Admin, Analyst, Viewer roles with granular permissions
- **Permission System** — Resource+action based permissions assigned to roles
- **Password Security** — bcrypt hashing (12 rounds), complexity requirements (uppercase, lowercase, number)
- **Request Size Limits** — 10KB JSON body limit
- **Error Handling** — Structured errors, no stack traces in production
- **Nginx Security Headers** — X-Frame-Options, X-Content-Type-Options, XSS Protection, Permissions-Policy, HSTS
- **Security Headers (Vercel)** — Configured via `vercel.json` headers
- **Socket Authentication** — JWT-verified WebSocket connections

---

## Performance

- **Redis Caching** — Reduces database load for dashboard, analytics, and reports (30-120s TTL)
- **Automatic Cache Invalidation** — Cache cleared on data mutations
- **Efficient Prisma Queries** — Parallelized queries with selective includes
- **Pagination** — All list endpoints support paginated responses
- **Lazy Loading** — All page components are lazy-loaded with React.Suspense
- **Code Splitting** — Vendor, UI, charts, and animation chunks separated in Vite build
- **Connection Pooling** — Prisma handles PostgreSQL connection pooling
- **Optimized Docker Builds** — Multi-stage builds with minimal final image size
- **Non-root Containers** — Containers run as unprivileged users

---

## Future Roadmap

- [ ] Multi-factor authentication (TOTP)
- [ ] SIEM integration connectors (Splunk, ELK)
- [ ] Automated threat intelligence feeds
- [ ] Custom dashboard widgets
- [ ] Advanced RBAC with custom roles
- [ ] Email notification delivery
- [ ] Dark/light mode system preference detection
- [ ] Export to PDF with charts
- [ ] Webhook integrations (Slack, Teams, PagerDuty)
- [ ] Mobile-responsive sidebar
- [ ] E2E encryption for sensitive data
- [ ] Kubernetes deployment manifests

---

## Screenshots

> Screenshots will be added here.

| Dashboard | Incidents | Analytics |
|---|---|---|
| `![Dashboard](screenshots/dashboard.png)` | `![Incidents](screenshots/incidents.png)` | `![Analytics](screenshots/analytics.png)` |

---

## License

MIT

---

*Built with TypeScript, React, Express, and ❤️*
