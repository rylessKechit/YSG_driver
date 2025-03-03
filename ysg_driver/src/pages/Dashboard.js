// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import timelogService from '../services/timelogService';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';
import WeeklySchedule from '../components/WeeklySchedule';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [assignedMovements, setAssignedMovements] = useState([]);
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
        
        // Si c'est un chauffeur, obtenir ses mouvements assignés
        if (currentUser.role === 'driver') {
          const assignedData = await movementService.getMovements(1, 5, 'assigned');
          setAssignedMovements(assignedData.movements);
        }
        
        // Récupérer les mouvements récents (terminés pour les chauffeurs, tous pour les admins)
        const movementsData = await movementService.getMovements(
          1, 
          5, 
          currentUser.role === 'driver' ? 'completed' : null
        );
        setRecentMovements(movementsData.movements);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  // Formatter la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Chargement du tableau de bord...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="dashboard-container">
        <div className="greeting-section">
          <h1 className="greeting-title">Bonjour, {currentUser?.fullName || 'Chauffeur'}</h1>
          <p className="greeting-subtitle">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {currentUser.role === 'preparator' && <WeeklySchedule />}
        
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}
        
        {(currentUser.role === 'driver' || currentUser.role === 'preparator' || currentUser.role === 'team-leader') && (
          <div className="status-card">
            <div className="status-header">
              <h2 className="status-title">Statut de service</h2>
              <div className="status-indicator">
                <div className={`status-dot ${activeTimeLog ? 'active' : 'inactive'}`}></div>
                <span>{activeTimeLog ? 'En service' : 'Hors service'}</span>
              </div>
            </div>
            
            <div className="service-info">
              {activeTimeLog ? (
                <div className="active-service">
                  <p className="service-time">Service démarré le {formatDate(activeTimeLog.startTime)}</p>
                  <Link to="/timelog" className="btn btn-danger">
                    <i className="fas fa-clock"></i> Terminer le service
                  </Link>
                </div>
              ) : (
                <div className="inactive-service">
                  <p className="service-time">Vous n'êtes pas actuellement en service.</p>
                  <Link to="/timelog" className="btn btn-success">
                    <i className="fas fa-play"></i> Démarrer le service
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mouvements assignés (chauffeurs seulement) */}
        {currentUser.role === 'driver' && assignedMovements.length > 0 && (
          <div className="assigned-movements">
            <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-tasks"></i> Trajets assignés
              </h2>
            </div>
            
            <div className="movements-list">
              {assignedMovements.map(movement => (
                <div key={movement._id} className="movement-card">
                  <div className="movement-header">
                    <div className="vehicle-info">
                      <span className="license-plate">{movement.licensePlate}</span>
                      {movement.vehicleModel && (
                        <span className="vehicle-model">{movement.vehicleModel}</span>
                      )}
                    </div>
                    <span className="badge badge-in-progress">
                      <i className="fas fa-clock"></i> Assigné
                    </span>
                  </div>
                  
                  <div className="movement-route">
                    <div className="route-item">
                      <div className="route-icon">
                        <div className="route-icon-circle departure-icon"></div>
                        <div className="route-line"></div>
                      </div>
                      <div className="route-details">
                        <div className="route-label">Départ</div>
                        <div className="route-location">{movement.departureLocation.name}</div>
                      </div>
                    </div>
                    
                    <div className="route-item">
                      <div className="route-icon">
                        <div className="route-icon-circle arrival-icon"></div>
                      </div>
                      <div className="route-details">
                        <div className="route-label">Arrivée</div>
                        <div className="route-location">{movement.arrivalLocation.name}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="movement-footer">
                    <div className="movement-date">Assigné le {formatDate(movement.updatedAt)}</div>
                    <Link to={`/movement/${movement._id}`} className="btn btn-primary btn-sm">
                      <i className="fas fa-play"></i> Démarrer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions rapides */}
        <div className="quick-actions">
          <h2 className="section-title">
            <i className="fas fa-bolt"></i> Actions rapides
          </h2>
          
          <div className="actions-grid">
            {currentUser.role === 'admin' ? (
              // Actions admin
              <>
                <Link to="/movement/history" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-history"></i>
                  </div>
                  <span className="action-title">Historique des mouvements</span>
                </Link>
                <Link to="/preparations" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-tools"></i>
                  </div>
                  <span className="action-title">Historique des préparations</span>
                </Link>
                <Link to="/reports" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-file-excel"></i>
                  </div>
                  <span className="action-title">Rapports</span>
                </Link>
                <Link to="/schedules" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-calendar-week"></i>
                  </div>
                  <span className="action-title">Planning préparateurs</span>
                </Link>
              </>
            ) : currentUser.role === 'team-leader' ? (
              // Actions chef d'équipe
              <>
                <Link to="/admin/movements/create" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <span className="action-title">Créer un mouvement</span>
                </Link>
                <Link to="/preparations/create" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-tools"></i>
                  </div>
                  <span className="action-title">Créer une préparation</span>
                </Link>
                <Link to="/movement/history" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-history"></i>
                  </div>
                  <span className="action-title">Historique</span>
                </Link>
                <Link to="/profile" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="action-title">Mon profil</span>
                </Link>
              </>
            ) : currentUser.role === 'preparator' ? (
              // Actions préparateur
              <>
                <Link to="/preparations/create" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <span className="action-title">Créer une préparation</span>
                </Link>
                <Link to="/preparations" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-clipboard-list"></i>
                  </div>
                  <span className="action-title">Historique des préparations</span>
                </Link>
                <Link to="/profile" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="action-title">Mon profil</span>
                </Link>
              </>
            ) : (
              // Actions chauffeur (par défaut)
              <>
                <Link to="/preparations/create" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <span className="action-title">Créer une préparation</span>
                </Link>
                <Link to="/movement/history" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-history"></i>
                  </div>
                  <span className="action-title">Historique</span>
                </Link>
                <Link to="/profile" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="action-title">Mon profil</span>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mouvements récents */}
        <div className="recent-movements">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-history"></i> Trajets récents
            </h2>
            <Link to={currentUser.role === 'admin' ? "/admin/movements" : "/movement/history"} className="view-all">
              Voir tout <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          
          {recentMovements.length > 0 ? (
            <div className="movements-list">
              {recentMovements.map(movement => (
                <div key={movement._id} className="movement-card">
                  <div className="movement-header">
                    <div className="vehicle-info">
                      <span className="license-plate">{movement.licensePlate}</span>
                      {movement.vehicleModel && (
                        <span className="vehicle-model">{movement.vehicleModel}</span>
                      )}
                    </div>
                    <span className={`badge badge-${movement.status}`}>
                      {movement.status === 'pending' && <><i className="fas fa-hourglass-start"></i> En attente</>}
                      {movement.status === 'assigned' && <><i className="fas fa-user-check"></i> Assigné</>}
                      {movement.status === 'in-progress' && <><i className="fas fa-spinner"></i> En cours</>}
                      {movement.status === 'completed' && <><i className="fas fa-check-circle"></i> Terminé</>}
                      {movement.status === 'cancelled' && <><i className="fas fa-times-circle"></i> Annulé</>}
                    </span>
                  </div>
                  
                  <div className="movement-route">
                    <div className="route-item">
                      <div className="route-icon">
                        <div className="route-icon-circle departure-icon"></div>
                        <div className="route-line"></div>
                      </div>
                      <div className="route-details">
                        <div className="route-label">Départ</div>
                        <div className="route-location">{movement.departureLocation.name}</div>
                      </div>
                    </div>
                    
                    <div className="route-item">
                      <div className="route-icon">
                        <div className="route-icon-circle arrival-icon"></div>
                      </div>
                      <div className="route-details">
                        <div className="route-label">Arrivée</div>
                        <div className="route-location">{movement.arrivalLocation.name}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="movement-footer">
                    <div className="movement-date">
                      {movement.status === 'completed' 
                        ? `Terminé le ${formatDate(movement.arrivalTime || movement.updatedAt)}` 
                        : `Créé le ${formatDate(movement.createdAt)}`}
                    </div>
                    <Link to={`/movement/${movement._id}`} className="view-details">
                      Voir les détails <i className="fas fa-chevron-right"></i>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-movements">
              <div className="no-data-icon">
                <i className="fas fa-car"></i>
              </div>
              <p className="no-data-message">Aucun trajet récent à afficher.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;