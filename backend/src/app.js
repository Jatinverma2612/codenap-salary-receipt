import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import env from './config/env.js';
import { verifyCsrf } from './middleware/csrfMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { sanitizeRequestKeys } from './middleware/validateMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIST_DIR = path.resolve(__dirname, '../../frontend/dist');
const FRONTEND_INDEX_FILE = path.join(FRONTEND_DIST_DIR, 'index.html');

/**
 * Lightweight fixed-window in-memory rate limiter for API abuse protection.
 */
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (now >= entry.resetAt) {
        hits.delete(key);
      }
    }
  }, windowMs);
  cleanupTimer.unref();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message,
      });
    }

    return next();
  };
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.isProduction ? 1 : false);

// Security HTTP headers and strict CSP (allows Google Fonts when serving built frontend).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Strict CORS configuration validated against explicit configured frontend origins.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests. Please try again later.',
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many authentication attempts. Please try again later.',
});

// Prevent sensitive payroll/auth responses from being cached in browsers or proxies.
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use('/api', apiLimiter);
app.use('/api', sanitizeRequestKeys);
app.use('/api', verifyCsrf);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/setup', authLimiter);

// Uploaded logos are served exclusively through authenticated /api/company/* endpoints
// with X-Content-Type-Options: nosniff rather than exposing uploads/ as a public static root.
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/receipts', receiptRoutes);

// Unmatched /api/* endpoints always return clean JSON 404.
app.use('/api', notFoundHandler);

// Optional single-server production SPA serving when frontend/dist has been built.
const shouldServeBuiltFrontend =
  env.serveFrontendMode === 'true' ||
  (env.serveFrontendMode === 'auto' && env.isProduction && fs.existsSync(FRONTEND_INDEX_FILE));

if (shouldServeBuiltFrontend && fs.existsSync(FRONTEND_INDEX_FILE)) {
  app.use(express.static(FRONTEND_DIST_DIR));
  app.get('*', (_req, res) => {
    res.sendFile(FRONTEND_INDEX_FILE);
  });
} else {
  app.use(notFoundHandler);
}

app.use(errorHandler);

export default app;
