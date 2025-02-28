import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import timelogService from '../services/timelogService';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Récupérer le pointage actif
        const timeLog = await timelogService.getActiveTimeLog()
          .catch(err => {
            if (err.response && err.response.status === 404) {
              return null; // Pas de pointage actif
            }
            throw err;
          });
        
        setActiveTimeLog(timeLog);
        
        // Récupérer les mouvements récents
        const movementsData = await movementService.getMovements(1, 5);
        setRecentMovements(movementsData.movements);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="dashboard-container">
        <h1 className="dashboard-title">Tableau de bord</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="welcome-card">
          <h2 className="welcome-message">Bonjour, {currentUser?.fullName || 'Chauffeur'}</h2>
          <p className="date-info">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div className="status-card">
          <h2 className="card-title">Statut de service</h2>
          
          <div className="status-content">
            <div className="status-indicator">
              <div className={`status-dot ${activeTimeLog ? 'active' : 'inactive'}`}></div>
              <span className="status-text">
                {activeTimeLog ? 'En service' : 'Hors service'}
              </span>
            </div>
            
            {activeTimeLog ? (
              <div className="active-service-info">
                <p>Service démarré le {new Date(activeTimeLog.startTime).toLocaleString()}</p>
                <Link to="/timelog" className="btn btn-danger">
                  Terminer le service
                </Link>
              </div>
            ) : (
              <div className="inactive-service-info">
                <p>Vous n'êtes pas actuellement en service.</p>
                <Link to="/timelog" className="btn btn-success">
                  Démarrer le service
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="actions-card">
          <h2 className="card-title">Actions rapides</h2>
          
          <div className="actions-grid">
            <Link to="/movement/new" className="action-button">
              <div className="action-icon">🚗</div>
              <span>Nouveau trajet</span>
            </Link>
            <Link to="/movement/history" className="action-button">
              <div className="action-icon">📜</div>
              <span>Historique</span>
            </Link>
            <Link to="/profile" className="action-button">
              <div className="action-icon">👤</div>
              <span>Mon profil</span>
            </Link>
            {currentUser?.role === 'admin' && (
              <Link to="/admin" className="action-button">
                <div className="action-icon">⚙️</div>
                <span>Administration</span>
              </Link>
            )}
          </div>
        </div>
        
        <div className="recent-movements-card">
          <h2 className="card-title">Trajets récents</h2>
          
          {recentMovements.length > 0 ? (
            <div className="movements-list">
              {recentMovements.map(movement => (
                <div key={movement._id} className="movement-item">
                  <div className="movement-header">
                    <h3 className="vehicle-plate">{movement.licensePlate}</h3>
                    <span className={`movement-status status-${movement.status}`}>
                      {movement.status === 'pending' && 'En attente'}
                      {movement.status === 'in-progress' && 'En cours'}
                      {movement.status === 'completed' && 'Terminé'}
                    </span>
                  </div>
                  <div className="movement-details">
                    <p className="movement-route">
                      <strong>De:</strong> {movement.departureLocation.name}
                      <br />
                      <strong>À:</strong> {movement.arrivalLocation.name}
                    </p>
                    <p className="movement-date">
                      {new Date(movement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/movement/${movement._id}`} className="movement-link">
                    Voir les détails
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-message">Aucun trajet récent à afficher.</p>
          )}
          
          <div className="view-all-link">
            <Link to="/movement/history">Voir tous les trajets</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;