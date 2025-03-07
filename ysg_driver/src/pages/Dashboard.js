// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import timelogService from '../services/timelogService';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';
import WeeklySchedule from '../components/WeeklySchedule';
import '../styles/Dashboard.css';
import preparationService from '../services/preparationService';

const Dashboard = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [assignedMovements, setAssignedMovements] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preparations, setPreparations] = useState([]);
  const [loadingPreparations, setLoadingPreparations] = useState(false);
  const { currentUser } = useAuth();

  const loadPreparations = async () => {
    try {
      // Éviter de recharger si déjà en cours de chargement
      if (loadingPreparations) return;
      
      setLoadingPreparations(true);
      let response;
      
      response = await preparationService.getPreparations(null, 100000000, 'completed' || null);
      
      setPreparations(response.preparations);
    } catch (err) {
      console.error('Erreur lors du chargement des préparations:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoadingPreparations(false);
    }
  };

  useEffect(() => {
    loadPreparations();
  }, []);

  // Obtenir l'état d'avancement des tâches
  const getTasksProgress = (preparation) => {
    const tasks = preparation.tasks;
    const completedTasks = [
      tasks.exteriorWashing?.status === 'completed',
      tasks.interiorCleaning?.status === 'completed',
      tasks.refueling?.status === 'completed',
      tasks.parking?.status === 'completed'
    ].filter(Boolean).length;
    
    return `${completedTasks}/4 tâches`;
  };

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

  // Gestionnaire pour naviguer vers les préparations d'aujourd'hui
  const goToPreparations = (e) => {
    // Navigation directe avec rechargement complet pour éviter les problèmes de requêtes multiples
    window.location.href = '/preparations';
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
          <h1 className="greeting-title">Bonjour, {currentUser?.fullName || 'Utilisateur'}</h1>
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
                <Link to="/admin/movements/create" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <span className="action-title">Créer un mouvement</span>
                </Link>
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
                <Link to="/admin" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-user-shield"></i>
                  </div>
                  <span className="action-title">Administration</span>
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
                <div onClick={goToPreparations} className="action-card" style={{ cursor: 'pointer' }}>
                  <div className="action-icon">
                    <i className="fas fa-clipboard-list"></i>
                  </div>
                  <span className="action-title">Historique des préparations</span>
                </div>
                <Link to="/profile" className="action-card">
                  <div className="action-icon">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="action-title">Mon profil</span>
                </Link>
              </>
            ) : currentUser.role === 'direction' ? (
              // Actions direction
              <>
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
        {currentUser.role === 'preparator' && (
          <div className='secrion-preparations'>
              <div className="section-header">
              <h2 className="section-title">
                <i className="fas fa-history"></i> Préparations récentes
              </h2>
            </div>
            <div className="preparation-list-container">
              {loadingPreparations ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                </div>
              ) : preparations.length > 0 ? (
                <div className="preparations-list">
                  {preparations.slice(0,5).map((preparation) => (
                    <div key={preparation._id} className="preparation-card">
                      <div className="preparation-header">
                        <h2 className="preparation-plate">{preparation.licensePlate}</h2>
                        <span className={`preparation-status status-${preparation.status}`}>
                          {preparation.status === 'pending' && 'En attente'}
                          {preparation.status === 'in-progress' && 'En cours'}
                          {preparation.status === 'completed' && 'Terminée'}
                        </span>
                      </div>
                      
                      {preparation.vehicleModel && (
                        <p className="vehicle-model">{preparation.vehicleModel}</p>
                      )}
                      
                      <div className="preparation-info">
                        <div className="info-item">
                          <div className="info-label">Préparateur:</div>
                          <div className="info-value">
                            {preparation.userId ? preparation.userId.fullName : 'Non assigné'}
                          </div>
                        </div>
                        
                        <div className="info-item">
                          <div className="info-label">Progression:</div>
                          <div className="info-value">{getTasksProgress(preparation)}</div>
                        </div>
                      </div>
                      
                      <div className="preparation-tasks">
                        <div className={`task-item ${preparation.tasks.exteriorWashing?.status === 'completed' ? 'completed' : ''}`}>
                          <i className={`fas ${preparation.tasks.exteriorWashing?.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}`}></i>
                          <span>Lavage extérieur</span>
                        </div>
                        
                        <div className={`task-item ${preparation.tasks.interiorCleaning?.status === 'completed' ? 'completed' : ''}`}>
                          <i className={`fas ${preparation.tasks.interiorCleaning?.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}`}></i>
                          <span>Nettoyage intérieur</span>
                        </div>
                        
                        <div className={`task-item ${preparation.tasks.refueling?.status === 'completed' ? 'completed' : ''}`}>
                          <i className={`fas ${preparation.tasks.refueling?.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}`}></i>
                          <span>Carburant</span>
                        </div>
                        
                        <div className={`task-item ${preparation.tasks.parking?.status === 'completed' ? 'completed' : ''}`}>
                          <i className={`fas ${preparation.tasks.parking?.status === 'completed' ? 'fa-check-circle' : 'fa-circle'}`}></i>
                          <span>Stationnement</span>
                        </div>
                      </div>
                      
                      <div className="preparation-footer">
                        <p className="preparation-date">
                          {preparation.status === 'completed' 
                            ? `Terminée le ${formatDate(preparation.endTime || preparation.updatedAt)}` 
                            : `Créée le ${formatDate(preparation.createdAt)}`}
                        </p>
                        <Link to={`/preparations/${preparation._id}`} className="view-details-link">
                          Voir les détails
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>
                    Aucune préparation de véhicule trouvée.
                  </p>
                  {currentUser && (currentUser.role === 'admin' || currentUser.role === 'preparator') && (
                    <Link to="/preparations/create" className="btn btn-primary">
                      Créer une nouvelle préparation
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {(currentUser.role === 'driver' || currentUser.role === 'team-leader') && (
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;