import axios from 'axios';
import { toast } from 'react-toastify';

// Get serverUrl from environment or use default
const getServerUrl = () => {
  if (typeof window !== 'undefined' && window.__SERVER_URL__) {
    return window.__SERVER_URL__;
  }
  return import.meta.env.VITE_SERVER_URL || 
    (import.meta.env.MODE === 'production' 
      ? "https://rcr-backend.onrender.com" 
      : "http://localhost:8000");
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: getServerUrl(),
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Log request in development
    if (import.meta.env.MODE === 'development') {
      console.log(`[Axios] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      // Network error - no response from server
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        const errorMessage = 'Request timeout. The server is taking too long to respond. Please try again.';
        console.error('[Axios] Timeout error:', error);
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        const errorMessage = 'Network error. Please check your internet connection and try again.';
        console.error('[Axios] Network error:', error);
        console.error('[Axios] Server URL:', getServerUrl());
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      if (error.request) {
        const errorMessage = 'Cannot connect to server. Please check:\n1. Your internet connection\n2. Server is running\n3. Server URL is correct';
        console.error('[Axios] No response from server:', error.request);
        console.error('[Axios] Server URL:', getServerUrl());
        toast.error('Cannot connect to server. Please check your connection.');
        return Promise.reject(new Error(errorMessage));
      }
    }

    // Handle HTTP errors
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An error occurred';

    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        console.warn('[Axios] Unauthorized - redirecting to login');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        break;
      case 403:
        toast.error('Access denied. You don\'t have permission to perform this action.');
        break;
      case 404:
        console.error('[Axios] 404 Not Found:', error.config?.url);
        toast.error('Resource not found. Please check the URL.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      case 503:
        toast.error('Service unavailable. The server is temporarily down.');
        break;
      default:
        if (status >= 400 && status < 500) {
          toast.error(message || 'Client error occurred');
        } else if (status >= 500) {
          toast.error('Server error. Please try again later.');
        }
    }

    return Promise.reject(error);
  }
);

// Check server connection
export const checkServerConnection = async () => {
  try {
    const response = await axios.get(`${getServerUrl()}/`, { 
      timeout: 5000,
      withCredentials: true 
    });
    return { connected: true, message: 'Server is reachable' };
  } catch (error) {
    if (!error.response) {
      return { 
        connected: false, 
        message: 'Cannot connect to server. Please check your internet connection and server status.',
        error: error.message 
      };
    }
    return { connected: true, message: 'Server is reachable (error response received)' };
  }
};

// Test API endpoint
export const testApiConnection = async () => {
  try {
    const response = await axios.get(`${getServerUrl()}/api/test`, { 
      timeout: 5000,
      withCredentials: true 
    });
    return { connected: true, data: response.data };
  } catch (error) {
    return { 
      connected: false, 
      error: error.message,
      details: error.response?.data || error.request 
    };
  }
};

export default axiosInstance;

