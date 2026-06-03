const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetcher(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
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
  get: (endpoint) => fetcher(endpoint),
  post: (endpoint, data) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => fetcher(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => fetcher(endpoint, { method: 'DELETE' }),
};
