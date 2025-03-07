// src/components/dashboard/PreparationCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const PreparationCard = ({ preparation }) => {
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

  // Calculer le nombre de tâches complétées
  const getCompletedTasks = () => {
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
    <div className="preparation-card">
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
          <div className="info-value">{getCompletedTasks()}</div>
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
  );
};

export default PreparationCard;