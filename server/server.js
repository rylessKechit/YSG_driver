const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db.config');
const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const timelogRoutes = require('./routes/timelog.routes');
const movementRoutes = require('./routes/movement.routes');
const preparationRoutes = require('./routes/preparation.routes');
const reportRoutes = require('./routes/report.routes');
const { verifyToken } = require('./middleware/auth.middleware');
const scheduleRoutes = require('./routes/schedule.routes');

// Configuration des variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT;

// Connexion à la base de données
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/timelogs', verifyToken, timelogRoutes);
app.use('/api/movements', verifyToken, movementRoutes);
app.use('/api/preparations', verifyToken, preparationRoutes);
app.use('/api/reports', verifyToken, reportRoutes);
app.use('/api/schedules', verifyToken, scheduleRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API de gestion des chauffeurs fonctionne correctement!' });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});