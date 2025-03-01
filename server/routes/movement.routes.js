// server/routes/movement.routes.js
const express = require('express');
const router = express.Router();
const Movement = require('../models/movement.model');
const TimeLog = require('../models/timelog.model');
const User = require('../models/user.model');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const path = require('path');

// Middleware pour vérifier si un chauffeur a un service actif
const checkDriverActiveTimeLog = async (driverId) => {
  const activeTimeLog = await TimeLog.findOne({
    userId: driverId,
    status: 'active'
  });
  return activeTimeLog;
};

// Créer un nouveau mouvement (réservé aux admins)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      userId, // ID du chauffeur à qui le mouvement sera assigné
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
    
    // Vérifier que l'utilisateur existe et est un chauffeur
    const driver = await User.findById(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }
    
    if (driver.role !== 'driver') {
      return res.status(400).json({ message: 'L\'utilisateur sélectionné n\'est pas un chauffeur' });
    }

    // Vérifier si le chauffeur est en service
    const activeTimeLog = await checkDriverActiveTimeLog(userId);
    
    let status = 'pending';
    let timeLogId = null;
    
    if (activeTimeLog) {
      status = 'assigned';
      timeLogId = activeTimeLog._id;
    }
    
    // Créer le mouvement
    const movement = new Movement({
      userId, // Chauffeur assigné
      assignedBy: req.user._id, // Admin qui assigne
      timeLogId,
      licensePlate,
      vehicleModel,
      departureLocation,
      arrivalLocation,
      status,
      notes
    });
    
    await movement.save();
    
    res.status(201).json({
      message: activeTimeLog ? 'Mouvement assigné au chauffeur' : 'Mouvement créé, mais le chauffeur n\'est pas en service',
      movement
    });
  } catch (error) {
    console.error('Erreur lors de la création du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les chauffeurs en service (pour les admins)
router.get('/drivers-on-duty', verifyToken, isAdmin, async (req, res) => {
  try {
    // Trouver tous les chauffeurs en service actif
    const activeLogs = await TimeLog.find({
      status: 'active'
    }).populate('userId', 'username fullName email phone role');
    
    const driversOnDuty = activeLogs.filter(log => log.userId.role === 'driver').map(log => ({
      _id: log.userId._id,
      username: log.userId.username,
      fullName: log.userId.fullName,
      email: log.userId.email,
      phone: log.userId.phone,
      serviceStartTime: log.startTime
    }));
    
    res.json(driversOnDuty);
  } catch (error) {
    console.error('Erreur lors de la récupération des chauffeurs en service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrer un mouvement (par un chauffeur)
router.post('/:id/start', verifyToken, async (req, res) => {
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
    
    if (movement.status !== 'assigned') {
      return res.status(400).json({
        message: 'Ce mouvement ne peut pas être démarré'
      });
    }
    
    // Vérifier si l'utilisateur est en service
    const activeTimeLog = await TimeLog.findOne({
      userId: req.user._id,
      status: 'active'
    });
    
    if (!activeTimeLog) {
      return res.status(400).json({
        message: 'Vous devez être en service pour démarrer un mouvement'
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

// Terminer un mouvement (par un chauffeur)
router.post('/:id/complete', verifyToken, async (req, res) => {
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

// Upload de photos (par un chauffeur)
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

// Annuler un mouvement (réservé aux admins)
router.post('/:id/cancel', verifyToken, isAdmin, async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        message: 'Mouvement non trouvé'
      });
    }
    
    if (movement.status === 'completed') {
      return res.status(400).json({
        message: 'Un mouvement terminé ne peut pas être annulé'
      });
    }
    
    movement.status = 'cancelled';
    await movement.save();
    
    res.json({
      message: 'Mouvement annulé avec succès',
      movement
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Réassigner un mouvement à un autre chauffeur (réservé aux admins)
router.post('/:id/reassign', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        message: 'ID du chauffeur requis'
      });
    }
    
    const movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        message: 'Mouvement non trouvé'
      });
    }
    
    if (movement.status !== 'pending' && movement.status !== 'assigned') {
      return res.status(400).json({
        message: 'Seuls les mouvements en attente ou assignés peuvent être réassignés'
      });
    }
    
    // Vérifier que l'utilisateur existe et est un chauffeur
    const driver = await User.findById(userId);
    if (!driver) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }
    
    if (driver.role !== 'driver') {
      return res.status(400).json({ message: 'L\'utilisateur sélectionné n\'est pas un chauffeur' });
    }
    
    // Vérifier si le chauffeur est en service
    const activeTimeLog = await checkDriverActiveTimeLog(userId);
    
    movement.userId = userId;
    movement.assignedBy = req.user._id;
    
    if (activeTimeLog) {
      movement.status = 'assigned';
      movement.timeLogId = activeTimeLog._id;
    } else {
      movement.status = 'pending';
      movement.timeLogId = null;
    }
    
    await movement.save();
    
    res.json({
      message: activeTimeLog ? 'Mouvement réassigné au chauffeur' : 'Mouvement réassigné, mais le chauffeur n\'est pas en service',
      movement
    });
  } catch (error) {
    console.error('Erreur lors de la réassignation du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir tous les mouvements (pour admin et chauffeur)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Si c'est un chauffeur, filtrer ses propres mouvements
    if (req.user.role === 'driver') {
      query.userId = req.user._id;
    }
    
    if (status) {
      query.status = status;
    }
    
    const movements = await Movement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username fullName')
      .populate('assignedBy', 'username fullName');
    
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
    const query = { _id: req.params.id };
    
    // Si c'est un chauffeur, vérifier que le mouvement lui est assigné
    if (req.user.role === 'driver') {
      query.userId = req.user._id;
    }
    
    const movement = await Movement.findOne(query)
      .populate('userId', 'username fullName')
      .populate('assignedBy', 'username fullName');
    
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
    
    const query = { licensePlate: { $regex: new RegExp(licensePlate, 'i') } };
    
    // Si c'est un chauffeur, filtrer ses propres mouvements
    if (req.user.role === 'driver') {
      query.userId = req.user._id;
    }
    
    const movements = await Movement.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'username fullName')
      .populate('assignedBy', 'username fullName');
    
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