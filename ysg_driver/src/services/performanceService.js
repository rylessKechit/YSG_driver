// src/services/performanceService.js
import { api, fetchWithCache } from './authService';
import { ENDPOINTS } from '../config';

// Endpoints pour les données de performance
const PERFORMANCE_ENDPOINTS = {
  PREPARATOR_PERFORMANCE: '/api/analytics/preparator-performance',
  TASK_METRICS: '/api/analytics/task-metrics',
  DAILY_METRICS: '/api/analytics/daily-metrics',
  COMPARATIVE_METRICS: '/api/analytics/comparative-metrics',
  GLOBAL_METRICS: '/api/analytics/global-metrics'
};

const performanceService = {
  // Récupérer les données de performance pour les préparateurs sélectionnés
  getPreparatorsPerformance: async (preparatorIds, startDate, endDate) => {
    try {
      // Construire l'URL avec les paramètres
      let url = PERFORMANCE_ENDPOINTS.COMPARATIVE_METRICS;
      
      // Paramètres de la requête
      const params = new URLSearchParams();
      
      // Ajouter les ID des préparateurs comme userIds
      if (preparatorIds && preparatorIds.length > 0) {
        preparatorIds.forEach(id => params.append('userIds', id));
      }
      
      // Ajouter les dates
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      // Ajouter les paramètres à l'URL
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Faire l'appel API avec authentification
      const response = await api.get(url);
      
      // Formater les données reçues pour les adapter au format attendu par les composants
      return formatPerformanceData(response.data, preparatorIds, startDate, endDate);
    } catch (error) {
      console.error('Erreur lors de la récupération des données de performance:', error);
      throw error;
    }
  },
  
  // Récupérer les métriques générales
  getGlobalMetrics: async (startDate, endDate) => {
    try {
      let url = PERFORMANCE_ENDPOINTS.GLOBAL_METRICS;
      
      // Paramètres de la requête
      const params = new URLSearchParams();
      
      // Ajouter les dates
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      // Ajouter les paramètres à l'URL
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Faire l'appel API
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques globales:', error);
      throw error;
    }
  },
  
  // Récupérer les métriques quotidiennes
  getDailyMetrics: async (userId, startDate, endDate) => {
    try {
      let url = PERFORMANCE_ENDPOINTS.DAILY_METRICS;
      
      // Paramètres de la requête
      const params = new URLSearchParams();
      
      // Ajouter l'ID de l'utilisateur
      if (userId) params.append('userId', userId);
      
      // Ajouter les dates
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      // Ajouter les paramètres à l'URL
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Faire l'appel API
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques quotidiennes:', error);
      throw error;
    }
  },
  
  // Récupérer les métriques par type de tâche
  getTaskMetrics: async (taskType, userId, startDate, endDate) => {
    try {
      let url = `${PERFORMANCE_ENDPOINTS.TASK_METRICS}/${taskType}`;
      
      // Paramètres de la requête
      const params = new URLSearchParams();
      
      // Ajouter l'ID de l'utilisateur
      if (userId) params.append('userId', userId);
      
      // Ajouter les dates
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      // Ajouter les paramètres à l'URL
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Faire l'appel API
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des métriques pour le type de tâche ${taskType}:`, error);
      throw error;
    }
  }
};

// Fonction pour formater les données de l'API vers le format attendu par les composants
const formatPerformanceData = (apiData, preparatorIds, startDate, endDate) => {
  // Extraction des données pertinentes
  const { comparativeData, globalMetrics } = apiData;
  
  // Calculer la période en jours
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
  
  // Formater les données des préparateurs
  const preparatorsData = comparativeData.map(prep => {
    // Données de métriques pour ce préparateur
    const metrics = prep.metrics;
    
    // Construire les métriques de tâches
    const taskMetrics = {
      exteriorWashing: {
        count: metrics.taskMetrics.exteriorWashing?.count || 0,
        avgTime: metrics.taskMetrics.exteriorWashing?.averageDuration || 0
      },
      interiorCleaning: {
        count: metrics.taskMetrics.interiorCleaning?.count || 0,
        avgTime: metrics.taskMetrics.interiorCleaning?.averageDuration || 0
      },
      refueling: {
        count: metrics.taskMetrics.refueling?.count || 0,
        avgTime: metrics.taskMetrics.refueling?.averageDuration || 0
      },
      parking: {
        count: metrics.taskMetrics.parking?.count || 0,
        avgTime: metrics.taskMetrics.parking?.averageDuration || 0
      }
    };
    
    // Construire les données quotidiennes (déduites des tendances si non disponibles)
    const periodData = metrics.periodMetrics?.daily || [];
    
    // Format final pour ce préparateur
    return {
      preparatorId: prep.userId,
      metrics: {
        totalPreparations: metrics.totalPreparations || 0,
        completedPreparations: metrics.completedPreparations || 0,
        avgCompletionTime: Math.round(metrics.averageCompletionTime || 0),
        taskMetrics: taskMetrics,
        // Données quotidiennes (formatées pour le graphique)
        dailyPreparations: periodData.map(day => ({
          date: day.date.split('T')[0],
          count: day.totalPreparations || 0
        }))
      }
    };
  });
  
  // Format global attendu
  return {
    period: {
      startDate,
      endDate,
      days: daysDiff
    },
    overallMetrics: {
      avgPreparationsPerDay: globalMetrics.averagePreparationsPerDay || 0,
      avgCompletionTime: globalMetrics.averageCompletionTime || 0,
      totalPreparations: globalMetrics.totalPreparations || 0,
      bestPerformer: {
        id: globalMetrics.topPerformer?.userId || '',
        time: globalMetrics.topPerformer?.performanceScore || 0
      }
    },
    preparatorsData
  };
};

export default performanceService;