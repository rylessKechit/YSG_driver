// src/services/preparationService.js
import { api } from './authService';
import { ENDPOINTS } from '../config';

const preparationService = {
  // Créer une nouvelle préparation
  createPreparation: async (preparationData) => {
    try {
      const response = await api.post(ENDPOINTS.PREPARATIONS.BASE, preparationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir les préparateurs en service (admin seulement)
  getPreparatorsOnDuty: async () => {
    try {
      const response = await api.get(`${ENDPOINTS.PREPARATIONS.BASE}/preparators-on-duty`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Mettre à jour une tâche de préparation
  updateTask: async (preparationId, taskData) => {
    try {
      const response = await api.put(`${ENDPOINTS.PREPARATIONS.DETAIL(preparationId)}/tasks`, taskData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Terminer une préparation
  completePreparation: async (preparationId, data) => {
    try {
      const response = await api.put(`${ENDPOINTS.PREPARATIONS.DETAIL(preparationId)}/complete`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Uploader des photos pour une préparation
  uploadPhotos: async (preparationId, formData) => {
    try {
      const response = await api.post(
        `${ENDPOINTS.PREPARATIONS.PHOTOS(preparationId)}`,
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
  
  // Obtenir toutes les préparations
  getPreparations: async (page = 1, limit = 10, status = null) => {
    try {
      let url = `${ENDPOINTS.PREPARATIONS.BASE}?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir une préparation spécifique
  getPreparation: async (preparationId) => {
    try {
      const response = await api.get(ENDPOINTS.PREPARATIONS.DETAIL(preparationId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Rechercher des préparations par plaque d'immatriculation
  searchByLicensePlate: async (licensePlate) => {
    try {
      const response = await api.get(`${ENDPOINTS.PREPARATIONS.BASE}/search/plate?licensePlate=${licensePlate}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default preparationService;