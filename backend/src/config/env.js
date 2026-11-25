import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load variables from backend/.env regardless of the working directory used to launch Node.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PLACEHOLDER_SECRETS = new Set([
  'replace_with_a_strong_random_secret_at_least_32_chars',
  'changeme',
  'secret',
  'default',
]);

const ALLOWED_SAME_SITE = new Set(['lax', 'strict', 'none']);

/**
 * Validates and returns an integer port number within the valid TCP range.
 */
function parsePort(rawPort) {
  if (!rawPort) {
    return 5000;
  }

  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('Environment variable PORT must be a valid integer between 1 and 65535.');
  }

  return parsed;
}

/**
 * Validates that a required environment variable is present and non-empty.
 */
function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Parses comma-separated CORS origins and rejects wildcard '*'.
 */
function parseCorsOrigins(rawCors, isProduction) {
  const raw = rawCors?.trim() || (isProduction ? '' : 'http://localhost:5173');
  if (!raw || raw === '*') {
    throw new Error('Environment variable CORS_ORIGIN must be set to an explicit origin (not "*").');
  }

  const origins = raw
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (origins.length === 0 || origins.includes('*')) {
    throw new Error('Environment variable CORS_ORIGIN must contain valid explicit origins.');
  }

  return origins;
}

/**
 * Validates all required startup configuration and fails fast if misconfigured.
 */
function loadConfig() {
  const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
  const isProduction = nodeEnv === 'production';

  const mongoUri = requireEnv('MONGO_URI');
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error('Environment variable MONGO_URI must start with "mongodb://" or "mongodb+srv://".');
  }

  const jwtSecret = requireEnv('JWT_SECRET');
  if (PLACEHOLDER_SECRETS.has(jwtSecret)) {
    throw new Error('Environment variable JWT_SECRET must not use an example placeholder value.');
  }
  if (jwtSecret.length < 32) {
    if (isProduction) {
      throw new Error('Environment variable JWT_SECRET must be at least 32 characters in production.');
    }
    console.warn('Warning: JWT_SECRET is shorter than 32 characters; use a stronger secret before production.');
  }

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN, isProduction);

  const cookieSameSite = (process.env.COOKIE_SAME_SITE?.trim() || 'lax').toLowerCase();
  if (!ALLOWED_SAME_SITE.has(cookieSameSite)) {
    throw new Error('Environment variable COOKIE_SAME_SITE must be lax, strict, or none.');
  }
  if (cookieSameSite === 'none' && !isProduction) {
    throw new Error('COOKIE_SAME_SITE=none requires NODE_ENV=production (HTTPS Secure cookies).');
  }

  const serveFrontendMode = (process.env.SERVE_FRONTEND?.trim() || 'auto').toLowerCase();

  return Object.freeze({
    port: parsePort(process.env.PORT?.trim()),
    nodeEnv,
    isProduction,
    mongoUri,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '8h',
    corsOrigin: corsOrigins[0],
    corsOrigins,
    cookieSameSite,
    serveFrontendMode,
  });
}

const env = loadConfig();

export default env;
