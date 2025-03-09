// src/services/userService.js
import { api, fetchWithCache, invalidateCache } from './authService';
import { ENDPOINTS } from '../config';

const userService = {
  // Obtenir le profil de l'utilisateur avec cache
  getProfile: async () => {
    try {
      return await fetchWithCache(`${ENDPOINTS.USERS.BASE}/profile`);
    } catch (error) {
      throw error;
    }
  },
  
  // Mettre à jour le profil de l'utilisateur
  updateProfile: async (profileData) => {
    try {
      const response = await api.put(`${ENDPOINTS.USERS.BASE}/profile`, profileData);
      // Invalider le cache du profil
      invalidateCache(`${ENDPOINTS.USERS.BASE}/profile`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Changer le mot de passe
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put(`${ENDPOINTS.USERS.BASE}/change-password`, {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // --- Méthodes administratives ---
  
  // Obtenir tous les utilisateurs (admin seulement) avec cache
  getAllUsers: async () => {
    try {
      return await fetchWithCache(ENDPOINTS.USERS.BASE);
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir un utilisateur par ID (admin seulement) avec cache
  getUserById: async (userId) => {
    try {
      return await fetchWithCache(ENDPOINTS.USERS.DETAIL(userId));
    } catch (error) {
      throw error;
    }
  },
  
  // Créer un nouvel utilisateur (admin seulement)
  createUser: async (userData) => {
    try {
      const response = await api.post(ENDPOINTS.USERS.BASE, userData);
      // Invalider le cache des utilisateurs
      invalidateCache(ENDPOINTS.USERS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Mettre à jour un utilisateur (admin seulement)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(ENDPOINTS.USERS.DETAIL(userId), userData);
      // Invalider le cache des utilisateurs et de l'utilisateur spécifique
      invalidateCache(ENDPOINTS.USERS.BASE);
      invalidateCache(ENDPOINTS.USERS.DETAIL(userId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Supprimer un utilisateur (admin seulement)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(ENDPOINTS.USERS.DETAIL(userId));
      // Invalider le cache des utilisateurs
      invalidateCache(ENDPOINTS.USERS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userService;