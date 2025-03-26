// server/models/timelog.model.js (mise à jour)
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  ipAddress: String  // Stocker l'IP pour l'audit
});

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
    startLocation: locationSchema,
    endLocation: locationSchema
  },
  notes: String
}, {
  timestamps: true
});

timelogSchema.index({ userId: 1, status: 1 });
module.exports = mongoose.model('TimeLog', timelogSchema);