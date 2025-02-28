const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['departure', 'arrival', 'damage', 'other'],
    default: 'other'
  }
});

const movementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeLog'
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  vehicleModel: {
    type: String,
    trim: true
  },
  departureLocation: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  arrivalLocation: {
    name: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  departureTime: {
    type: Date,
    default: Date.now
  },
  arrivalTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  photos: [photoSchema],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index pour rechercher efficacement les mouvements par plaque d'immatriculation
movementSchema.index({ licensePlate: 1 });
// Index pour rechercher les mouvements d'un utilisateur
movementSchema.index({ userId: 1, status: 1 });

const Movement = mongoose.model('Movement', movementSchema);

module.exports = Movement;