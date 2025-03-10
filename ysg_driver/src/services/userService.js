// src/services/userService.js (sans système de cache)
import { api, fetchWithCache } from './authService';
import { ENDPOINTS } from '../config';

const userService = {
  // Obtenir le profil de l'utilisateur sans cache
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
  
  // Obtenir tous les utilisateurs (admin seulement) sans cache
  getAllUsers: async () => {
    try {
      // Log de l'URL complète pour vérification
      const url = ENDPOINTS.USERS.BASE;
      
      // Vérifier si le token est présent
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token manquant pour l\'authentification');
        throw new Error('Non authentifié - token manquant');
      }
      
      // Récupérer les données directement sans cache
      const data = await fetchWithCache(url);
      
      // Vérifier si les données sont valides
      if (!Array.isArray(data)) {
        console.error('Les données reçues ne sont pas un tableau:', data);
        return []; // Retourner un tableau vide plutôt que de planter
      }
      
      return data;
    } catch (error) {
      console.error('Erreur détaillée dans getAllUsers:', error);
      
      // Tenter d'extraire plus d'informations sur l'erreur
      let errorMessage = 'Une erreur s\'est produite lors de la récupération des utilisateurs';
      
      if (error.response) {
        console.error('Réponse d\'erreur du serveur:', error.response);
        errorMessage += ` - Statut: ${error.response.status}`;
        
        if (error.response.data && error.response.data.message) {
          errorMessage += ` - Message: ${error.response.data.message}`;
        }
      } else if (error.request) {
        console.error('Requête envoyée mais pas de réponse:', error.request);
        errorMessage += ' - Aucune réponse du serveur';
      } else {
        console.error('Erreur de configuration:', error.message);
        errorMessage += ` - ${error.message}`;
      }
      
      // Lancer une erreur plus descriptive
      throw new Error(errorMessage);
    }
  },
  
  // Obtenir un utilisateur par ID (admin seulement) sans cache
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