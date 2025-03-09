// src/components/dashboard/MovementCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const MovementCard = ({ movement, actionButton }) => {
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

  // Vérifier si la deadline est proche (moins de 24h)
  const isDeadlineUrgent = () => {
    if (!movement.deadline) return false;
    
    const deadline = new Date(movement.deadline);
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    // Moins de 24 heures
    return timeUntilDeadline > 0 && timeUntilDeadline < 24 * 60 * 60 * 1000;
  };

  // Vérifier si la deadline est expirée
  const isDeadlineExpired = () => {
    if (!movement.deadline) return false;
    
    const deadline = new Date(movement.deadline);
    const now = new Date();
    return deadline < now;
  };

  // Déterminer la classe de la carte en fonction de la deadline
  const getCardClass = () => {
    if (isDeadlineExpired()) return "movement-card deadline-expired";
    if (isDeadlineUrgent()) return "movement-card deadline-urgent";
    return "movement-card";
  };

  return (
    <div className={getCardClass()}>
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
          {movement.status === 'preparing' && <><i className="fas fa-tools"></i> En préparation</>}
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
      
      {/* Affichage de la deadline si elle existe */}
      {movement.deadline && (
        <div className={`deadline-info ${isDeadlineUrgent() ? 'urgent' : ''} ${isDeadlineExpired() ? 'expired' : ''}`}>
          <i className="fas fa-clock"></i>
          <span>
            {isDeadlineExpired() 
              ? `Deadline expirée: ${formatDate(movement.deadline)}` 
              : `Deadline: ${formatDate(movement.deadline)}`}
          </span>
        </div>
      )}
      
      <div className="movement-footer">
        <div className="movement-date">
          {movement.status === 'completed' 
            ? `Terminé le ${formatDate(movement.arrivalTime || movement.updatedAt)}` 
            : `Créé le ${formatDate(movement.createdAt)}`}
        </div>
        
        {actionButton ? (
          actionButton
        ) : (
          <Link to={`/movement/${movement._id}`} className="view-details">
            Voir les détails <i className="fas fa-chevron-right"></i>
          </Link>
        )}
      </div>
    </div>
  );
};

export default MovementCard;