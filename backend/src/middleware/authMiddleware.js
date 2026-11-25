import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from './errorMiddleware.js';

// __Host- prefix requires Secure cookies; enabled automatically in HTTPS production.
// TODO(security): Enable HTTPS in all non-local environments so __Host- cookie prefix is always enforced.
export const AUTH_COOKIE_NAME = env.isProduction ? '__Host-codenap_session' : 'codenap_session';

/**
 * Returns hardened cookie options for setting or clearing the session JWT cookie.
 */
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

/**
 * Signs a short-lived HS256 JWT for an authenticated internal user.
 */
export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: env.jwtExpiresIn,
    }
  );
}

/**
 * Verifies the session JWT cookie and ensures the user account remains active.
 */
export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token || typeof token !== 'string') {
      throw new ApiError(401, 'Authentication required.');
    }

    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256'],
    });

    if (!decoded?.sub) {
      throw new ApiError(401, 'Invalid authentication session.');
    }

    const user = await User.findById(decoded.sub).select('name email role isActive').lean();
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Authentication session is no longer active.');
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    return next(new ApiError(401, 'Invalid or expired authentication session.'));
  }
}

/**
 * Restricts route access to users possessing one of the permitted internal roles.
 */
export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
}
