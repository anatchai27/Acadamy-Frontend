const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const recoverExpiredParentSession = (
  status,
  endpoint,
  { storage = window.localStorage, location = window.location } = {},
) => {
  if (status !== 401 || endpoint === '/parents/bind-line' || endpoint.startsWith('/parents/bind-line?')) return false;

  try {
    storage.removeItem('parent_token');
  } catch {}

  if (location.pathname?.startsWith('/liff') && location.pathname !== '/liff/login') {
    location.assign('/liff/login');
  }
  return true;
};

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
    recoverExpiredParentSession(response.status, endpoint);
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
  postForm: (endpoint, formData, options = {}) =>
    fetcher(endpoint, { ...options, method: 'POST', body: formData }),
  put: (endpoint, data, options = {}) =>
    fetcher(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data, options = {}) =>
    fetcher(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint, options = {}) => fetcher(endpoint, { ...options, method: 'DELETE' }),
  download: async (endpoint, options = {}) => {
    const token = (() => {
      try { return window.localStorage.getItem('parent_token'); } catch { return null; }
    })();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: options.signal,
    });
    if (!response.ok) {
      recoverExpiredParentSession(response.status, endpoint);
      const error = new Error(`API Error: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return { blob: await response.blob() };
  },
};
