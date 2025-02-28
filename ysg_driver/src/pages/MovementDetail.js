// src/pages/MovementDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';
import '../styles/MovementDetail.css';

const MovementDetail = () => {
  const { id } = useParams();
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const navigate = useNavigate();

  // Charger les détails du mouvement
  useEffect(() => {
    const fetchMovementDetails = async () => {
      try {
        setLoading(true);
        const data = await movementService.getMovement(id);
        setMovement(data);
        
        if (data.notes) {
          setNotes(data.notes);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des détails du mouvement:', err);
        setError('Erreur lors du chargement des détails du mouvement');
      } finally {
        setLoading(false);
      }
    };

    fetchMovementDetails();
  }, [id]);

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

  // Gérer le changement de statut du mouvement
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdateLoading(true);
      
      if (newStatus === 'in-progress') {
        await movementService.startMovement(id);
      } else if (newStatus === 'completed') {
        await movementService.completeMovement(id, notes);
      }
      
      // Recharger les détails du mouvement
      const updatedMovement = await movementService.getMovement(id);
      setMovement(updatedMovement);
      
      setUpdateSuccess(`Statut mis à jour avec succès : ${
        newStatus === 'in-progress' ? 'En cours' : 'Terminé'
      }`);
      
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Gérer le changement des notes
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  // Ouvrir l'image en plein écran
  const openFullScreenImage = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navigation />
        <div className="detail-container">
          <div className="error-message">
            {error}
          </div>
          <div className="back-button-container">
            <button 
              onClick={() => navigate('/movement/history')}
              className="btn btn-primary"
            >
              Retour à l'historique
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!movement) {
    return (
      <div>
        <Navigation />
        <div className="detail-container">
          <div className="error-message">
            Mouvement non trouvé
          </div>
          <div className="back-button-container">
            <button 
              onClick={() => navigate('/movement/history')}
              className="btn btn-primary"
            >
              Retour à l'historique
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="detail-container">
        <div className="detail-header">
          <h1 className="detail-title">Détails du mouvement</h1>
          <Link to="/movement/history" className="back-link">
            Retour à l'historique
          </Link>
        </div>
        
        {updateSuccess && (
          <div className="success-message">
            {updateSuccess}
          </div>
        )}
        
        <div className="detail-card">
          <div className="detail-section vehicle-info">
            <h2 className="section-title">Informations du véhicule</h2>
            <div className="info-item">
              <span className="info-label">Plaque d'immatriculation:</span>
              <span className="info-value highlight">{movement.licensePlate}</span>
            </div>
            {movement.vehicleModel && (
              <div className="info-item">
                <span className="info-label">Modèle:</span>
                <span className="info-value">{movement.vehicleModel}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Statut:</span>
              <span className={`status-badge status-${movement.status}`}>
                {movement.status === 'pending' && 'En attente'}
                {movement.status === 'in-progress' && 'En cours'}
                {movement.status === 'completed' && 'Terminé'}
              </span>
            </div>
          </div>
          
          <div className="detail-section route-info">
            <h2 className="section-title">Itinéraire</h2>
            <div className="route-map">
              <div className="route-point">
                <div className="point-marker departure"></div>
                <div className="point-details">
                  <div className="point-type">Départ</div>
                  <div className="point-name">{movement.departureLocation.name}</div>
                  <div className="point-time">
                    {formatDate(movement.departureTime)}
                  </div>
                  {movement.departureLocation.coordinates && (
                    <div className="point-coordinates">
                      Lat: {movement.departureLocation.coordinates.latitude}, 
                      Lng: {movement.departureLocation.coordinates.longitude}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="route-line"></div>
              
              <div className="route-point">
                <div className="point-marker arrival"></div>
                <div className="point-details">
                  <div className="point-type">Arrivée</div>
                  <div className="point-name">{movement.arrivalLocation.name}</div>
                  <div className="point-time">
                    {formatDate(movement.arrivalTime)}
                  </div>
                  {movement.arrivalLocation.coordinates && (
                    <div className="point-coordinates">
                      Lat: {movement.arrivalLocation.coordinates.latitude}, 
                      Lng: {movement.arrivalLocation.coordinates.longitude}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="detail-section photos-section">
            <h2 className="section-title">Photos</h2>
            {movement.photos && movement.photos.length > 0 ? (
              <div className="photos-grid">
                {movement.photos.map((photo, index) => (
                  <div key={index} className="photo-item" onClick={() => openFullScreenImage(photo.url)}>
                    <img src={photo.url} alt={`Photo ${index + 1}`} className="movement-photo" />
                    <div className="photo-info">
                      <span className={`photo-type ${photo.type}`}>
                        {photo.type === 'departure' && 'Départ'}
                        {photo.type === 'arrival' && 'Arrivée'}
                        {photo.type === 'damage' && 'Dommage'}
                        {photo.type === 'other' && 'Autre'}
                      </span>
                      <span className="photo-time">
                        {formatDate(photo.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-photos-message">Aucune photo disponible</p>
            )}
          </div>
          
          <div className="detail-section notes-section">
            <h2 className="section-title">Notes</h2>
            {movement.status !== 'completed' ? (
              <textarea
                value={notes}
                onChange={handleNotesChange}
                className="notes-textarea"
                placeholder="Ajouter des notes concernant ce mouvement..."
                rows="4"
              ></textarea>
            ) : (
              <div className="notes-content">
                {movement.notes ? movement.notes : 'Aucune note disponible'}
              </div>
            )}
          </div>
          
          <div className="detail-section dates-section">
            <h2 className="section-title">Dates</h2>
            <div className="dates-grid">
              <div className="date-item">
                <span className="date-label">Créé le:</span>
                <span className="date-value">{formatDate(movement.createdAt)}</span>
              </div>
              <div className="date-item">
                <span className="date-label">Dernière modification:</span>
                <span className="date-value">{formatDate(movement.updatedAt)}</span>
              </div>
              <div className="date-item">
                <span className="date-label">Heure de départ:</span>
                <span className="date-value">{formatDate(movement.departureTime)}</span>
              </div>
              <div className="date-item">
                <span className="date-label">Heure d'arrivée:</span>
                <span className="date-value">{formatDate(movement.arrivalTime)}</span>
              </div>
            </div>
          </div>
          
          {movement.status !== 'completed' && (
            <div className="detail-actions">
              {movement.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  className="btn btn-primary"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'En cours...' : 'Démarrer le trajet'}
                </button>
              )}
              
              {movement.status === 'in-progress' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="btn btn-success"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'En cours...' : 'Terminer le trajet'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovementDetail;