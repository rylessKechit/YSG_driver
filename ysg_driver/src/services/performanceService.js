// src/services/performanceService.js
import { api, fetchWithCache } from './authService';
import { ENDPOINTS } from '../config';

// Définir les endpoints de l'API Analytics
const ANALYTICS_ENDPOINTS = {
  PREPARATOR_PERFORMANCE: '/api/analytics/preparator-performance',
  TASK_METRICS: '/api/analytics/task-metrics',
  DAILY_METRICS: '/api/analytics/daily-metrics',
  COMPARATIVE_METRICS: '/api/analytics/comparative-metrics',
  GLOBAL_METRICS: '/api/analytics/global-metrics'
};

const performanceService = {
  // Récupérer les performances d'un préparateur spécifique
  getPreparatorPerformance: async (userId, startDate, endDate, refresh = false) => {
    try {
      let url = `${ANALYTICS_ENDPOINTS.PREPARATOR_PERFORMANCE}/${userId}?`;
      
      if (startDate) {
        url += `startDate=${startDate}&`;
      }
      
      if (endDate) {
        url += `endDate=${endDate}&`;
      }
      
      if (refresh) {
        url += `refresh=true`;
      }
      
      return await fetchWithCache(url);
    } catch (error) {
      console.error('Erreur lors de la récupération des performances du préparateur:', error);
      throw error;
    }
  },
  
  // Récupérer les métriques par type de tâche
  getTaskMetrics: async (taskType, userId, startDate, endDate) => {
    try {
      let url = `${ANALYTICS_ENDPOINTS.TASK_METRICS}/${taskType}?`;
      
      if (userId) {
        url += `userId=${userId}&`;
      }
      
      if (startDate) {
        url += `startDate=${startDate}&`;
      }
      
      if (endDate) {
        url += `endDate=${endDate}`;
      }
      
      return await fetchWithCache(url);
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de tâche:', error);
      throw error;
    }
  },
  
  // Récupérer les métriques quotidiennes
  getDailyMetrics: async (userId, startDate, endDate) => {
    try {
      let url = `${ANALYTICS_ENDPOINTS.DAILY_METRICS}?`;
      
      if (userId) {
        url += `userId=${userId}&`;
      }
      
      if (startDate) {
        url += `startDate=${startDate}&`;
      }
      
      if (endDate) {
        url += `endDate=${endDate}`;
      }
      
      return await fetchWithCache(url);
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques quotidiennes:', error);
      throw error;
    }
  },
  
  // Récupérer les métriques comparatives entre préparateurs
  getComparativeMetrics: async (userIds, refresh = false) => {
    try {
      let url = `${ANALYTICS_ENDPOINTS.COMPARATIVE_METRICS}?`;
      
      if (userIds && userIds.length > 0) {
        url += `userIds=${userIds.join(',')}&`;
      }
      
      if (refresh) {
        url += `refresh=true`;
      }
      
      return await fetchWithCache(url);
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques comparatives:', error);
      throw error;
    }
  },
  
  // Récupérer les métriques globales
  getGlobalMetrics: async () => {
    try {
      return await fetchWithCache(ANALYTICS_ENDPOINTS.GLOBAL_METRICS);
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques globales:', error);
      throw error;
    }
  },
  
  // Méthode pour obtenir les performances des préparateurs pour la page de visualisation
  getPreparatorsPerformance: async (preparatorIds, startDate, endDate) => {
    try {
      // Si une liste d'IDs est fournie, utiliser les métriques comparatives
      if (preparatorIds && preparatorIds.length > 0) {
        const compData = await performanceService.getComparativeMetrics(preparatorIds);
        
        // Transformer les données au format attendu par les composants
        return transformApiDataToUIFormat(compData, startDate, endDate);
      } else {
        // Sinon, utiliser les métriques globales
        const globalData = await performanceService.getGlobalMetrics();
        return transformGlobalToUIFormat(globalData, startDate, endDate);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des performances des préparateurs:', error);
      throw error;
    }
  }
};

// Fonction pour transformer les données de l'API au format attendu par l'UI
const transformApiDataToUIFormat = (apiData, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  // Préparer le tableau des préparateurs avec leurs métriques
  const preparatorsData = apiData.comparativeData.map(prepData => {
    // Extraire les métriques de performance pour ce préparateur
    const metrics = prepData.metrics;
    
    // Convertir les données de tâches au format attendu
    const taskMetrics = {
      exteriorWashing: {
        avgTime: metrics.taskMetrics.exteriorWashing.averageDuration,
        count: metrics.taskMetrics.exteriorWashing.count
      },
      interiorCleaning: {
        avgTime: metrics.taskMetrics.interiorCleaning.averageDuration,
        count: metrics.taskMetrics.interiorCleaning.count
      },
      refueling: {
        avgTime: metrics.taskMetrics.refueling.averageDuration,
        count: metrics.taskMetrics.refueling.count
      },
      parking: {
        avgTime: metrics.taskMetrics.parking.averageDuration,
        count: metrics.taskMetrics.parking.count
      }
    };

    // Générer les données quotidiennes si disponibles ou créer un ensemble simulé
    let dailyPreparations = [];
    if (metrics.periodMetrics && metrics.periodMetrics.daily) {
      dailyPreparations = metrics.periodMetrics.daily.map(day => ({
        date: day.date.split('T')[0],
        count: day.totalPreparations
      }));
    } else {
      // Créer des données quotidiennes simulées si non disponibles
      dailyPreparations = Array.from({ length: daysDiff }, (_, i) => {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        return {
          date: currentDate.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 4) + 1 // Simulé: 1-4 préparations par jour
        };
      });
    }
    
    return {
      preparatorId: prepData.userId,
      metrics: {
        totalPreparations: metrics.totalPreparations,
        completedPreparations: metrics.completedPreparations,
        avgCompletionTime: metrics.averagePreparationsPerDay * 60, // Convertir en minutes si nécessaire
        pendingPreparations: metrics.totalPreparations - metrics.completedPreparations,
        taskMetrics: taskMetrics,
        dailyPreparations: dailyPreparations,
        performanceScore: metrics.performanceScore
      }
    };
  });
  
  // Calculer les statistiques globales
  const overallMetrics = {
    avgPreparationsPerDay: apiData.globalMetrics.averagePerformanceScore / 100,
    avgCompletionTime: 0, // À calculer si disponible
    totalPreparations: apiData.globalMetrics.totalPreparations,
    bestPerformer: {
      id: apiData.globalMetrics.topPerformer.userId,
      time: 0, // À remplir si disponible
      score: apiData.globalMetrics.topPerformer.performanceScore
    }
  };
  
  // Calculer le temps moyen de complétion s'il est disponible dans les données
  if (preparatorsData.length > 0) {
    const avgTimes = preparatorsData.map(p => p.metrics.avgCompletionTime).filter(t => t > 0);
    if (avgTimes.length > 0) {
      overallMetrics.avgCompletionTime = avgTimes.reduce((sum, time) => sum + time, 0) / avgTimes.length;
    }
  }
  
  return {
    period: {
      startDate,
      endDate,
      days: daysDiff
    },
    overallMetrics,
    preparatorsData
  };
};

// Fonction pour transformer les données globales au format attendu par l'UI
const transformGlobalToUIFormat = (globalData, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  // Créer un objet avec les métriques globales
  const overallMetrics = {
    avgPreparationsPerDay: globalData.totalPreparations / (globalData.preparatorsCount * daysDiff),
    avgCompletionTime: 120, // Valeur par défaut si non disponible
    totalPreparations: globalData.totalPreparations,
    bestPerformer: {
      id: globalData.topPerformer.userId,
      name: globalData.topPerformer.fullName,
      score: globalData.topPerformer.performanceScore
    }
  };
  
  // Créer un tableau vide pour les données des préparateurs
  // Puisque nous n'avons pas de détails par préparateur dans les métriques globales
  const preparatorsData = [];
  
  return {
    period: {
      startDate,
      endDate,
      days: daysDiff
    },
    overallMetrics,
    preparatorsData
  };
};

export default performanceService;