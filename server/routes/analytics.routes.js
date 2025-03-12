// server/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const performanceReportsController = require('../controllers/performanceReports.controller');
const { verifyToken, canAccessReports } = require('../middleware/auth.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// Middleware pour vérifier si l'utilisateur peut accéder aux données d'analyse
// Réutilisation du middleware existant "canAccessReports" pour les rôles admin et direction

// Route pour récupérer les performances d'un préparateur spécifique
router.get('/preparator-performance/:userId', verifyToken, canAccessReports, cacheMiddleware(600), analyticsController.getPreparatorPerformance);

// Route pour récupérer les métriques spécifiques à un type de tâche
router.get('/task-metrics/:taskType', verifyToken, canAccessReports, cacheMiddleware(900), analyticsController.getTaskMetrics);

// Route pour récupérer les métriques quotidiennes (d'un ou tous les préparateurs)
router.get('/daily-metrics', verifyToken, canAccessReports, cacheMiddleware(600), analyticsController.getDailyMetrics);

// Route pour comparer les performances entre préparateurs
router.get('/comparative-metrics', verifyToken, canAccessReports, cacheMiddleware(300), analyticsController.comparePreparators);

// Route pour récupérer les métriques globales
router.get('/global-metrics', verifyToken, canAccessReports, cacheMiddleware(600), analyticsController.getGlobalMetrics);

// Routes pour générer des rapports
router.get('/reports/weekly', verifyToken, canAccessReports, performanceReportsController.generateWeeklyReport);
router.get('/reports/monthly', verifyToken, canAccessReports, performanceReportsController.generateMonthlyReport);

module.exports = router;