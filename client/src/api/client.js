import axios from 'axios';

const FALLBACK_API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5002/api';

const normalizeApiBaseUrl = (value) => {
  if (!value) {
    return FALLBACK_API_URL;
  }

  const trimmedValue = value.trim().replace(/\/+$/, '');

  if (trimmedValue.endsWith('/api')) {
    return trimmedValue;
  }

  return `${trimmedValue}/api`;
};

export const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
  timeout: 10000,
});

// Add a request interceptor to include the auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
