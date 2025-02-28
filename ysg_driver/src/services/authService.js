import axios from 'axios';
import { API_URL, ENDPOINTS } from '../config';

// Configuration d'Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Inscrire un nouvel utilisateur
  register: async (userData) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Récupérer les informations de l'utilisateur connecté
  getCurrentUser: async () => {
    try {
      const response = await api.get(ENDPOINTS.AUTH.ME);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Déconnecter l'utilisateur
  logout: async () => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGOUT);
      localStorage.removeItem('token');
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  }
};

export default authService;
export { api }; // Exporter l'instance axios configurée pour être utilisée par d'autres services