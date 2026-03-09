import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: 'https://api.horecahub.ae/logistics/api/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    // This pulls the current state from Zustand dynamically on every request
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`🚀 [Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    if (response?.status === 401) {
      console.log('Unauthorized - Logging out');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
