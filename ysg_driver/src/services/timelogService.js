// src/services/timelogService.js
import { api, fetchWithCache, invalidateCache } from './authService';
import { ENDPOINTS } from '../config';

const timelogService = {
  // Démarrer un pointage
  startTimeLog: async (data) => {
    try {
      // Assurez-vous que les données sont correctement structurées
      const payload = {
        location: data.location || {
          name: 'Position non disponible',
          coordinates: { latitude: null, longitude: null }
        }
      };
      
      console.log('Envoi des données au serveur:', payload);
      
      const response = await api.post(`${ENDPOINTS.TIMELOGS.BASE}/start`, payload);
      return response.data;
    } catch (error) {
      console.error('Erreur dans le service timeLog (start):', error);
      throw error;
    }
  },
  
  // Terminer un pointage - Implémentation du service
  endTimeLog: async (locationData, notes) => {
    try {
      // Assurez-vous que les données sont correctement structurées
      const payload = {
        location: locationData || {
          name: 'Position non disponible',
          coordinates: { latitude: null, longitude: null }
        },
        notes: notes || ''
      };
      
      console.log('Envoi des données au serveur pour terminer:', payload);
      
      const response = await api.post(`${ENDPOINTS.TIMELOGS.BASE}/end`, payload);
      return response.data;
    } catch (error) {
      console.error('Erreur dans le service timeLog (end):', error);
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