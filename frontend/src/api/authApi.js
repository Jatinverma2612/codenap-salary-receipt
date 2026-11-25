import { apiRequest, clearCsrfToken, ensureCsrfToken } from './client.js';

export async function fetchCsrfToken() {
  return ensureCsrfToken(true);
}

export async function fetchSetupStatus() {
  return apiRequest('/api/auth/setup-status');
}

export async function setupInitialAdmin(payload) {
  return apiRequest('/api/auth/setup', {
    method: 'POST',
    body: payload,
  });
}

export async function login(credentials) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export async function logout() {
  try {
    return await apiRequest('/api/auth/logout', { method: 'POST' });
  } finally {
    clearCsrfToken();
  }
}

export async function fetchCurrentUser() {
  return apiRequest('/api/auth/me');
}
