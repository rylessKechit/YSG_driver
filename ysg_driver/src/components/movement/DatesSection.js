// src/components/movement/DatesSection.js
import React from 'react';
import DateDisplay from '../ui/DateDisplay';

const DatesSection = ({ movement }) => {
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

  return (
    <div className="detail-section dates-section">
      <h2 className="section-title">
        <i className="fas fa-calendar-alt"></i> Dates
      </h2>
      
      {/* Affichage de la deadline avec style spécial si urgente/expirée */}
      {movement.deadline && (
        <div className={`deadline-detail ${isDeadlineUrgent() ? 'urgent' : ''} ${isDeadlineExpired() ? 'expired' : ''}`}>
          <span className="deadline-label">
            <i className="fas fa-clock"></i>
            {isDeadlineExpired() ? ' Deadline (expirée):' : ' Deadline:'}
          </span>
          <span className="deadline-value">
            <DateDisplay date={movement.deadline} />
          </span>
        </div>
      )}
      
      <div className="dates-grid">
        <div className="date-item">
          <span className="date-label">Créé le:</span>
          <span className="date-value">
            <DateDisplay date={movement.createdAt} />
          </span>
        </div>
        <div className="date-item">
          <span className="date-label">Dernière modification:</span>
          <span className="date-value">
            <DateDisplay date={movement.updatedAt} />
          </span>
        </div>
        <div className="date-item">
          <span className="date-label">Heure de départ:</span>
          <span className="date-value">
            <DateDisplay date={movement.departureTime} />
          </span>
        </div>
        <div className="date-item">
          <span className="date-label">Heure d'arrivée:</span>
          <span className="date-value">
            <DateDisplay date={movement.arrivalTime} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default DatesSection;