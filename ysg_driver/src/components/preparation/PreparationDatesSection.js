// src/components/preparation/PreparationDatesSection.js ou src/components/movement/DatesSection.js
import React from 'react';

const PreparationDatesSection = ({ preparation }) => {
  const formatDate = (date) => {
    if (!date) return 'Non disponible';
    
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dates-section-cross">
      <div className="dates-title">
        <i className="fas fa-calendar-alt"></i>
        <span>Dates</span>
      </div>
      
      <div className="dates-cross-layout">
        <div className="date-row top-row">
          <div className="date-box">
            <div className="date-label">Créée le:</div>
            <div className="date-value">{formatDate(preparation.createdAt)}</div>
          </div>
          
          <div className="date-box">
            <div className="date-label">Débutée le:</div>
            <div className="date-value">{formatDate(preparation.startTime)}</div>
          </div>
        </div>
        
        <div className="date-row bottom-row">
          <div className="date-box">
            <div className="date-label">Terminée le:</div>
            <div className="date-value">{formatDate(preparation.endTime)}</div>
          </div>
          
          <div className="date-box">
            <div className="date-label">Dernière modification:</div>
            <div className="date-value">{formatDate(preparation.updatedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationDatesSection;