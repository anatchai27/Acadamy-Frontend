const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'auth_token';

let onUnauthorized = null;

export const setOnUnauthorized = handler => {
  onUnauthorized = handler;
};

const buildQuery = params => {
  return !params || Object.keys(params).length === 0 ? '' : (() => {
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

  const storedToken = (() => {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  })();

  storedToken && !headers.Authorization ? (headers.Authorization = `Bearer ${storedToken}`) : null;

  const hasBody = fetchOptions.body !== undefined;
  const isFormData = hasBody && fetchOptions.body instanceof FormData;
  !isFormData ? (headers['Content-Type'] = 'application/json') : null;

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

  return response.ok ? { data, status: response.status } : (() => {
    const serverMessage = data?.message || data?.error || '';
    const isTenantContextInvalid = response.status === 403
      && /tenant validation failed|invalid or missing institute context/i.test(String(serverMessage));
    const isUnauthorized = response.status === 401 || isTenantContextInvalid;

    isUnauthorized && onUnauthorized
      ? onUnauthorized(isTenantContextInvalid ? 'session-expired' : 'unauthorized')
      : null;

    const msg = isTenantContextInvalid
      ? 'Session หมดเวลา กรุณาเข้าสู่ระบบใหม่อีกครั้ง'
      : data?.message || data?.error || `API Error: ${response.status}`;
    const error = new Error(msg);
    error.status = response.status;
    error.data = data;
    error.reason = isTenantContextInvalid ? 'session-expired' : undefined;
    throw error;
  })();
};

export const api = {
  get: (endpoint, options = {}) => fetcher(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) => {
    const isFormData = data instanceof FormData;
    return fetcher(endpoint, { ...options, method: 'POST', body: isFormData ? data : JSON.stringify(data) });
  },
  put: (endpoint, data, options = {}) => fetcher(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data, options = {}) => fetcher(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint, options = {}) => fetcher(endpoint, { ...options, method: 'DELETE' }),
};
