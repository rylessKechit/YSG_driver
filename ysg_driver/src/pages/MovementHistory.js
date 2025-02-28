import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';
import '../styles/MovementHistory.css';

const MovementHistory = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Charger les mouvements
  const loadMovements = async () => {
    try {
      setLoading(true);
      let response;
      
      if (isSearching && searchQuery) {
        response = await movementService.searchByLicensePlate(searchQuery);
      } else {
        response = await movementService.getMovements(page, 10, statusFilter || null);
        setTotalPages(response.totalPages);
      }
      
      setMovements(response.movements);
    } catch (err) {
      console.error('Erreur lors du chargement des mouvements:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Charger les mouvements au montage et quand les filtres changent
  useEffect(() => {
    loadMovements();
  }, [page, statusFilter, isSearching]);

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

  return (
    <div>
      <Navigation />
      
      <div className="history-container">
        <h1 className="page-title">Historique des trajets</h1>
        
        {error && (
          <div className="error-message">
            {error}
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
              <option value="completed">Terminés</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : movements.length > 0 ? (
          <div className="movements-list">
            {movements.map((movement) => (
              <div key={movement._id} className="movement-card">
                <div className="movement-header">
                  <h2 className="movement-plate">{movement.licensePlate}</h2>
                  <span className={`movement-status status-${movement.status}`}>
                    {movement.status === 'pending' && 'En attente'}
                    {movement.status === 'in-progress' && 'En cours'}
                    {movement.status === 'completed' && 'Terminé'}
                  </span>
                </div>
                
                {movement.vehicleModel && (
                  <p className="vehicle-model">{movement.vehicleModel}</p>
                )}
                
                <div className="movement-route">
                  <div className="route-point">
                    <div className="point-icon departure-icon"></div>
                    <div className="point-details">
                      <p className="point-label">Départ:</p>
                      <p className="point-name">{movement.departureLocation.name}</p>
                      <p className="point-time">
                        {movement.departureTime ? formatDate(movement.departureTime) : 'Non démarré'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="route-line"></div>
                  
                  <div className="route-point">
                    <div className="point-icon arrival-icon"></div>
                    <div className="point-details">
                      <p className="point-label">Arrivée:</p>
                      <p className="point-name">{movement.arrivalLocation.name}</p>
                      <p className="point-time">
                        {movement.arrivalTime ? formatDate(movement.arrivalTime) : 'Non terminé'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="movement-footer">
                  <p className="movement-date">
                    Créé le {formatDate(movement.createdAt)}
                  </p>
                  <Link to={`/movement/${movement._id}`} className="view-details-link">
                    Voir les détails
                  </Link>
                </div>
              </div>
            ))}
            
            {!isSearching && (
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
            <p>Aucun mouvement de véhicule trouvé.</p>
            <Link to="/movement/new" className="btn btn-primary">
              Créer un nouveau trajet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovementHistory;