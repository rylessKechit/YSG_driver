// src/services/authService.js
import axios from 'axios';
import { API_URL, ENDPOINTS } from '../config';

// Configuration d'Axios avec intercepteurs
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// Intercepteur pour gérer les 401 (token expiré)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Système de cache simplifié
const cache = {
  data: {},
  ttl: 5 * 60 * 1000, // 5 minutes
  
  get: function(key) {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttl) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  
  set: function(key, value) {
    this.data[key] = {
      value,
      timestamp: Date.now()
    };
  },
  
  clear: function(pattern = null) {
    if (!pattern) {
      this.data = {};
      return;
    }
    
    Object.keys(this.data).forEach(key => {
      if (key.startsWith(pattern)) delete this.data[key];
    });
  }
};

// Fonction avec gestion de cache
const fetchWithCache = async (endpoint, options = {}) => {
  const cacheKey = endpoint + JSON.stringify(options);
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) return cachedData;
  
  const response = await api.get(endpoint, options);
  cache.set(cacheKey, response.data);
  return response.data;
};

// Service d'authentification
const authService = {
  login: async (username, password) => {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, { username, password });
    cache.clear();
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
    cache.clear();
    return response.data;
  },
  
  getCurrentUser: async () => fetchWithCache(ENDPOINTS.AUTH.ME),
  
  logout: async () => {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      cache.clear();
    }
  }
};

export const invalidateCache = cache.clear;
export default authService;
export { api, fetchWithCache, cache };