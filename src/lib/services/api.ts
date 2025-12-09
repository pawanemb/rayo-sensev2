import axios from 'axios';
import { tokenManager } from '../auth/tokenManager';

const API_URL = process.env.NEXT_PUBLIC_RAYO_BACKEND_URL || 'https://backend.rayo.work';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 [API] Unauthorized - token may be expired');
    }
    return Promise.reject(error);
  }
);

export default api;
