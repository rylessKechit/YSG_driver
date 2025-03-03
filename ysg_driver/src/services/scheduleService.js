// src/services/scheduleService.js
import { api } from './authService';
import { ENDPOINTS } from '../config';

const scheduleService = {
  // Obtenir tous les préparateurs
  getPreparators: async () => {
    try {
      const response = await api.get(ENDPOINTS.SCHEDULES.PREPARATORS);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir le planning d'un utilisateur
  getUserSchedule: async (userId) => {
    try {
      const response = await api.get(ENDPOINTS.SCHEDULES.USER(userId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtenir le planning complet de tous les préparateurs
  getAllSchedules: async () => {
    try {
      const response = await api.get(ENDPOINTS.SCHEDULES.ALL);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Créer ou mettre à jour une entrée de planning
  saveScheduleEntry: async (entryData) => {
    try {
      const response = await api.post(ENDPOINTS.SCHEDULES.BASE, entryData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Supprimer une entrée de planning
  deleteScheduleEntry: async (entryId) => {
    try {
      const response = await api.delete(`${ENDPOINTS.SCHEDULES.BASE}/${entryId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default scheduleService;