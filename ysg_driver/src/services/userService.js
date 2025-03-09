// src/services/userService.js
import { api, fetchWithCache, invalidateCache } from './authService';
import { ENDPOINTS, API_URL } from '../config';

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
  // Remplacez la fonction getAllUsers dans src/services/userService.js par cette version améliorée

  // Obtenir tous les utilisateurs (admin seulement) avec cache
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
      
      // Tenter de récupérer les données avec le cache
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