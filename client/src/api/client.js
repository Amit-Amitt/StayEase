import axios from 'axios';

const FALLBACK_API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5002/api';

const normalizeApiBaseUrl = (value) => {
  let base = value?.trim() || FALLBACK_API_URL;
  base = base.replace(/\/+$/, '');
  return base.endsWith('/api') ? `${base}/` : `${base}/api/`;
};

const baseURL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const apiClient = axios.create({ baseURL, timeout: 10000, withCredentials: true });

let accessToken = null;
let refreshPromise;
export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const clearAccessToken = () => {
  accessToken = null;
};

const clearSession = () => {
  clearAccessToken();
  localStorage.removeItem('stayease-auth-user');
  window.dispatchEvent(new Event('stayease:unauthorized'));
};

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const url = request?.url || '';
    const isAuthEndpoint = url.startsWith('auth/');

    if (error.response?.status === 401 && request && !request._retry && !isAuthEndpoint) {
      request._retry = true;
      try {
        refreshPromise ||= axios.post(`${baseURL}auth/refresh`, {}, {
          withCredentials: true,
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }).then(({ data }) => {
          setAccessToken(data.token);
          localStorage.setItem('stayease-auth-user', JSON.stringify(data.user));
          return data.token;
        }).finally(() => {
          refreshPromise = undefined;
        });
        const token = await refreshPromise;
        request.headers.Authorization = `Bearer ${token}`;
        return apiClient(request);
      } catch {
        clearSession();
      }
    }

    const message = error.response?.data?.message || error.message || 'An unexpected API error occurred';
    console.error(`[API Error] ${request?.method?.toUpperCase()} ${url}:`, message);
    return Promise.reject(error);
  },
);

export const checkConnectivity = async () => {
  try {
    await apiClient.get('health');
    return true;
  } catch {
    return false;
  }
};
