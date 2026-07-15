const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let onUnauthorized = null;

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

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
  const { params, signal, ...fetchOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const url = `${API_BASE}${endpoint}${buildQuery(params)}`;
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
    signal,
  });

  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const msg = data?.message || data?.error || `API Error: ${response.status}`;
    const error = new Error(msg);
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
