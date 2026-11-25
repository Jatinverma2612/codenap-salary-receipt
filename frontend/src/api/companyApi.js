import { apiRequest } from './client.js';

export async function fetchCompanySettings() {
  return apiRequest('/api/company');
}

export async function updateCompanySettings(payload) {
  return apiRequest('/api/company', {
    method: 'PATCH',
    body: payload,
  });
}

export async function uploadCompanyLogo(file) {
  const formData = new FormData();
  formData.append('logo', file);

  return apiRequest('/api/company/logo', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function resetCompanyLogo() {
  return apiRequest('/api/company/logo', {
    method: 'DELETE',
  });
}

export async function uploadReceiptLogo(file) {
  const formData = new FormData();
  formData.append('logo', file);

  return apiRequest('/api/company/receipt-logo', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

export async function resetReceiptLogo() {
  return apiRequest('/api/company/receipt-logo', {
    method: 'DELETE',
  });
}
