// server/routes/preparation.routes.js
const express = require('express');
const router = express.Router();
const Preparation = require('../models/preparation.model');
const TimeLog = require('../models/timelog.model');
const User = require('../models/user.model');
const { verifyToken, isAdmin, canCreatePreparation } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Middleware pour vérifier si un préparateur a un service actif
const checkPreparatorActiveTimeLog = async (preparatorId) => {
  const activeTimeLog = await TimeLog.findOne({
    userId: preparatorId,
    status: 'active'
  });
  return activeTimeLog;
};

// Créer une nouvelle préparation
router.post('/', verifyToken, canCreatePreparation, async (req, res) => {
  try {
    const {
      licensePlate,
      vehicleModel,
      notes
    } = req.body;
    
    // Validations basiques
    if (!licensePlate) {
      return res.status(400).json({
        message: 'La plaque d\'immatriculation est requise'
      });
    }
    
    // Déterminer l'utilisateur à qui assigner la préparation
    let userId = req.user._id;
    
    // Si c'est un admin qui crée et assigne à un préparateur
    if (req.user.role === 'admin' && req.body.userId) {
      // Vérifier que l'utilisateur existe et est un préparateur
      const preparator = await User.findById(req.body.userId);
      if (!preparator) {
        return res.status(404).json({ message: 'Préparateur non trouvé' });
      }
      
      if (preparator.role !== 'preparator') {
        return res.status(400).json({ message: 'L\'utilisateur sélectionné n\'est pas un préparateur' });
      }
      
      userId = preparator._id;
    }

    // Vérifier si le préparateur est en service
    const activeTimeLog = await checkPreparatorActiveTimeLog(userId);
    
    let status = 'pending';
    let timeLogId = null;
    
    if (activeTimeLog) {
      status = 'in-progress';
      timeLogId = activeTimeLog._id;
    }
    
    // Créer la préparation
    const preparation = new Preparation({
      userId, // Préparateur assigné
      timeLogId,
      licensePlate,
      vehicleModel,
      status,
      notes,
      startTime: activeTimeLog ? new Date() : null
    });
    
    await preparation.save();
    
    res.status(201).json({
      message: activeTimeLog ? 'Préparation créée et démarrée' : 'Préparation créée, mais le préparateur n\'est pas en service',
      preparation
    });
  } catch (error) {
    console.error('Erreur lors de la création de la préparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les préparateurs en service (pour les admins)
router.get('/preparators-on-duty', verifyToken, isAdmin, async (req, res) => {
  try {
    // Trouver tous les préparateurs en service actif
    const activeLogs = await TimeLog.find({
      status: 'active'
    }).populate('userId', 'username fullName email phone role');
    
    const preparatorsOnDuty = activeLogs.filter(log => log.userId.role === 'preparator').map(log => ({
      _id: log.userId._id,
      username: log.userId.username,
      fullName: log.userId.fullName,
      email: log.userId.email,
      phone: log.userId.phone,
      serviceStartTime: log.startTime
    }));
    
    res.json(preparatorsOnDuty);
  } catch (error) {
    console.error('Erreur lors de la récupération des préparateurs en service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// NOUVELLE ROUTE: Commencer une tâche (requiert photo "before")
router.post('/:id/tasks/:taskType/start', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { id, taskType } = req.params;
    const { notes } = req.body;
    
    console.log(`Démarrage de la tâche ${taskType} pour préparation ${id}`);
    
    // Vérifier que la préparation existe
    const preparation = await Preparation.findById(id);
    if (!preparation) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    // Vérifier que l'utilisateur est le préparateur assigné ou un admin
    if (preparation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette préparation' });
    }
    
    // Vérifier que la tâche existe
    const validTasks = ['exteriorWashing', 'interiorCleaning', 'refueling', 'vehicleTransfer'];
    if (!validTasks.includes(taskType)) {
      return res.status(400).json({ message: 'Type de tâche invalide' });
    }
    
    // S'assurer que la tâche est initialisée correctement
    if (!preparation.tasks[taskType]) {
      preparation.tasks[taskType] = {
        status: 'not_started',
        photos: { additional: [] }
      };
    }
    
    // Vérifier que la tâche n'est pas déjà commencée ou terminée
    if (preparation.tasks[taskType].status !== 'not_started') {
      return res.status(400).json({ message: `La tâche ${taskType} est déjà ${preparation.tasks[taskType].status === 'in_progress' ? 'en cours' : 'terminée'}` });
    }
    
    // Vérifier qu'une photo a été fournie
    if (!req.file) {
      return res.status(400).json({ message: 'Une photo "before" est requise pour commencer la tâche' });
    }
    
    console.log(`Photo reçue: ${req.file.path}`);
    
    // Utiliser l'URL Cloudinary
    const photoUrl = req.file.path;
    
    // Mettre à jour le statut de la tâche
    preparation.tasks[taskType].status = 'in_progress';
    preparation.tasks[taskType].startedAt = new Date();
    preparation.tasks[taskType].notes = notes || preparation.tasks[taskType].notes;
    
    // Initialiser la structure photos si nécessaire
    if (!preparation.tasks[taskType].photos) {
      preparation.tasks[taskType].photos = { additional: [] };
    }
    
    preparation.tasks[taskType].photos.before = {
      url: photoUrl,
      timestamp: new Date()
    };
    
    // Si c'est la première tâche commencée, mettre à jour le statut de la préparation
    if (preparation.status === 'pending') {
      preparation.status = 'in-progress';
      preparation.startTime = new Date();
    }
    
    await preparation.save();
    
    res.json({
      message: `Tâche ${taskType} commencée avec succès`,
      preparation
    });
  } catch (error) {
    console.error('Erreur lors du démarrage de la tâche:', error);
    res.status(500).json({ message: `Erreur lors du démarrage de la tâche: ${error.message}` });
  }
});

// NOUVELLE ROUTE: Terminer une tâche (requiert photo "after")
router.post('/:id/tasks/:taskType/complete', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { id, taskType } = req.params;
    const { notes, amount, departureLocation, arrivalLocation } = req.body;
    
    console.log(`Completion de la tâche ${taskType} pour préparation ${id}`);
    
    // Vérifier que la préparation existe
    const preparation = await Preparation.findById(id);
    if (!preparation) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    // Vérifier que l'utilisateur est le préparateur assigné ou un admin
    if (preparation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette préparation' });
    }
    
    // Vérifier que la tâche existe
    const validTasks = ['exteriorWashing', 'interiorCleaning', 'refueling', 'vehicleTransfer'];
    if (!validTasks.includes(taskType)) {
      return res.status(400).json({ message: 'Type de tâche invalide' });
    }
    
    // S'assurer que la tâche est initialisée correctement
    if (!preparation.tasks[taskType]) {
      return res.status(400).json({ message: 'La tâche doit d\'abord être commencée' });
    }
    
    // Vérifier que la tâche est en cours
    if (preparation.tasks[taskType].status !== 'in_progress') {
      return res.status(400).json({ 
        message: `La tâche ${taskType} n'est pas en cours. Statut actuel: ${preparation.tasks[taskType].status}` 
      });
    }
    
    // Vérifier qu'une photo a été fournie
    if (!req.file) {
      return res.status(400).json({ message: 'Une photo "after" est requise pour terminer la tâche' });
    }
    
    console.log(`Photo reçue: ${req.file.path}`);
    
    // Utiliser l'URL Cloudinary
    const photoUrl = req.file.path;
    
    // Ajouter des données spécifiques selon le type de tâche
    if (taskType === 'refueling' && amount) {
      preparation.tasks[taskType].amount = parseFloat(amount);
    }
    
    if (taskType === 'vehicleTransfer') {
      if (departureLocation) {
        try {
          preparation.tasks[taskType].departureLocation = typeof departureLocation === 'string' ? 
            JSON.parse(departureLocation) : departureLocation;
        } catch (e) {
          preparation.tasks[taskType].departureLocation = { name: departureLocation };
        }
      }
      if (arrivalLocation) {
        try {
          preparation.tasks[taskType].arrivalLocation = typeof arrivalLocation === 'string' ? 
            JSON.parse(arrivalLocation) : arrivalLocation;
        } catch (e) {
          preparation.tasks[taskType].arrivalLocation = { name: arrivalLocation };
        }
      }
    }
    
    // Mettre à jour le statut de la tâche
    preparation.tasks[taskType].status = 'completed';
    preparation.tasks[taskType].completedAt = new Date();
    if (notes) {
      preparation.tasks[taskType].notes = notes;
    }
    
    // S'assurer que la structure photos existe
    if (!preparation.tasks[taskType].photos) {
      preparation.tasks[taskType].photos = { additional: [] };
    }
    
    // Ajouter la photo "after"
    preparation.tasks[taskType].photos.after = {
      url: photoUrl,
      timestamp: new Date()
    };
    
    await preparation.save();
    
    res.json({
      message: `Tâche ${taskType} terminée avec succès`,
      preparation
    });
  } catch (error) {
    console.error('Erreur lors de la finalisation de la tâche:', error);
    res.status(500).json({ message: `Erreur lors de la finalisation de la tâche: ${error.message}` });
  }
});

// NOUVELLE ROUTE: Ajouter une photo additionnelle à une tâche
router.post('/:id/tasks/:taskType/photos', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { id, taskType } = req.params;
    const { description } = req.body;
    
    // Vérifier que la préparation existe
    const preparation = await Preparation.findById(id);
    if (!preparation) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    // Vérifier que l'utilisateur est le préparateur assigné ou un admin
    if (preparation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette préparation' });
    }
    
    // Vérifier que la tâche existe
    const validTasks = ['exteriorWashing', 'interiorCleaning', 'refueling', 'vehicleTransfer'];
    if (!validTasks.includes(taskType)) {
      return res.status(400).json({ message: 'Type de tâche invalide' });
    }
    
    // Vérifier qu'une photo a été fournie
    if (!req.file) {
      return res.status(400).json({ message: 'Une photo est requise' });
    }
    
    // Préparer l'URL de la photo
    const photoUrl = req.file.path;
    
    // Initialiser le tableau des photos additionnelles s'il n'existe pas
    if (!preparation.tasks[taskType].photos) {
      preparation.tasks[taskType].photos = { additional: [] };
    }
    
    if (!preparation.tasks[taskType].photos.additional) {
      preparation.tasks[taskType].photos.additional = [];
    }
    
    // Ajouter la photo additionnelle
    preparation.tasks[taskType].photos.additional.push({
      url: photoUrl,
      timestamp: new Date(),
      description: description || ''
    });
    
    await preparation.save();
    
    res.json({
      message: 'Photo additionnelle ajoutée avec succès',
      preparation
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la photo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Terminer une préparation
router.put('/:id/complete', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Vérifier que la préparation existe
    const preparation = await Preparation.findById(id);
    if (!preparation) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    // Vérifier que l'utilisateur est le préparateur assigné ou un admin
    if (preparation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette préparation' });
    }
    
    // Vérifier qu'au moins une tâche a été complétée
    const hasTasks = Object.values(preparation.tasks).some(task => task.status === 'completed');
    if (!hasTasks) {
      return res.status(400).json({ message: 'Vous devez compléter au moins une tâche avant de terminer la préparation' });
    }
    
    // Mettre à jour la préparation
    preparation.status = 'completed';
    preparation.endTime = new Date();
    
    if (notes) {
      preparation.notes = notes;
    }
    
    await preparation.save();
    
    res.json({
      message: 'Préparation terminée avec succès',
      preparation
    });
  } catch (error) {
    console.error('Erreur lors de la fin de la préparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Upload de photos générales pour la préparation (dommages, autres)
router.post('/:id/photos', verifyToken, upload.array('photos', 5), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que la préparation existe
    const preparation = await Preparation.findById(id);
    if (!preparation) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    // Vérifier que l'utilisateur est le préparateur assigné ou un admin
    if (preparation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette préparation' });
    }
    
    // Type de photo (dommage, autre)
    const { type = 'other' } = req.body;
    
    // Ajouter les photos
    if (req.files && req.files.length > 0) {
      const photos = req.files.map(file => ({
        url: file.path, // Utiliser l'URL fournie par Cloudinary
        type,
        timestamp: new Date()
      }));
      
      preparation.photos.push(...photos);
      await preparation.save();
      
      res.json({
        message: 'Photos ajoutées avec succès',
        photos: preparation.photos
      });
    } else {
      res.status(400).json({ message: 'Aucune photo n\'a été téléchargée' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload des photos:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir toutes les préparations (filtrées selon le rôle)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Si c'est un préparateur, filtrer ses propres préparations
    if (req.user.role === 'preparator') {
      query.userId = req.user._id;
    }
    
    if (status) {
      query.status = status;
    }
    
    const preparations = await Preparation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username fullName')
    
    const total = await Preparation.countDocuments(query);
    
    res.json({
      preparations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des préparations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir une préparation spécifique
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const preparation = await Preparation.findById(id)
      .populate('userId', 'username fullName')
    
    if (!preparation) {
      return res.status(404).json({ message: 'Préparation non trouvée' });
    }
    
    // Correction de la vérification pour les préparateurs
    if (req.user.role === 'preparator' && preparation.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette préparation' });
    }
    
    res.json(preparation);
  } catch (error) {
    console.error('Erreur lors de la récupération de la préparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Rechercher des préparations par plaque d'immatriculation
router.get('/search/plate', verifyToken, async (req, res) => {
  try {
    const { licensePlate } = req.query;
    
    if (!licensePlate) {
      return res.status(400).json({ message: 'Plaque d\'immatriculation requise pour la recherche' });
    }
    
    const query = { licensePlate: { $regex: new RegExp(licensePlate, 'i') } };
    
    // Si c'est un préparateur, filtrer ses propres préparations
    if (req.user.role === 'preparator') {
      query.userId = req.user._id;
    }
    
    const preparations = await Preparation.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'username fullName')
    
    res.json({
      preparations,
      totalItems: preparations.length
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de préparations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;