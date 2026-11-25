import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import User from '../models/User.js';
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  signAuthToken,
} from '../middleware/authMiddleware.js';
import { issueCsrfToken } from '../middleware/csrfMiddleware.js';
import { ApiError } from '../middleware/errorMiddleware.js';
import {
  validateLoginPayload,
  validateSetupPayload,
} from '../middleware/validateMiddleware.js';

// Precomputed dummy hash to keep login response timing consistent when email does not exist.
const DUMMY_PASSWORD_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO9mW4kI0j4M8vK9W6l6r9Q5s3uG7g4e.';

/**
 * Issues a CSRF token cookie and returns the matching token for client requests.
 */
export function getCsrfToken(_req, res) {
  const csrfToken = issueCsrfToken(res);
  res.json({ success: true, csrfToken });
}

/**
 * Reports whether initial admin bootstrap is required (no users created yet in dev).
 */
export async function getSetupStatus(_req, res, next) {
  try {
    const userCount = await User.countDocuments();
    res.json({
      success: true,
      needsSetup: !env.isProduction && userCount === 0,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates the first internal admin account in non-production when no users exist yet.
 */
export async function setupInitialAdmin(req, res, next) {
  try {
    // TODO(security): For production onboarding, provision admin users via a secure CLI/KMS workflow or OAuth/OIDC SSO.
    if (env.isProduction) {
      throw new ApiError(403, 'Initial setup endpoint is disabled in production.');
    }

    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      throw new ApiError(403, 'An internal account already exists. Please sign in.');
    }

    const { name, email, password } = validateSetupPayload(req.body);
    const passwordHash = await bcrypt.hash(password, 12);

    const adminUser = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
    });

    const token = signAuthToken(adminUser);
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    const csrfToken = issueCsrfToken(res);

    res.status(201).json({
      success: true,
      csrfToken,
      user: {
        id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticates an internal HR/Admin user and issues a hardened HttpOnly session cookie.
 */
export async function login(req, res, next) {
  try {
    // TODO(security): Consider adding MFA and leaked-password checking for production deployments.
    const { email, password } = validateLoginPayload(req.body);
    const user = await User.findOne({ email }).select('+passwordHash');

    const hashToCompare = user?.passwordHash || DUMMY_PASSWORD_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !user.isActive || !isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const token = signAuthToken(user);
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    const csrfToken = issueCsrfToken(res);

    res.json({
      success: true,
      csrfToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Clears the session cookie and rotates the CSRF cookie on logout.
 */
export function logout(_req, res) {
  const { maxAge: _ignored, ...clearOptions } = getAuthCookieOptions();
  res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
  const csrfToken = issueCsrfToken(res);

  res.json({
    success: true,
    csrfToken,
    message: 'Logged out successfully.',
  });
}

/**
 * Returns the currently authenticated internal user profile.
 */
export function getCurrentUser(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}
