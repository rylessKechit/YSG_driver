// src/services/timelogService.js
import { api, fetchWithCache, invalidateCache } from './authService';
import { ENDPOINTS } from '../config';

const timelogService = {
  // Démarrer un pointage
  startTimeLog: async (locationData) => {
    try {
      const response = await api.post(`${ENDPOINTS.TIMELOGS.BASE}/start`, {
        location: locationData
      });
      // Invalider le cache des pointages
      invalidateCache(ENDPOINTS.TIMELOGS.BASE);
      invalidateCache(ENDPOINTS.TIMELOGS.ACTIVE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Terminer un pointage
  endTimeLog: async (locationData, notes) => {
    try {
      const response = await api.post(`${ENDPOINTS.TIMELOGS.BASE}/end`, {
        location: locationData,
        notes
      });
      // Invalider le cache des pointages
      invalidateCache(ENDPOINTS.TIMELOGS.BASE);
      invalidateCache(ENDPOINTS.TIMELOGS.ACTIVE);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Récupérer le pointage actif avec cache
  getActiveTimeLog: async () => {
    try {
      return await fetchWithCache(ENDPOINTS.TIMELOGS.ACTIVE);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null; // Aucun pointage actif
      }
      throw error;
    }
  },
  
  // Récupérer l'historique des pointages avec cache
  getTimeLogs: async (page = 1, limit = 10, status = null) => {
    try {
      let url = `${ENDPOINTS.TIMELOGS.BASE}?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      console.log('Récupération des pointages:', url);
      
      // Pour les pointages récents, ne pas utiliser le cache pour avoir des données fraîches
      const response = await api.get(url);
      console.log('Réponse des pointages:', response.data);
      
      // Si les données ne contiennent pas la propriété timeLogs, ajustez le format
      if (response.data && !response.data.timeLogs && Array.isArray(response.data)) {
        return { timeLogs: response.data, totalPages: 1 };
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des pointages:', error);
      throw error;
    }
  }
};

export default timelogService;