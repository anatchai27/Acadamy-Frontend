const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetcher(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return { data: await response.json(), status: response.status };
}

export const api = {
  get: (endpoint) => fetcher(endpoint),
  post: (endpoint, data) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => fetcher(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => fetcher(endpoint, { method: 'DELETE' }),
};
