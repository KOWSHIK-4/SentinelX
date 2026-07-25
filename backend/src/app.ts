import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { testDatabaseConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { correlationId } from './middleware/correlationId';
import { initializeSentry } from './config/sentry';
import authRoutes from './modules/auth/auth.routes';
import incidentRoutes from './modules/incidents/incident.routes';
import assetRoutes from './modules/assets/asset.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import reportRoutes from './modules/reports/reports.routes';
import teamRoutes from './modules/team/team.routes';
import settingsRoutes from './modules/settings/settings.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import auditRoutes from './modules/audit/audit.routes';
import v1Routes from './routes/v1';

initializeSentry();

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '10kb' }));

app.use(correlationId);

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    message: {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/api/health', async (_req, res) => {
  const dbConnected = await testDatabaseConnection();
  res.json({
    success: true,
    data: {
      status: dbConnected ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: env.API_VERSION,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SentinelX API Documentation',
}));

const moduleRoutes = [
  { path: '/auth', router: authRoutes },
  { path: '/incidents', router: incidentRoutes },
  { path: '/assets', router: assetRoutes },
  { path: '/analytics', router: analyticsRoutes },
  { path: '/reports', router: reportRoutes },
  { path: '/team', router: teamRoutes },
  { path: '/settings', router: settingsRoutes },
  { path: '/notifications', router: notificationRoutes },
  { path: '/audit', router: auditRoutes },
];

for (const { path: routePath, router } of moduleRoutes) {
  app.use(`/api${routePath}`, router);
}

app.use('/api/v1', v1Routes);

const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
app.use('/api/uploads', express.static(uploadsPath));

app.use(errorHandler);

export default app;
