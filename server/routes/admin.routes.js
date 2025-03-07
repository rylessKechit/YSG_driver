// server/routes/admin.routes.js (créez ce fichier s'il n'existe pas)
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isAdmin } = require('../middleware/auth.middleware');
const whatsAppService = require('../services/whatsapp.service');

// Route pour vérifier le statut de WhatsApp et obtenir le QR code
router.get('/whatsapp-status', (req, res) => {
  try {
    const isReady = whatsAppService.isClientReady();
    const qrCodePath = whatsAppService.getQrCodePath();
    const qrCodeExists = fs.existsSync(qrCodePath);
    
    res.json({
      isReady,
      qrCodeExists,
      message: isReady 
        ? 'WhatsApp est connecté et prêt à envoyer des messages' 
        : (qrCodeExists 
            ? 'Veuillez scanner le QR code pour vous connecter' 
            : 'En attente du QR code...')
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut WhatsApp:', error);
    res.status(500).json({ message: 'Erreur serveur: ' + error.message });
  }
});

// Route pour obtenir le QR code
router.get('/whatsapp-qr', isAdmin, (req, res) => {
  try {
    const qrCodePath = whatsAppService.getQrCodePath();
    
    if (fs.existsSync(qrCodePath)) {
      res.sendFile(qrCodePath);
    } else {
      res.status(404).json({ message: 'QR code non disponible actuellement' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du QR code:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;