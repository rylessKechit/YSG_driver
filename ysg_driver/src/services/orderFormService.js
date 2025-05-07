// ysg_driver/src/services/orderFormService.js - Nouveau fichier
import { api } from './authService';
import { ENDPOINTS } from '../config';

const orderFormService = {
  /**
   * Récupère l'URL du bon de commande pour un mouvement
   * @param {string} movementId - ID du mouvement
   * @returns {Promise<string>} URL du bon de commande
   */
  getOrderFormUrl: async (movementId) => {
    try {
      const response = await api.get(`${ENDPOINTS.MOVEMENTS.DETAIL(movementId)}/orderform`);
      
      if (response.data.success && response.data.orderFormUrl) {
        return response.data.orderFormUrl;
      }
      
      throw new Error(response.data.message || 'Bon de commande non disponible');
    } catch (error) {
      console.error('Erreur lors de la récupération du bon de commande:', error);
      throw error;
    }
  }
};

export default orderFormService;