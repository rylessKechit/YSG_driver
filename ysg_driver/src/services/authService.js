// src/services/authService.js
import axios from 'axios';
import { API_URL, ENDPOINTS } from '../config';

// Configuration d'Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Système de cache
const cache = {
  data: {},
  timestamps: {}
};

// Durée de validité du cache (en ms)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fonction pour récupérer les données avec cache
const fetchWithCache = async (endpoint, options = {}) => {
  const cacheKey = endpoint + JSON.stringify(options);
  const now = Date.now();
  
  // Si les données sont en cache et toujours valides
  if (
    cache.data[cacheKey] && 
    cache.timestamps[cacheKey] && 
    now - cache.timestamps[cacheKey] < CACHE_DURATION
  ) {
    console.log(`Using cached data for: ${endpoint}`);
    return cache.data[cacheKey];
  }
  
  // Sinon, faire la requête
  const response = await api.get(endpoint, options);
  
  // Mettre en cache
  cache.data[cacheKey] = response.data;
  cache.timestamps[cacheKey] = now;
  
  return response.data;
};

// Fonction pour invalider le cache
const invalidateCache = (endpoint = null) => {
  if (endpoint) {
    // Invalider seulement les entrées qui commencent par cet endpoint
    Object.keys(cache.data).forEach(key => {
      if (key.startsWith(endpoint)) {
        delete cache.data[key];
        delete cache.timestamps[key];
      }
    });
    console.log(`Cache invalidated for: ${endpoint}`);
  } else {
    // Invalider tout le cache
    cache.data = {};
    cache.timestamps = {};
    console.log('Entire cache invalidated');
  }
};

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si le token est expiré ou invalide (401), déconnectez l'utilisateur
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Service d'authentification
const authService = {
  // Connecter un utilisateur
  login: async (username, password) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, {
        username,
        password
      });
      // Vider le cache lors de la connexion
      invalidateCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Inscrire un nouvel utilisateur
  register: async (userData) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
      // Vider le cache lors de l'inscription
      invalidateCache();
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Récupérer les informations de l'utilisateur connecté
  getCurrentUser: async () => {
    try {
      return await fetchWithCache(ENDPOINTS.AUTH.ME);
    } catch (error) {
      throw error;
    }
  },
  
  // Déconnecter l'utilisateur
  logout: async () => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGOUT);
      localStorage.removeItem('token');
      // Vider le cache lors de la déconnexion
      invalidateCache();
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      invalidateCache();
      throw error;
    }
  }
};

export default authService;
export { api, fetchWithCache, invalidateCache }; // Exporter les utilitaires de cache