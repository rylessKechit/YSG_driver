const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Middleware pour vérifier le token JWT
exports.verifyToken = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token non fourni' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si l'utilisateur existe toujours
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Middleware pour vérifier le rôle administrateur
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  }
};

// Middleware pour vérifier le rôle chauffeur
exports.isDriver = (req, res, next) => {
  if (req.user && req.user.role === 'driver') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Rôle chauffeur requis.' });
  }
};

// Middleware pour vérifier le rôle préparateur
exports.isPreparator = (req, res, next) => {
  if (req.user && req.user.role === 'preparator') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Rôle préparateur requis.' });
  }
};

// Middleware pour vérifier le rôle direction
exports.isDirection = (req, res, next) => {
  if (req.user && req.user.role === 'direction') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Rôle direction requis.' });
  }
};

// Middleware pour vérifier l'accès aux rapports (admin et direction)
exports.canAccessReports = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'direction')) {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Droits insuffisants pour accéder aux rapports.' });
  }
};

exports.isTeamLeader = (req, res, next) => {
  if (req.user && req.user.role === 'team-leader') {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Rôle chef d\'équipe requis.' });
  }
};

// Middleware pour vérifier si l'utilisateur peut créer un mouvement (admin ou chef d'équipe)
exports.canCreateMovement = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'team-leader')) {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Droits insuffisants pour créer un mouvement.' });
  }
};

// Middleware pour vérifier si l'utilisateur peut assigner un mouvement (admin ou chef d'équipe)
exports.canAssignMovement = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'team-leader')) {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Droits insuffisants pour assigner un mouvement.' });
  }
};

// Middleware pour vérifier si l'utilisateur est chauffeur ou chef d'équipe
exports.isDriverOrTeamLeader = (req, res, next) => {
  if (req.user && (req.user.role === 'driver' || req.user.role === 'team-leader')) {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Rôle chauffeur ou chef d\'équipe requis.' });
  }
};

// Middleware pour vérifier si l'utilisateur peut créer une préparation
exports.canCreatePreparation = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'preparator' || 
                   req.user.role === 'driver' || req.user.role === 'team-leader')) {
    next();
  } else {
    res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à créer des préparations.' });
  }
};