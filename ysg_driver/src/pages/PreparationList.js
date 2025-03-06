// src/pages/PreparationList.js
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import preparationService from '../services/preparationService';
import Navigation from '../components/Navigation';
import '../styles/PreparationList.css';

const PreparationList = () => {
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTodayFilter, setIsTodayFilter] = useState(false);
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialiser correctement les filtres à partir des paramètres d'URL
  // Cette fonction s'exécutera une seule fois au montage initial
  useEffect(() => {
    console.log("Initialisation des filtres à partir de l'URL");
    const dayParam = searchParams.get('day');
    
    if (dayParam === 'today') {
      console.log("Filtre 'today' détecté dans l'URL");
      setIsTodayFilter(true);
    }
  }, []); // Dépendances vides pour n'exécuter qu'au montage initial
  
  // Fonction de chargement des préparations
  const loadPreparations = async () => {
    try {
      // Éviter de recharger si déjà en cours de chargement
      if (loading) return;
      
      setLoading(true);
      let response;
      
      // Log pour debug
      console.log("Chargement des préparations avec paramètres:", {
        isSearching, 
        searchQuery, 
        page, 
        statusFilter,
        isTodayFilter,
        dayParam: isTodayFilter ? 'today' : null
      });
      
      if (isSearching && searchQuery) {
        // Si on est en mode recherche, utiliser l'endpoint de recherche
        response = await preparationService.searchByLicensePlate(searchQuery);
      } else {
        // Sinon utiliser l'endpoint standard avec les paramètres de filtrage
        const dayParam = isTodayFilter ? 'today' : null;
        
        response = await preparationService.getPreparations(page, 10, statusFilter || null, dayParam);
        setTotalPages(response.totalPages);
      }
      
      setPreparations(response.preparations);
      
      // Log pour debug
      console.log("Préparations chargées:", response.preparations.length);
    } catch (err) {
      console.error('Erreur lors du chargement des préparations:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  
  // Effet pour charger les préparations quand les filtres changent
  useEffect(() => {
    console.log("Déclenchement du chargement suite à un changement de filtre");
    loadPreparations();
  }, [page, statusFilter, isSearching, isTodayFilter]);

  // Gestionnaire de changement de filtre
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Réinitialiser à la première page
  };

  // Gestionnaire de recherche
  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(!!searchQuery);
    setPage(1);
  };

  // Réinitialiser la recherche
  const resetSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setPage(1);
  };
  
  // Réinitialiser le filtre aujourd'hui
  const resetTodayFilter = () => {
    setIsTodayFilter(false);
    // Mettre à jour l'URL pour refléter ce changement
    navigate('/preparations');
  };

  // Formatter la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  return (
    <div>
      <Navigation />
      
      <div className="preparation-list-container">
        <div className="page-header">
          <h1 className="page-title">
            {isTodayFilter ? "Préparations d'aujourd'hui" : "Préparations de véhicules"}
          </h1>
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'preparator') && (
            <Link to="/preparations/create" className="btn btn-primary">
              <i className="fas fa-plus"></i> Nouvelle préparation
            </Link>
          )}
        </div>
        
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}
        
        <div className="filters-section">
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par plaque..."
                className="search-input"
              />
              <button type="submit" className="search-button">Rechercher</button>
            </form>
            {isSearching && (
              <button onClick={resetSearch} className="reset-button">
                Réinitialiser
              </button>
            )}
          </div>
          
          <div className="filter-container">
            <label htmlFor="statusFilter" className="filter-label">Filtrer par statut:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleFilterChange}
              className="status-filter"
            >
              <option value="">Tous</option>
              <option value="pending">En attente</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminées</option>
            </select>
            
            {isTodayFilter && (
              <div className="active-filter">
                <span className="filter-badge">Aujourd'hui seulement</span>
                <button 
                  onClick={resetTodayFilter} 
                  className="reset-filter-btn"
                  title="Voir toutes les préparations"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : preparations.length > 0 ? (
          <div className="preparations-list">
            {preparations.map((preparation) => (
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
            
            {!isSearching && !isTodayFilter && (
              <div className="pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="pagination-button"
                >
                  Précédent
                </button>
                <span className="page-info">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="pagination-button"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="no-results">
            <p>
              {isTodayFilter 
                ? "Aucune préparation de véhicule pour aujourd'hui."
                : "Aucune préparation de véhicule trouvée."}
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
  );
};

export default PreparationList;