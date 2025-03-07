// server/routes/movement.routes.js
const express = require('express');
const router = express.Router();
const Movement = require('../models/movement.model');
const TimeLog = require('../models/timelog.model');
const User = require('../models/user.model');
const { verifyToken, canCreateMovement, canAssignMovement } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const whatsAppService = require('../services/whatsapp.service');

// Middleware pour vérifier si un chauffeur a un service actif
const checkDriverActiveTimeLog = async (driverId) => {
  const activeTimeLog = await TimeLog.findOne({
    userId: driverId,
    status: 'active'
  });
  return activeTimeLog;
};

// Créer un nouveau mouvement (réservé aux admins)
// Modifier la route de création du mouvement (POST /)
router.post('/', verifyToken, canCreateMovement, async (req, res) => {
  console.log('JE suis passer ici');
  try {
    const {
      userId, // ID du chauffeur à qui le mouvement sera assigné (optionnel)
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
    
    // Vérification du chauffeur (si fourni)
    let timeLogId = null;
    let driver = null;
    
    if (userId) {
      // Vérifier que l'utilisateur existe et est un chauffeur
      driver = await User.findById(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Chauffeur non trouvé' });
      }
      
      if (driver.role !== 'driver') {
        return res.status(400).json({ message: 'L\'utilisateur sélectionné n\'est pas un chauffeur' });
      }

      // Vérifier si le chauffeur est en service
      const activeTimeLog = await checkDriverActiveTimeLog(userId);
      if (activeTimeLog) {
        timeLogId = activeTimeLog._id;
      }
    }
    
    // Déterminer le statut initial
    let status = 'pending'; // Par défaut sans chauffeur ou chauffeur hors service
    
    // Si un chauffeur est fourni et est en service, changer le statut à 'assigned'
    if (userId && timeLogId) {
      status = 'assigned';
    }
    
    // Créer le mouvement
    const movement = new Movement({
      assignedBy: req.user._id, // Admin qui assigne
      licensePlate,
      vehicleModel,
      departureLocation,
      arrivalLocation,
      status,
      notes
    });
    
    // Si un chauffeur est fourni, l'assigner
    if (userId) {
      movement.userId = userId;
      movement.timeLogId = timeLogId;

      if (whatsAppService.isClientReady() && driver.phone) {
        console.log('OK');
        const message = `🚗 Nouveau mouvement assigné!\n\n` +
                        `Véhicule: ${movement.licensePlate}\n` +
                        `Départ: ${movement.departureLocation.name}\n` +
                        `Arrivée: ${movement.arrivalLocation.name}\n\n` +
                        `Statut: ${movement.status === 'assigned' ? 'Prêt à démarrer' : 'En attente'}\n` +
                        `Pour plus de détails, consultez l'application.`;
                        
        await whatsAppService.sendMessage(driver.phone, message);
        console.log(`Notification WhatsApp envoyée à ${driver.fullName} (${driver.phone})`);
      }
    }
    
    await movement.save();
    
    let message = 'Mouvement créé sans chauffeur assigné';
    if (userId) {
      if (timeLogId) {
        message = 'Mouvement créé et assigné au chauffeur en service';
      } else {
        message = 'Mouvement créé et assigné au chauffeur (hors service)';
      }
    }
    
    res.status(201).json({
      message: message,
      movement
    });
  } catch (error) {
    console.error('Erreur lors de la création du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/all-drivers', verifyToken, canAssignMovement, async (req, res) => {
  try {
    // Trouver tous les utilisateurs avec le rôle "driver"
    const drivers = await User.find({ role: ['driver', 'team-leader'] })
      .select('_id username fullName email phone');
    
    // Récupérer tous les pointages actifs pour déterminer quels chauffeurs sont en service
    const activeLogs = await TimeLog.find({
      status: 'active',
      userId: { $in: drivers.map(driver => driver._id) }
    });
    
    // Créer un ensemble d'IDs de chauffeurs en service pour recherche rapide
    const activeDriverIds = new Set(activeLogs.map(log => log.userId.toString()));
    
    // Ajouter un indicateur "isOnDuty" à chaque chauffeur
    const driversWithStatus = drivers.map(driver => {
      const isOnDuty = activeDriverIds.has(driver._id.toString());
      const activeLog = isOnDuty ? activeLogs.find(log => log.userId.toString() === driver._id.toString()) : null;
      
      return {
        _id: driver._id,
        username: driver.username,
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        isOnDuty: isOnDuty,
        serviceStartTime: activeLog ? activeLog.startTime : null
      };
    });
    
    res.json(driversWithStatus);
  } catch (error) {
    console.error('Erreur lors de la récupération des chauffeurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrer la préparation d'un mouvement (première étape)
router.post('/:id/prepare', verifyToken, async (req, res) => {
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
        message: 'Ce mouvement ne peut pas être préparé'
      });
    }
    
    // Vérifier si l'utilisateur est en service
    const activeTimeLog = await TimeLog.findOne({
      userId: req.user._id,
      status: 'active'
    });
    
    if (!activeTimeLog) {
      return res.status(400).json({
        message: 'Vous devez être en service pour préparer un mouvement'
      });
    }
    
    movement.status = 'preparing';
    
    await movement.save();
    
    res.json({
      message: 'Préparation du mouvement démarrée',
      movement
    });
  } catch (error) {
    console.error('Erreur lors du démarrage de la préparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrer le trajet (deuxième étape, après la préparation)
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
    
    // Modifier pour accepter les transitions depuis "preparing" ou "assigned"
    if (movement.status !== 'assigned' && movement.status !== 'preparing') {
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
    
    // Si le timeLogId n'était pas déjà défini, le définir maintenant
    if (!movement.timeLogId) {
      movement.timeLogId = activeTimeLog._id;
    }
    
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

// Ajouter une route pour assigner un chauffeur à un mouvement existant
router.post('/:id/assign', verifyToken, canAssignMovement, async (req, res) => {
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
    
    // Mettre à jour le mouvement
    movement.userId = userId;
    
    if (activeTimeLog) {
      movement.timeLogId = activeTimeLog._id;
      movement.status = 'assigned';
    } else {
      movement.timeLogId = null;
      // Conserver le statut 'pending'
    }
    
    await movement.save();
    
    // Envoyer une notification WhatsApp au chauffeur
    try {
      console.log('whatsapp is ready :', whatsAppService.isClientReady())
      if (whatsAppService.isClientReady() && driver.phone) {
        console.log('OK');
        const message = `🚗 Nouveau mouvement assigné!\n\n` +
                        `Véhicule: ${movement.licensePlate}\n` +
                        `Départ: ${movement.departureLocation.name}\n` +
                        `Arrivée: ${movement.arrivalLocation.name}\n\n` +
                        `Statut: ${movement.status === 'assigned' ? 'Prêt à démarrer' : 'En attente'}\n` +
                        `Pour plus de détails, consultez l'application.`;
                        
        await whatsAppService.sendMessage(driver.phone, message);
        console.log(`Notification WhatsApp envoyée à ${driver.fullName} (${driver.phone})`);
      }
    } catch (whatsappError) {
      // Ne pas bloquer le processus principal si l'envoi WhatsApp échoue
      console.error('Erreur lors de l\'envoi de la notification WhatsApp:', whatsappError);
    }
    
    res.json({
      message: activeTimeLog ? 'Chauffeur assigné et prêt pour le mouvement' : 'Chauffeur assigné mais hors service',
      movement,
      notificationSent: whatsAppService.isClientReady()
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation du chauffeur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les chauffeurs en service (pour les admins)
router.get('/drivers-on-duty', verifyToken, canCreateMovement, async (req, res) => {
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

// Supprimer un mouvement (admin seulement, si non démarré)
router.delete('/:id', verifyToken, canAssignMovement, async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({ message: 'Mouvement non trouvé' });
    }
    
    // Vérifier que le mouvement n'est pas déjà démarré
    if (movement.status === 'in-progress' || movement.status === 'completed') {
      return res.status(400).json({ 
        message: 'Impossible de supprimer un mouvement qui est déjà en cours ou terminé' 
      });
    }
    
    // Supprimer le mouvement
    await Movement.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Mouvement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du mouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mise à jour améliorée pour l'upload de photos
router.post('/:id/photos', verifyToken, upload.array('photos', 5), async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        message: 'Mouvement non trouvé'
      });
    }
    
    // Vérifier que l'utilisateur est autorisé (admin ou chauffeur assigné)
    if (req.user.role !== 'admin' && 
        (!movement.userId || movement.userId.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        message: 'Vous n\'êtes pas autorisé à modifier ce mouvement'
      });
    }
    
    // Vérifier que le mouvement est en cours
    if (movement.status !== 'preparing') {
      return res.status(400).json({
        message: 'Vous ne pouvez ajouter des photos qu\'à un mouvement en cours'
      });
    }
    
    // Type de photo (valider les types autorisés)
    const allowedTypes = ['front', 'passenger', 'driver', 'rear', 'windshield', 'roof', 'meter', 'departure', 'arrival', 'damage', 'other'];
    const { type = 'other' } = req.body;
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        message: 'Type de photo non valide'
      });
    }
    
    // Ajouter les photos
    if (req.files && req.files.length > 0) {
      // MODIFICATION ICI: Utiliser l'URL fournie par Cloudinary
      const photos = req.files.map(file => ({
        url: file.path, // Cloudinary renvoie le chemin complet dans file.path
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
router.post('/:id/cancel', verifyToken, canCreateMovement, async (req, res) => {
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
router.post('/:id/reassign', verifyToken, canCreateMovement, async (req, res) => {
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

module.exports = router;