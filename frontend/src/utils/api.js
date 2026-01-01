import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      // Don't modify the error, let components handle it
    }
    
    // Handle 401 - but don't auto-logout here (let AuthContext handle it)
    if (error.response?.status === 401) {
      // Could dispatch an event or use a callback here if needed
      console.warn('Unauthorized request');
    }
    
    return Promise.reject(error);
  }
);

export default api;
