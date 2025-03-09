// src/services/movementService.js
import { api, fetchWithCache, invalidateCache } from './authService';
import { ENDPOINTS } from '../config';

const movementService = {
  // Créer un nouveau mouvement (admin ou team-leader)
  createMovement: async (movementData) => {
    try {
      const response = await api.post(ENDPOINTS.MOVEMENTS.BASE, movementData);
      // Invalider le cache des mouvements
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir les chauffeurs en service (admin ou team-leader)
  getDriversOnDuty: async () => {
    try {
      return await fetchWithCache(`${ENDPOINTS.MOVEMENTS.BASE}/drivers-on-duty`);
    } catch (error) {
      throw error;
    }
  },

  // Obtenir tous les chauffeurs (en service ou non)
  getAllDrivers: async () => {
    try {
      return await fetchWithCache(`${ENDPOINTS.MOVEMENTS.BASE}/all-drivers`);
    } catch (error) {
      throw error;
    }
  },

  // Commencer la préparation d'un mouvement
  prepareMovement: async (movementId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/prepare`);
      // Invalider le cache du mouvement spécifique et de la liste
      invalidateCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Démarrer un mouvement (chauffeur)
  startMovement: async (movementId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/start`);
      // Invalider le cache du mouvement spécifique et de la liste
      invalidateCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Terminer un mouvement (chauffeur)
  completeMovement: async (movementId, notesData) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/complete`, notesData);
      // Invalider le cache du mouvement spécifique et de la liste
      invalidateCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Annuler un mouvement (admin ou team-leader)
  cancelMovement: async (movementId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/cancel`);
      // Invalider le cache du mouvement spécifique et de la liste
      invalidateCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Réassigner un mouvement (admin ou team-leader)
  reassignMovement: async (movementId, userId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/reassign`, { userId });
      // Invalider le cache du mouvement spécifique et de la liste
      invalidateCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Uploader des photos (avec support pour photoType: 'departure' ou 'arrival')
  uploadPhotos: async (movementId, formData) => {
    try {
      const response = await api.post(
        `${ENDPOINTS.MOVEMENTS.PHOTOS(movementId)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      // Invalider le cache du mouvement spécifique
      invalidateCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir tous les mouvements avec cache
  getMovements: async (page = 1, limit = 10, status = null) => {
    try {
      let url = `${ENDPOINTS.MOVEMENTS.BASE}?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      return await fetchWithCache(url);
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir un mouvement spécifique avec cache
  getMovement: async (movementId) => {
    try {
      return await fetchWithCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
    } catch (error) {
      throw error;
    }
  },
  
  // Rechercher des mouvements par plaque d'immatriculation avec cache
  searchByLicensePlate: async (licensePlate) => {
    try {
      return await fetchWithCache(`${ENDPOINTS.MOVEMENTS.BASE}/search?licensePlate=${licensePlate}`);
    } catch (error) {
      throw error;
    }
  },

  // Assigner un chauffeur à un mouvement
  assignDriver: async (movementId, driverId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/assign`, { userId: driverId });
      // Invalider le cache du mouvement spécifique et de la liste
      invalidateCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Supprimer un mouvement
  deleteMovement: async (movementId) => {
    try {
      const response = await api.delete(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      // Invalider le cache de la liste des mouvements
      invalidateCache(ENDPOINTS.MOVEMENTS.BASE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default movementService;