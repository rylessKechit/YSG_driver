// src/services/performanceService.js
import { api, fetchWithCache } from './authService';
import { ENDPOINTS } from '../config';

// Ajout des endpoints pour les données de performance
const PERFORMANCE_ENDPOINTS = {
  PREPARATOR_PERFORMANCE: '/analytics/preparator-performance',
  TASK_METRICS: '/analytics/task-metrics',
  DAILY_METRICS: '/analytics/daily-metrics',
  COMPARATIVE_METRICS: '/analytics/comparative-metrics'
};

const performanceService = {
  // Récupérer les données de performance pour les préparateurs sélectionnés
  getPreparatorsPerformance: async (preparatorIds, startDate, endDate) => {
    try {
      // Construire l'URL avec les paramètres
      const preparatorParam = preparatorIds.map(id => `preparatorIds=${id}`).join('&');
      const url = `${PERFORMANCE_ENDPOINTS.PREPARATOR_PERFORMANCE}?${preparatorParam}&startDate=${startDate}&endDate=${endDate}`;
      
      // Dans un environnement réel, on ferait un appel API
      // const response = await api.get(url);
      // return response.data;
      
      // Pour les besoins de la démonstration, générer des données de simulation
      return generateSimulatedPerformanceData(preparatorIds, startDate, endDate);
    } catch (error) {
      console.error('Erreur lors de la récupération des données de performance:', error);
      throw error;
    }
  }
};

// Fonction pour générer des données simulées
const generateSimulatedPerformanceData = (preparatorIds, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  // Données individuelles pour chaque préparateur
  const preparatorsData = preparatorIds.map(id => {
    // Génération de données aléatoires pour chaque préparateur
    const baseCompletionTime = Math.floor(Math.random() * 30) + 40; // 40-70 minutes
    
    return {
      preparatorId: id,
      metrics: {
        totalPreparations: Math.floor(Math.random() * daysDiff * 2) + daysDiff,
        avgCompletionTime: baseCompletionTime,
        completedPreparations: Math.floor(Math.random() * daysDiff * 1.5) + daysDiff * 0.5,
        pendingPreparations: Math.floor(Math.random() * 5),
        taskMetrics: {
          exteriorWashing: {
            avgTime: Math.floor(Math.random() * 5) + 10, // 10-15 minutes
            count: Math.floor(Math.random() * daysDiff * 1.5) + daysDiff
          },
          interiorCleaning: {
            avgTime: Math.floor(Math.random() * 8) + 12, // 12-20 minutes
            count: Math.floor(Math.random() * daysDiff * 1.5) + daysDiff
          },
          refueling: {
            avgTime: Math.floor(Math.random() * 3) + 5, // 5-8 minutes
            count: Math.floor(Math.random() * daysDiff * 1.5) + daysDiff
          },
          parking: {
            avgTime: Math.floor(Math.random() * 2) + 3, // 3-5 minutes
            count: Math.floor(Math.random() * daysDiff * 1.5) + daysDiff
          }
        },
        dailyPreparations: Array.from({ length: daysDiff }, (_, i) => {
          const currentDate = new Date(start);
          currentDate.setDate(start.getDate() + i);
          
          return {
            date: currentDate.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 4) + 1 // 1-4 préparations par jour
          };
        })
      }
    };
  });
  
  // Calculer les statistiques globales
  const overallMetrics = {
    avgPreparationsPerDay: preparatorsData.reduce((sum, p) => 
      sum + p.metrics.totalPreparations / daysDiff, 0) / preparatorsData.length,
    avgCompletionTime: preparatorsData.reduce((sum, p) => 
      sum + p.metrics.avgCompletionTime, 0) / preparatorsData.length,
    totalPreparations: preparatorsData.reduce((sum, p) => 
      sum + p.metrics.totalPreparations, 0),
    bestPerformer: {
      id: preparatorsData.sort((a, b) => 
        a.metrics.avgCompletionTime - b.metrics.avgCompletionTime)[0]?.preparatorId,
      time: preparatorsData.sort((a, b) => 
        a.metrics.avgCompletionTime - b.metrics.avgCompletionTime)[0]?.metrics.avgCompletionTime
    }
  };
  
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