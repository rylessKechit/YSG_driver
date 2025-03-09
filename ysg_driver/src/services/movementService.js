// src/services/movementService.js
import { api, fetchWithCache, cache } from './authService';
import { ENDPOINTS } from '../config';

// Fonctions auxiliaires
const clearMovementsCache = (movementId = null) => {
  // Invalider le cache pour un mouvement spécifique ou tous les mouvements
  cache.clear(ENDPOINTS.MOVEMENTS.BASE);
  if (movementId) {
    cache.clear(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
  }
};

// Service des mouvements
const movementService = {
  // OBTENIR DES DONNÉES
  
  // Récupérer tous les mouvements
  getMovements: async (page = 1, limit = 10, status = null) => {
    let url = `${ENDPOINTS.MOVEMENTS.BASE}?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    
    return fetchWithCache(url);
  },
  
  // Récupérer un mouvement spécifique
  getMovement: async (movementId) => {
    return fetchWithCache(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
  },
  
  // Rechercher des mouvements par plaque
  searchByLicensePlate: async (licensePlate) => {
    return fetchWithCache(`${ENDPOINTS.MOVEMENTS.BASE}/search?licensePlate=${licensePlate}`);
  },
  
  // Récupérer les chauffeurs en service
  getDriversOnDuty: async () => {
    return fetchWithCache(`${ENDPOINTS.MOVEMENTS.BASE}/drivers-on-duty`);
  },
  
  // Récupérer tous les chauffeurs
  getAllDrivers: async () => {
    return fetchWithCache(`${ENDPOINTS.MOVEMENTS.BASE}/all-drivers`);
  },
  
  // MODIFICATIONS
  
  // Créer un nouveau mouvement
  createMovement: async (movementData) => {
    const response = await api.post(ENDPOINTS.MOVEMENTS.BASE, movementData);
    clearMovementsCache();
    return response.data;
  },
  
  // Assigner un chauffeur
  assignDriver: async (movementId, driverId) => {
    const response = await api.post(
      `${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/assign`, 
      { userId: driverId }
    );
    clearMovementsCache(movementId);
    return response.data;
  },
  
  // Préparer un mouvement
  prepareMovement: async (movementId) => {
    const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/prepare`);
    clearMovementsCache(movementId);
    return response.data;
  },
  
  // Démarrer un mouvement
  startMovement: async (movementId) => {
    const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/start`);
    clearMovementsCache(movementId);
    return response.data;
  },
  
  // Terminer un mouvement
  completeMovement: async (movementId, notesData) => {
    const response = await api.post(
      `${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/complete`, 
      notesData
    );
    clearMovementsCache(movementId);
    return response.data;
  },
  
  // Annuler un mouvement
  cancelMovement: async (movementId) => {
    const response = await api.post(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/cancel`);
    clearMovementsCache(movementId);
    return response.data;
  },
  
  // Uploader des photos
  uploadPhotos: async (movementId, formData) => {
    const response = await api.post(
      `${ENDPOINTS.MOVEMENTS.PHOTOS(movementId)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    cache.clear(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
    return response.data;
  },
  
  // Supprimer un mouvement
  deleteMovement: async (movementId) => {
    const response = await api.delete(ENDPOINTS.MOVEMENTS.DETAIL(movementId));
    clearMovementsCache();
    return response.data;
  }
};

export default movementService;