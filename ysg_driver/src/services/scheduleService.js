// src/services/scheduleService.js
import { api, fetchWithCache, invalidateCache } from './authService';
import { ENDPOINTS } from '../config';

const scheduleService = {
  // Obtenir tous les préparateurs avec cache
  getPreparators: async () => {
    try {
      return await fetchWithCache(ENDPOINTS.SCHEDULES.PREPARATORS);
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir le planning d'un utilisateur avec cache
  getUserSchedule: async (userId) => {
    try {
      return await fetchWithCache(ENDPOINTS.SCHEDULES.USER(userId));
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir le planning complet de tous les préparateurs avec cache
  getAllSchedules: async () => {
    try {
      return await fetchWithCache(ENDPOINTS.SCHEDULES.ALL);
    } catch (error) {
      throw error;
    }
  },
  
  // Créer ou mettre à jour une entrée de planning
  saveScheduleEntry: async (entryData) => {
    try {
      const response = await api.post(ENDPOINTS.SCHEDULES.BASE, entryData);
      // Invalider les caches liés aux plannings
      invalidateCache(ENDPOINTS.SCHEDULES.BASE);
      invalidateCache(ENDPOINTS.SCHEDULES.ALL);
      if (entryData.userId) {
        invalidateCache(ENDPOINTS.SCHEDULES.USER(entryData.userId));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Supprimer une entrée de planning
  deleteScheduleEntry: async (entryId) => {
    try {
      const response = await api.delete(`${ENDPOINTS.SCHEDULES.BASE}/${entryId}`);
      // Invalider les caches liés aux plannings
      invalidateCache(ENDPOINTS.SCHEDULES.BASE);
      invalidateCache(ENDPOINTS.SCHEDULES.ALL);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default scheduleService;