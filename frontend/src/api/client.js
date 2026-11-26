export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Kept strictly in module memory (never in localStorage or sessionStorage).
let csrfTokenMemory = '';

export class ApiClientError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

export function setCsrfToken(token) {
  csrfTokenMemory = typeof token === 'string' ? token : '';
}

export function clearCsrfToken() {
  csrfTokenMemory = '';
}

function buildFallbackErrorMessage(status) {
  if (status === 502 || status === 503 || status === 504 || status === 500) {
    return `Unable to reach the backend API (HTTP ${status}). Verify the backend server is running and connected to MongoDB.`;
  }
  return `Request failed (HTTP ${status}).`;
}

async function performFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new ApiClientError(
      0,
      'Cannot connect to the backend server. Please make sure the backend server is running.'
    );
  }
}

/**
 * Ensures a valid CSRF token and HttpOnly CSRF cookie exist before state-changing calls.
 */
export async function ensureCsrfToken(forceRefresh = false) {
  if (csrfTokenMemory && !forceRefresh) {
    return csrfTokenMemory;
  }

  const response = await performFetch(`${API_BASE}/api/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.csrfToken) {
    throw new ApiClientError(
      response.status,
      payload?.message || buildFallbackErrorMessage(response.status)
    );
  }

  setCsrfToken(payload.csrfToken);
  return csrfTokenMemory;
}

/**
 * Performs an authenticated JSON or FormData API request with automatic CSRF protection.
 */
export async function apiRequest(path, { method = 'GET', body, isFormData = false, _retriedCsrf = false } = {}) {
  const upperMethod = method.toUpperCase();
  const headers = {};

  if (STATE_CHANGING_METHODS.has(upperMethod)) {
    const token = await ensureCsrfToken(false);
    headers['X-CSRF-Token'] = token;
  }

  let requestBody;
  if (body !== undefined) {
    if (isFormData) {
      requestBody = body;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  const response = await performFetch(`${API_BASE}${path}`, {
    method: upperMethod,
    headers,
    body: requestBody,
    credentials: 'include',
  });

  const payload = await response.json().catch(() => null);

  if (payload?.csrfToken) {
    setCsrfToken(payload.csrfToken);
  }

  if (
    response.status === 403 &&
    !_retriedCsrf &&
    STATE_CHANGING_METHODS.has(upperMethod) &&
    typeof payload?.message === 'string' &&
    payload.message.toLowerCase().includes('csrf')
  ) {
    await ensureCsrfToken(true);
    return apiRequest(path, { method: upperMethod, body, isFormData, _retriedCsrf: true });
  }

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      payload?.message || buildFallbackErrorMessage(response.status)
    );
  }

  return payload || {};
}
