// server/config/db.config.js - Version simplifiée
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Utiliser directement l'URL locale pour tester
    const dbURI = process.env.MONGODB_URI

    await mongoose.connect(dbURI);
    
    console.log('MongoDB connecté avec succès');
    
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;