// server/models/preparation.model.js
const mongoose = require('mongoose');

const preparationSchema = new mongoose.Schema({
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
  tasks: {
    exteriorWashing: {
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      notes: String
    },
    interiorCleaning: {
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      notes: String
    },
    refueling: {
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      amount: Number, // Litres
      notes: String
    },
    vehicleTransfer: {
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      departureLocation: {
        name: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      arrivalLocation: {
        name: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      notes: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  photos: [{
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
      enum: ['before', 'after', 'damage', 'other'],
      default: 'other'
    }
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index pour rechercher efficacement les préparations par plaque d'immatriculation
preparationSchema.index({ licensePlate: 1 });
// Index pour rechercher les préparations d'un utilisateur
preparationSchema.index({ userId: 1, status: 1 });

const Preparation = mongoose.model('Preparation', preparationSchema);

module.exports = Preparation;