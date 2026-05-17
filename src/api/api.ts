import axios from 'axios';

// TypeScript ko batane ke liye ki ye string hai
const envUrl = import.meta.env.VITE_API_BASE_URL as string;

export const API_BASE_URL = (envUrl || 'http://localhost:8080').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')?.replace(/^Bearer\s+/i, '').trim();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;