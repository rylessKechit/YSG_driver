// src/components/movement/DatesSection.js
import React from 'react';
import DateDisplay from '../ui/DateDisplay';

const DatesSection = ({ movement }) => {
  return (
    <div className="detail-section dates-section">
      <h2 className="section-title">
        <i className="fas fa-calendar-alt"></i> Dates
      </h2>
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