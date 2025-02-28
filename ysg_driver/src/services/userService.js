import { api } from './authService';
import { ENDPOINTS } from '../config';

const userService = {
  // Obtenir le profil de l'utilisateur
  getProfile: async () => {
    try {
      const response = await api.get(`${ENDPOINTS.USERS.BASE}/profile`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Mettre à jour le profil de l'utilisateur
  updateProfile: async (profileData) => {
    try {
      const response = await api.put(`${ENDPOINTS.USERS.BASE}/profile`, profileData);
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
  
  // Obtenir tous les utilisateurs (admin seulement)
  getAllUsers: async () => {
    try {
      const response = await api.get(ENDPOINTS.USERS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir un utilisateur par ID (admin seulement)
  getUserById: async (userId) => {
    try {
      const response = await api.get(ENDPOINTS.USERS.DETAIL(userId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Créer un nouvel utilisateur (admin seulement)
  createUser: async (userData) => {
    try {
      const response = await api.post(ENDPOINTS.USERS.BASE, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Mettre à jour un utilisateur (admin seulement)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(ENDPOINTS.USERS.DETAIL(userId), userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Supprimer un utilisateur (admin seulement)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(ENDPOINTS.USERS.DETAIL(userId));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userService;