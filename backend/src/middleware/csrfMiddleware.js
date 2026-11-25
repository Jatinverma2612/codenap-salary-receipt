import crypto from 'crypto';
import env from '../config/env.js';
import { ApiError } from './errorMiddleware.js';

// Double-submit CSRF cookie stored HttpOnly; matching token is sent via X-CSRF-Token header.
export const CSRF_COOKIE_NAME = env.isProduction ? '__Host-codenap_csrf' : 'codenap_csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const HEX_TOKEN_REGEX = /^[a-f0-9]{64}$/;

/**
 * Returns hardened cookie options for CSRF token storage.
 */
export function getCsrfCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

/**
 * Generates and attaches a fresh CSRF token cookie, returning the token string.
 */
export function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return token;
}

/**
 * Validates the X-CSRF-Token header against the HttpOnly CSRF cookie on state-changing requests.
 */
export function verifyCsrf(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get('x-csrf-token');

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    !HEX_TOKEN_REGEX.test(cookieToken) ||
    !HEX_TOKEN_REGEX.test(headerToken)
  ) {
    return next(new ApiError(403, 'Missing or invalid CSRF token.'));
  }

  const cookieBuffer = Buffer.from(cookieToken, 'utf8');
  const headerBuffer = Buffer.from(headerToken, 'utf8');

  if (cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    return next(new ApiError(403, 'CSRF token verification failed.'));
  }

  return next();
}
