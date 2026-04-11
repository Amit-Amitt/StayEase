import axios from 'axios';

const FALLBACK_API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5002/api';

const normalizeApiBaseUrl = (value) => {
  let base = value?.trim();
  
  // Use fallback if value is empty or missing
  if (!base) {
    base = FALLBACK_API_URL;
  }
  
  // Remove trailing slashes
  base = base.replace(/\/+$/, '');
  
  // Ensure it ends with /api/
  return base.endsWith('/api') ? `${base}/` : `${base}/api/`;
};

export const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor: Add Auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle global errors and token cleanup
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (session expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('Session expired or unauthorized. Clearing local storage...');
      localStorage.removeItem('token');
      localStorage.removeItem('stayease-auth-user');
      
      // We don't automatically redirect to avoid loops, 
      // but the UI will react to the missing user state.
    }

    // Log the error details for easier debugging in the console
    const message = error.response?.data?.message || error.message || 'An unexpected API error occurred';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);

    return Promise.reject(error);
  }
);

// Function to check if the API is reachable (for diagnostics)
export const checkConnectivity = async () => {
  try {
    const { data } = await apiClient.get('health');
    console.log('[API Connectivity] Connected to:', data.environment || 'unknown');
    return true;
  } catch (error) {
    console.warn('[API Connectivity] Backend is currently unreachable:', error.message);
    return false;
  }
};


