import { getStoredToken } from './auth-service';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function buildQuery(params) {
  if (!params || Object.keys(params).length === 0) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value);
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function fetcher(endpoint, options = {}) {
  const { params, ...fetchOptions } = options;
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}${buildQuery(params)}`;
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const error = new Error(data?.message || `API Error: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { data, status: response.status };
}

export const api = {
  get: (endpoint, options = {}) => fetcher(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => fetcher(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => fetcher(endpoint, { method: 'DELETE' }),
};
