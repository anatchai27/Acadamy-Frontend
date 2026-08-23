const API_BASE = import.meta.env.VITE_API_URL || '/api';

const buildQuery = params => {
  return !params ? '' : (() => {
    const search = new URLSearchParams();
    Object.entries(params).map(([key, value]) => {
      (value !== undefined && value !== null && value !== '') ? search.append(key, value) : null;
    });
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  })();
};

const fetcher = async (endpoint, options = {}) => {
  const { params, signal, ...fetchOptions } = options;
  const headers = { ...fetchOptions.headers };

  const token = (() => {
    try {
      return window.localStorage.getItem('parent_token');
    } catch {
      return null;
    }
  })();

  token && !headers.Authorization ? (headers.Authorization = `Bearer ${token}`) : null;

  const hasBody = fetchOptions.body !== undefined;
  const isFormData = hasBody && fetchOptions.body instanceof FormData;
  !isFormData ? (headers['Content-Type'] = 'application/json') : null;

  const url = `${API_BASE}${endpoint}${buildQuery(params)}`;
  const response = await fetch(url, { ...fetchOptions, headers, signal });

  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  return response.ok ? { data, status: response.status } : (() => {
    const msg = data?.message || data?.error || `API Error: ${response.status}`;
    const error = new Error(msg);
    error.status = response.status;
    error.data = data;
    throw error;
  })();
};

export const api = {
  get: (endpoint, options = {}) => fetcher(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) =>
    fetcher(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data, options = {}) =>
    fetcher(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data, options = {}) =>
    fetcher(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint, options = {}) => fetcher(endpoint, { ...options, method: 'DELETE' }),
};
