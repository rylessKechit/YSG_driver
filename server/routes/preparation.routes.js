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

// Mettre à jour les tâches de préparation
router.put('/:id/tasks', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { taskType, completed, notes, amount, departureLocation, arrivalLocation } = req.body;
    
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
    
    // Mettre à jour la tâche
    const updateData = {
      [`tasks.${taskType}.completed`]: completed === true,
      [`tasks.${taskType}.completedAt`]: completed === true ? new Date() : null,
      [`tasks.${taskType}.notes`]: notes
    };
    
    // Ajouter des données spécifiques selon le type de tâche
    if (taskType === 'refueling' && amount) {
      updateData[`tasks.${taskType}.amount`] = amount;
    }
    
    if (taskType === 'vehicleTransfer') {
      if (departureLocation) {
        updateData[`tasks.${taskType}.departureLocation`] = departureLocation;
      }
      if (arrivalLocation) {
        updateData[`tasks.${taskType}.arrivalLocation`] = arrivalLocation;
      }
    }
    
    const updatedPreparation = await Preparation.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    
    res.json({
      message: 'Tâche mise à jour avec succès',
      preparation: updatedPreparation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
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

// Upload de photos pour la préparation
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
    
    // Type de photo (avant, après, dommage, autre)
    const { type = 'other' } = req.body;
    
    // Ajouter les photos
    if (req.files && req.files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const photos = req.files.map(file => ({
        url: `${baseUrl}/uploads/${req.user._id}/${file.filename}`,
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
    
    // Si c'est un préparateur, vérifier qu'il est assigné à cette préparation
    if (req.user.role === 'preparator' && preparation.userId.toString() !== req.user._id.toString()) {
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