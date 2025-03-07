// server/routes/admin.routes.js (créez ce fichier s'il n'existe pas)
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth.middleware');
const whatsAppService = require('../services/whatsapp.service');

// Route pour vérifier le statut de WhatsApp et obtenir le QR code
router.get('/whatsapp-status', isAdmin, (req, res) => {
  try {
    const isReady = whatsAppService.isClientReady();
    const qrCodeUrl = whatsAppService.getQrCodeUrl();
    
    res.json({
      isReady,
      qrCodeUrl,
      message: isReady 
        ? 'WhatsApp est connecté et prêt à envoyer des messages' 
        : (qrCodeUrl 
            ? 'Veuillez scanner le QR code pour vous connecter' 
            : 'En attente du QR code...')
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut WhatsApp:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;