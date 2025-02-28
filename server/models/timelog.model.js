const mongoose = require('mongoose');

const timelogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  location: {
    startLocation: {
      name: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    endLocation: {
      name: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index pour rechercher efficacement les pointages actifs d'un utilisateur
timelogSchema.index({ userId: 1, status: 1 });

const TimeLog = mongoose.model('TimeLog', timelogSchema);

module.exports = TimeLog;