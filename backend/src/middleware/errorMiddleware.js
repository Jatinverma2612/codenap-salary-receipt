import env from '../config/env.js';

/**
 * Custom HTTP error carrying a safe client-facing status code and message.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Handles unmatched API routes with a clean 404 JSON payload.
 */
export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    message: 'Requested endpoint not found.',
  });
}

/**
 * Global Express error middleware returning safe JSON errors without leaking stack traces.
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err?.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation failed.',
    });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier or field format.',
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique value already exists.',
    });
  }

  if (err instanceof RangeError || err instanceof TypeError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Log diagnostic error internally; keep client response generic.
  if (env.isProduction) {
    console.error('Unhandled server error:', err?.message || 'Unknown error');
  } else {
    console.error('Unhandled server error:', err);
  }

  return res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
  });
}
