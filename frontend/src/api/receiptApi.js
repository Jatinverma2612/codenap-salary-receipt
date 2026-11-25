import { apiRequest } from './client.js';

export async function fetchReceipts(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return apiRequest(`/api/receipts${qs ? `?${qs}` : ''}`);
}

export async function fetchReceiptById(id) {
  return apiRequest(`/api/receipts/${encodeURIComponent(id)}`);
}

export async function createReceipt(payload) {
  return apiRequest('/api/receipts', {
    method: 'POST',
    body: payload,
  });
}

export async function updateReceipt(id, payload) {
  return apiRequest(`/api/receipts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteReceipt(id) {
  return apiRequest(`/api/receipts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
