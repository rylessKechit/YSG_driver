// src/services/movementService.js
import { api } from './authService';
import { ENDPOINTS } from '../config';

const movementService = {
  // Créer un nouveau mouvement (admin seulement)
  createMovement: async (movementData) => {
    try {
      const response = await api.post(ENDPOINTS.MOVEMENTS.BASE, movementData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir les chauffeurs en service (admin seulement)
  getDriversOnDuty: async () => {
    try {
      const response = await api.get(`${ENDPOINTS.MOVEMENTS.BASE}/drivers-on-duty`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Démarrer un mouvement (chauffeur)
  startMovement: async (movementId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/start`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Terminer un mouvement (chauffeur)
  completeMovement: async (movementId, notes) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/complete`, { notes });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Annuler un mouvement (admin seulement)
  cancelMovement: async (movementId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/cancel`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Réassigner un mouvement (admin seulement)
  reassignMovement: async (movementId, userId) => {
    try {
      const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/reassign`, { userId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Uploader des photos
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
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir tous les mouvements
  getMovements: async (page = 1, limit = 10, status = null) => {
    try {
      let url = `${ENDPOINTS.MOVEMENTS.BASE}?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir un mouvement spécifique
  getMovement: async (movementId) => {
    try {
      const response = await api.get(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Rechercher des mouvements par plaque d'immatriculation
  searchByLicensePlate: async (licensePlate) => {
    try {
      const response = await api.get(`${ENDPOINTS.MOVEMENTS.BASE}/search?licensePlate=${licensePlate}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default movementService;