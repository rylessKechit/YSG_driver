const express = require('express');
const router = express.Router();
const Movement = require('../models/movement.model');
const TimeLog = require('../models/timelog.model');
const { verifyToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const path = require('path');

// Middleware pour vérifier si l'utilisateur a un service actif
const checkActiveTimeLog = async (req, res, next) => {
  try {
    const activeTimeLog = await TimeLog.findOne({
      userId: req.user._id,
      status: 'active'
    });
    
    if (!activeTimeLog) {
      return res.status(400).json({
        message: 'Vous devez être en service pour créer ou modifier un mouvement de véhicule'
      });
    }
    
    req.activeTimeLog = activeTimeLog;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification des pointages actifs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau mouvement
router.post('/', verifyToken, checkActiveTimeLog, async (req, res) => {
  try {
    const {
      licensePlate,
      vehicleModel,
      departureLocation,
      arrivalLocation,
      notes
    } = req.body;
    
    // Validations basiques
    if (!licensePlate || !departureLocation || !arrivalLocation) {
      return res.status(400).json({
        message: 'Plaque d\'immatriculation, lieu de départ et lieu d\'arrivée sont requis'
      });
    }
    
    // Créer le mouvement
    const movement = new Movement({
      userId: req.user._id,
      timeLogId: req.activeTimeLog._id,
      licensePlate,
      vehicleModel,
      departureLocation,
      arrivalLocation,
      status: 'pending',
      notes
    });
    
    await movement.save();
    
    res.status(201).json({
      message: 'Mouvement de véhicule créé avec succès',
      movement
    });
  } catch (error) {
    console.error('Erreur lors de la création du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrer un mouvement
router.post('/:id/start', verifyToken, checkActiveTimeLog, async (req, res) => {
  try {
    const movement = await Movement.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!movement) {
      return res.status(404).json({
        message: 'Mouvement non trouvé'
      });
    }
    
    if (movement.status !== 'pending') {
      return res.status(400).json({
        message: 'Ce mouvement ne peut pas être démarré'
      });
    }
    
    movement.status = 'in-progress';
    movement.departureTime = new Date();
    
    await movement.save();
    
    res.json({
      message: 'Mouvement démarré avec succès',
      movement
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Terminer un mouvement
router.post('/:id/complete', verifyToken, checkActiveTimeLog, async (req, res) => {
  try {
    const movement = await Movement.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!movement) {
      return res.status(404).json({
        message: 'Mouvement non trouvé'
      });
    }
    
    if (movement.status !== 'in-progress') {
      return res.status(400).json({
        message: 'Ce mouvement ne peut pas être terminé'
      });
    }
    
    const { notes } = req.body;
    
    movement.status = 'completed';
    movement.arrivalTime = new Date();
    
    if (notes) {
      movement.notes = notes;
    }
    
    await movement.save();
    
    res.json({
      message: 'Mouvement terminé avec succès',
      movement
    });
  } catch (error) {
    console.error('Erreur lors de la fin du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Upload de photos
router.post('/:id/photos', verifyToken, upload.array('photos', 5), async (req, res) => {
  try {
    const movement = await Movement.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!movement) {
      return res.status(404).json({
        message: 'Mouvement non trouvé'
      });
    }
    
    // Type de photo (départ, arrivée, dommage, autre)
    const { type = 'other' } = req.body;
    
    // Ajouter les photos
    if (req.files && req.files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const photos = req.files.map(file => ({
        url: `${baseUrl}/uploads/${req.user._id}/${file.filename}`,
        type,
        timestamp: new Date()
      }));
      
      movement.photos.push(...photos);
      await movement.save();
      
      res.json({
        message: 'Photos ajoutées avec succès',
        photos: movement.photos
      });
    } else {
      res.status(400).json({
        message: 'Aucune photo n\'a été téléchargée'
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload des photos:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir tous les mouvements
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const movements = await Movement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Movement.countDocuments(query);
    
    res.json({
      movements,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir un mouvement spécifique
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const movement = await Movement.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!movement) {
      return res.status(404).json({
        message: 'Mouvement non trouvé'
      });
    }
    
    res.json(movement);
  } catch (error) {
    console.error('Erreur lors de la récupération du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Rechercher des mouvements par plaque d'immatriculation
router.get('/search', verifyToken, async (req, res) => {
    try {
      const { licensePlate } = req.query;
      
      if (!licensePlate) {
        return res.status(400).json({
          message: 'Plaque d\'immatriculation requise pour la recherche'
        });
      }
      
      const movements = await Movement.find({
        userId: req.user._id,
        licensePlate: { $regex: new RegExp(licensePlate, 'i') }
      }).sort({ createdAt: -1 });
      
      res.json({
        movements,
        totalItems: movements.length
      });
    } catch (error) {
      console.error('Erreur lors de la recherche de mouvements:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

module.exports = router;