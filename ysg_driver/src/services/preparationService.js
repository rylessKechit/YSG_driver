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
  
  // NOUVELLE MÉTHODE: Démarrer une tâche avec photo "before"
  startTask: async (preparationId, taskType, photo, notes) => {
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      if (notes) formData.append('notes', notes);
      
      const response = await api.post(
        `${ENDPOINTS.PREPARATIONS.DETAIL(preparationId)}/tasks/${taskType}/start`,
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
  
  // NOUVELLE MÉTHODE: Terminer une tâche avec photo "after"
  completeTask: async (preparationId, taskType, photo, additionalData = {}) => {
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      
      // Ajouter les données supplémentaires
      Object.keys(additionalData).forEach(key => {
        if (additionalData[key] !== null && additionalData[key] !== undefined) {
          if (typeof additionalData[key] === 'object') {
            formData.append(key, JSON.stringify(additionalData[key]));
          } else {
            formData.append(key, additionalData[key]);
          }
        }
      });
      
      const response = await api.post(
        `${ENDPOINTS.PREPARATIONS.DETAIL(preparationId)}/tasks/${taskType}/complete`,
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
  
  // NOUVELLE MÉTHODE: Ajouter une photo additionnelle à une tâche
  addTaskPhoto: async (preparationId, taskType, photo, description) => {
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      if (description) formData.append('description', description);
      
      const response = await api.post(
        `${ENDPOINTS.PREPARATIONS.DETAIL(preparationId)}/tasks/${taskType}/photos`,
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
  
  // Terminer une préparation
  completePreparation: async (preparationId, data) => {
    try {
      const response = await api.put(`${ENDPOINTS.PREPARATIONS.DETAIL(preparationId)}/complete`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Uploader des photos pour une préparation (dommages, etc.)
  uploadPhotos: async (preparationId, photos, type = 'other') => {
    try {
      const formData = new FormData();
      
      // Si photos est un tableau de fichiers
      if (Array.isArray(photos)) {
        photos.forEach(photo => {
          formData.append('photos', photo);
        });
      } else {
        // Si c'est un seul fichier
        formData.append('photos', photos);
      }
      
      formData.append('type', type);
      
      const response = await api.post(
        `${ENDPOINTS.PREPARATIONS.DETAIL(preparationId)}/photos`,
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
  getPreparations: async (page = 1, limit = 10, status = null, day = null) => {
    try {
      let url = `${ENDPOINTS.PREPARATIONS.BASE}?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      // Ajouter le paramètre day s'il est fourni (today)
      if (day) {
        url += `&day=${day}`;
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