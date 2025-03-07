// src/components/preparation/PreparationTaskSection.js
import React, { useState } from 'react';

const PreparationTaskSection = ({ 
  preparation, 
  taskType, 
  expandedTask, 
  onToggleTask, 
  canEdit, 
  onStartTask, 
  onCompleteTask, 
  onAddTaskPhoto, 
  onParkingTask,
  onResetPhotoStatus,
  uploadingPhoto,
  getPhotoUrlByType
}) => {
  const [photoBeforeFile, setPhotoBeforeFile] = useState(null);
  const [photoBeforePreview, setPhotoBeforePreview] = useState(null);
  const [photoAfterFile, setPhotoAfterFile] = useState(null);
  const [photoAfterPreview, setPhotoAfterPreview] = useState(null);
  const [additionalPhotoFile, setAdditionalPhotoFile] = useState(null);
  const [additionalPhotoPreview, setAdditionalPhotoPreview] = useState(null);
  const [additionalPhotoDescription, setAdditionalPhotoDescription] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [refuelingAmount, setRefuelingAmount] = useState('');

  // Gestion des photos
  const handlePhotoBeforeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoBeforeFile(file);
      
      // Créer une URL pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setPhotoBeforePreview(previewUrl);
    }
  };

  const handlePhotoAfterChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoAfterFile(file);
      
      // Créer une URL pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setPhotoAfterPreview(previewUrl);
    }
  };

  const handleAdditionalPhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdditionalPhotoFile(file);
      
      // Créer une URL pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setAdditionalPhotoPreview(previewUrl);
    }
  };

  // Gérer le début d'une tâche
  const handleStartTask = () => {
    onStartTask(taskType, photoBeforeFile, taskNotes);
    setPhotoBeforeFile(null);
    setPhotoBeforePreview(null);
    setTaskNotes('');
  };

  // Gérer la fin d'une tâche
  const handleCompleteTask = () => {
    const additionalData = { notes: taskNotes };
    if (taskType === 'refueling' && refuelingAmount) {
      additionalData.amount = refuelingAmount;
    }
    
    onCompleteTask(taskType, photoAfterFile, additionalData);
    setPhotoAfterFile(null);
    setPhotoAfterPreview(null);
    setTaskNotes('');
    setRefuelingAmount('');
  };

  // Gérer l'ajout d'une photo additionnelle
  const handleAddAdditionalPhoto = () => {
    onAddTaskPhoto(taskType, additionalPhotoFile, additionalPhotoDescription);
    setAdditionalPhotoFile(null);
    setAdditionalPhotoPreview(null);
    setAdditionalPhotoDescription('');
  };

  // Gérer le stationnement en une étape
  const handleParkingTask = () => {
    onParkingTask(taskType, photoAfterFile, taskNotes);
    setPhotoAfterFile(null);
    setPhotoAfterPreview(null);
    setTaskNotes('');
  };

  // Obtenir le libellé d'une tâche
  const getTaskLabel = (taskType) => {
    switch (taskType) {
      case 'exteriorWashing': return 'Lavage extérieur';
      case 'interiorCleaning': return 'Nettoyage intérieur';
      case 'refueling': return 'Mise de carburant';
      case 'parking': return 'Stationnement';
      default: return 'Tâche inconnue';
    }
  };

  // Obtenir le libellé du statut d'une tâche
  const getTaskStatusLabel = (status) => {
    switch (status) {
      case 'not_started': return 'Non commencée';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      default: return 'Statut inconnu';
    }
  };

  // Ouvrir l'image en plein écran
  const openFullScreenImage = (url) => {
    window.open(url, '_blank');
  };

  const task = preparation.tasks[taskType] || { status: 'not_started' };
  const isExpanded = expandedTask === taskType;

  return (
    <div className="task-card">
      <div 
        className={`task-header ${isExpanded ? 'expanded' : ''}`}
        onClick={() => onToggleTask(taskType)}
      >
        <h3 className="task-title">{getTaskLabel(taskType)}</h3>
        <div className="task-header-info">
          <span className={`task-status ${task.status}`}>
            {getTaskStatusLabel(task.status)}
          </span>
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </div>
      </div>
      
      {isExpanded && (
        <div className="task-content">
          {task.startedAt && (
            <div className="task-info">
              <i className="fas fa-clock"></i> Commencée: {new Date(task.startedAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
          
          {task.completedAt && (
            <div className="task-info">
              <i className="fas fa-check-circle"></i> Terminée: {new Date(task.completedAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
          
          {taskType === 'refueling' && task.amount && (
            <div className="task-info">
              <i className="fas fa-gas-pump"></i> Quantité: {task.amount} L
            </div>
          )}
          
          {task.notes && (
            <div className="task-notes">
              <strong>Notes:</strong> {task.notes}
            </div>
          )}
          
          {/* Photos avant/après si complétées */}
          {(task.photos?.before || task.photos?.after) && (
            <div className="task-photos">
              {task.photos.before && (
                <div className="photo-container">
                  <div className="photo-header">Photo avant</div>
                  <img 
                    src={task.photos.before.url} 
                    alt="Avant" 
                    className="photo-image"
                    onClick={() => openFullScreenImage(task.photos.before.url)}
                  />
                  <div className="photo-timestamp">
                    {new Date(task.photos.before.timestamp).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              
              {task.photos.after && (
                <div className="photo-container">
                  <div className="photo-header">Photo après</div>
                  <img 
                    src={task.photos.after.url} 
                    alt="Après" 
                    className="photo-image" 
                    onClick={() => openFullScreenImage(task.photos.after.url)}
                  />
                  <div className="photo-timestamp">
                    {new Date(task.photos.after.timestamp).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Photos additionnelles */}
          {task.photos?.additional && 
           task.photos.additional.length > 0 && (
            <div className="additional-photos">
              <div className="additional-photos-title">Photos additionnelles ({task.photos.additional.length})</div>
              <div className="additional-photos-grid">
                {task.photos.additional.map((photo, index) => (
                  <div key={index} className="additional-photo-item">
                    <img 
                      src={photo.url} 
                      alt={`Photo additionnelle ${index + 1}`} 
                      className="additional-photo-img" 
                      onClick={() => openFullScreenImage(photo.url)}
                    />
                    {photo.description && (
                      <div className="additional-photo-description">
                        {photo.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Message pour tâche non démarrée */}
          {task.status === 'not_started' && 
           !task.startedAt && (
            <div className="task-not-started-message">
              <i className="fas fa-info-circle"></i>
              <span>Cette tâche n'a pas encore été démarrée.</span>
            </div>
          )}
          
          {/* Actions selon le statut de la tâche */}
          {canEdit && preparation.status !== 'completed' && (
            <div className="task-actions">
              {/* CAS 1: Démarrer une tâche normale */}
              {task.status === 'not_started' && taskType !== 'parking' && (
                <div className="task-step">
                  <div className="task-step-header">
                    <span className="step-number">1</span>
                    <span>Commencer {getTaskLabel(taskType).toLowerCase()}</span>
                  </div>
                  
                  <p>Prenez une photo de l'état initial avant de commencer la tâche.</p>
                  
                  <div className="task-photo-upload">
                    <input 
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoBeforeChange}
                      className="form-input"
                    />
                    
                    {photoBeforePreview && (
                      <div className="photo-preview-container">
                        <div className="photo-preview">
                          <img src={photoBeforePreview} alt="Prévisualisation avant" />
                        </div>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Notes (optionnel)</label>
                      <textarea
                        value={taskNotes}
                        onChange={(e) => setTaskNotes(e.target.value)}
                        className="form-textarea"
                        placeholder="Observations sur l'état initial..."
                      />
                    </div>
                    
                    <button 
                      onClick={handleStartTask}
                      className="btn btn-primary"
                      disabled={!photoBeforeFile || uploadingPhoto}
                    >
                      {uploadingPhoto ? 'Traitement...' : `Commencer ${getTaskLabel(taskType).toLowerCase()}`}
                    </button>
                  </div>
                </div>
              )}
              
              {/* CAS 2: Terminer une tâche normale */}
              {task.status === 'in_progress' && taskType !== 'parking' && (
                <div className="task-step">
                  <div className="task-step-header">
                    <span className="step-number">2</span>
                    <span>Terminer {getTaskLabel(taskType).toLowerCase()}</span>
                  </div>
                  
                  <p>Prenez une photo pour documenter le travail effectué.</p>
                  
                  <div className="task-photo-upload">
                    <input 
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoAfterChange}
                      className="form-input"
                    />
                    
                    {photoAfterPreview && (
                      <div className="photo-preview-container">
                        <div className="photo-preview">
                          <img src={photoAfterPreview} alt="Prévisualisation après" />
                        </div>
                      </div>
                    )}
                    
                    {/* Champ spécifique pour la quantité de carburant */}
                    {taskType === 'refueling' && (
                      <div className="form-group">
                        <label className="form-label">Quantité de carburant (litres) *</label>
                        <input
                          type="number"
                          value={refuelingAmount}
                          onChange={(e) => setRefuelingAmount(e.target.value)}
                          className="form-input"
                          step="0.01"
                          min="0"
                          placeholder="Ex: 45.5"
                          required
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Notes (optionnel)</label>
                      <textarea
                        value={taskNotes}
                        onChange={(e) => setTaskNotes(e.target.value)}
                        className="form-textarea"
                        placeholder="Observations sur le travail effectué..."
                      />
                    </div>
                    
                    <button 
                      onClick={handleCompleteTask}
                      className="btn btn-success"
                      disabled={!photoAfterFile || (taskType === 'refueling' && !refuelingAmount) || uploadingPhoto}
                    >
                      {uploadingPhoto ? 'Traitement...' : `Terminer ${getTaskLabel(taskType).toLowerCase()}`}
                    </button>
                  </div>
                </div>
              )}
              
              {/* CAS 3: Stationnement (cas spécial) */}
              {(!task || task.status === 'not_started') && taskType === 'parking' && (
                <div className="task-step">
                  <div className="task-step-header">
                    <span className="step-number">1</span>
                    <span>Valider le stationnement</span>
                  </div>
                  
                  <p>Prenez une photo du véhicule garé correctement pour valider cette tâche.</p>
                  
                  <div className="task-photo-upload">
                    <input 
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoAfterChange}
                      className="form-input"
                    />
                    
                    {photoAfterPreview && (
                      <div className="photo-preview-container">
                        <div className="photo-preview">
                          <img src={photoAfterPreview} alt="Prévisualisation du stationnement" />
                        </div>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Notes (optionnel)</label>
                      <textarea
                        value={taskNotes}
                        onChange={(e) => setTaskNotes(e.target.value)}
                        className="form-textarea"
                        placeholder="Observations sur le stationnement effectué..."
                      />
                    </div>
                    
                    <button 
                      onClick={handleParkingTask}
                      className="btn btn-success"
                      disabled={!photoAfterFile || uploadingPhoto}
                    >
                      {uploadingPhoto ? 'Traitement...' : 'Valider le stationnement'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Formulaire pour ajouter une photo additionnelle */}
              {(task.status === 'in_progress' || task.status === 'completed') && (
                <div className="task-step">
                  <div className="task-step-header">
                    <span className="step-number">+</span>
                    <span>Ajouter une photo additionnelle (optionnel)</span>
                  </div>
                  
                  <div className="task-photo-upload">
                    <input 
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleAdditionalPhotoChange}
                      className="form-input"
                    />
                    
                    {additionalPhotoPreview && (
                      <div className="photo-preview-container">
                        <div className="photo-preview">
                          <img src={additionalPhotoPreview} alt="Prévisualisation additionnelle" />
                        </div>
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        value={additionalPhotoDescription}
                        onChange={(e) => setAdditionalPhotoDescription(e.target.value)}
                        className="form-input"
                        placeholder="Description de la photo..."
                      />
                    </div>
                    
                    <button 
                      onClick={handleAddAdditionalPhoto}
                      className="btn btn-photo"
                      disabled={!additionalPhotoFile || uploadingPhoto}
                    >
                      {uploadingPhoto ? 'Traitement...' : 'Ajouter la photo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreparationTaskSection;