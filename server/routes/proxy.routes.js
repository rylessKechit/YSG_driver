// Dans server/routes/proxy.routes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken } = require('../middleware/auth.middleware');

// Route proxy pour les appels API externes
router.get('/', verifyToken, async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL requise' });
    }
    
    // Faire la requête au nom du client
    const response = await axios.get(url);
    
    // Retourner les données au client
    res.json(response.data);
  } catch (error) {
    console.error('Erreur lors de la requête proxy:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la requête proxy', 
      error: error.message 
    });
  }
});

module.exports = router;