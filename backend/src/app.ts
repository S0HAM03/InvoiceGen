import * as Sentry from '@sentry/node';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// 1. Sentry request handler
if (env.SENTRY_DSN) {
  Sentry.init({ dsn: env.SENTRY_DSN });
  // app.use(Sentry.Handlers.requestHandler());
}

// 2. Security headers
app.use(helmet());

// 3. CORS
app.use(cors({
  origin: env.CORS_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// 4. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 5. NoSQL injection prevention
app.use(mongoSanitize());

// 6. HTTP request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 7. Root
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Invoice Generator API is running smoothly.',
    version: '1.0.0'
  });
});

// 8. Global rate limit
const globalLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api', globalLimiter);

// 9. Strict auth-route rate limit
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, skipSuccessfulRequests: true });
app.use('/api/v1/auth', authLimiter);

// 10. Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import clientRoutes from './modules/clients/client.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';
import healthRoutes from './modules/health/health.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/health', healthRoutes);

// 11. Sentry error handler
if (env.SENTRY_DSN) {
  // app.use(Sentry.Handlers.errorHandler());
}

// 11.5. Catch-all 404 Handler
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot find ${req.originalUrl} on this server`
    }
  });
});

// 12. Central error handler (always last)
app.use(errorHandler);

export default app;
