import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import preparationService from '../services/preparationService';
import Navigation from '../components/Navigation';
import '../styles/PreparationDetail.css';

const PreparationDetail = () => {
  const { id } = useParams();
  const [preparation, setPreparation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notes, setNotes] = useState('');
  
  // État pour les photos et formulaires
  const [photoBeforeFile, setPhotoBeforeFile] = useState(null);
  const [photoBeforePreview, setPhotoBeforePreview] = useState(null);
  const [photoAfterFile, setPhotoAfterFile] = useState(null);
  const [photoAfterPreview, setPhotoAfterPreview] = useState(null);
  const [additionalPhotoFile, setAdditionalPhotoFile] = useState(null);
  const [additionalPhotoPreview, setAdditionalPhotoPreview] = useState(null);
  const [additionalPhotoDescription, setAdditionalPhotoDescription] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [currentTask, setCurrentTask] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  
  // Nouvel état pour l'accordéon des tâches
  const [expandedTask, setExpandedTask] = useState(null);
  
  // États pour les données spécifiques aux tâches
  const [refuelingAmount, setRefuelingAmount] = useState('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Chargement initial des données
  useEffect(() => {
    loadPreparation();
  }, [id]);

  // Charger les détails de la préparation
  const loadPreparation = async () => {
    try {
      setLoading(true);
      const data = await preparationService.getPreparation(id);
      setPreparation(data);
      
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails de la préparation:', err);
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de fichier photo "before"
  const handlePhotoBeforeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoBeforeFile(file);
      
      // Créer une URL pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setPhotoBeforePreview(previewUrl);
      
      // Nettoyer l'URL lors du démontage pour éviter les fuites mémoire
      return () => URL.revokeObjectURL(previewUrl);
    }
  };

  // Gérer le changement de fichier photo "after"
  const handlePhotoAfterChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoAfterFile(file);
      
      // Créer une URL pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setPhotoAfterPreview(previewUrl);
      
      // Nettoyer l'URL lors du démontage pour éviter les fuites mémoire
      return () => URL.revokeObjectURL(previewUrl);
    }
  };

  // Gérer le changement de fichier photo additionnelle
  const handleAdditionalPhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdditionalPhotoFile(file);
      
      // Créer une URL pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setAdditionalPhotoPreview(previewUrl);
      
      // Nettoyer l'URL lors du démontage pour éviter les fuites mémoire
      return () => URL.revokeObjectURL(previewUrl);
    }
  };

  // Gérer le clic sur une tâche pour l'étendre/réduire
  const toggleTaskExpansion = (taskType) => {
    if (expandedTask === taskType) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskType);
    }
  };

  // Commencer une tâche
  const handleStartTask = async (taskType) => {
    if (!photoBeforeFile) {
      setError('Vous devez prendre une photo de l\'état initial avant de commencer la tâche');
      return;
    }
    
    try {
      setTaskLoading(true);
      setError(null);
      
      await preparationService.startTask(id, taskType, photoBeforeFile, taskNotes);
      
      setSuccess(`Tâche ${getTaskLabel(taskType)} commencée avec succès`);
      
      // Réinitialiser les états
      setPhotoBeforeFile(null);
      setPhotoBeforePreview(null);
      setTaskNotes('');
      
      // Recharger la préparation pour afficher les changements
      await loadPreparation();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors du démarrage de la tâche:', err);
      setError(err.response?.data?.message || 'Erreur lors du démarrage de la tâche');
    } finally {
      setTaskLoading(false);
    }
  };

  // Terminer une tâche
  const handleCompleteTask = async (taskType) => {
    if (!photoAfterFile) {
      setError('Vous devez prendre une photo de l\'état final pour terminer la tâche');
      return;
    }
    
    try {
      setTaskLoading(true);
      setError(null);
      
      // Préparer les données additionnelles selon le type de tâche
      let additionalData = { notes: taskNotes };
      
      if (taskType === 'refueling' && refuelingAmount) {
        additionalData.amount = refuelingAmount;
      }
      
      await preparationService.completeTask(id, taskType, photoAfterFile, additionalData);
      
      setSuccess(`Tâche ${getTaskLabel(taskType)} terminée avec succès`);
      
      // Réinitialiser les états
      setPhotoAfterFile(null);
      setPhotoAfterPreview(null);
      setTaskNotes('');
      setRefuelingAmount('');
      
      // Recharger la préparation pour afficher les changements
      await loadPreparation();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la finalisation de la tâche:', err);
      setError(err.response?.data?.message || 'Erreur lors de la finalisation de la tâche');
    } finally {
      setTaskLoading(false);
    }
  };

  // Ajouter une photo additionnelle
  const handleAddAdditionalPhoto = async (taskType) => {
    if (!additionalPhotoFile) {
      setError('Veuillez sélectionner une photo à ajouter');
      return;
    }
    
    try {
      setTaskLoading(true);
      setError(null);
      
      await preparationService.addTaskPhoto(id, taskType, additionalPhotoFile, additionalPhotoDescription);
      
      setSuccess('Photo additionnelle ajoutée avec succès');
      
      // Réinitialiser les états
      setAdditionalPhotoFile(null);
      setAdditionalPhotoPreview(null);
      setAdditionalPhotoDescription('');
      
      // Recharger la préparation pour afficher les changements
      await loadPreparation();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la photo:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout de la photo');
    } finally {
      setTaskLoading(false);
    }
  };

  // Terminer la préparation
  const handleCompletePreparation = async () => {
    try {
      setLoading(true);
      
      await preparationService.completePreparation(id, { notes });
      await loadPreparation();
      
      setSuccess('Préparation terminée avec succès');
      setTimeout(() => {
        setSuccess(null);
        navigate('/preparations');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la finalisation de la préparation:', err);
      setError('Erreur lors de la finalisation de la préparation');
      setLoading(false);
    }
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

  // Obtenir le libellé d'une tâche
  const getTaskLabel = (taskType) => {
    switch (taskType) {
      case 'exteriorWashing': return 'Lavage extérieur';
      case 'interiorCleaning': return 'Nettoyage intérieur';
      case 'refueling': return 'Mise de carburant';
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

  // Vérifier si l'utilisateur peut éditer (préparateur assigné ou admin)
  const canEdit = () => {
    if (!preparation || !currentUser) return false;
    
    return (
      (preparation.userId && preparation.userId._id === currentUser._id) || 
      currentUser.role === 'admin'
    );
  };

  // Vérifier si au moins une tâche est complétée
  const hasCompletedTasks = () => {
    if (!preparation) return false;
    
    return Object.values(preparation.tasks).some(task => task.status === 'completed');
  };

  if (loading && !preparation) {
    return (
      <div>
        <Navigation />
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !preparation) {
    return (
      <div>
        <Navigation />
        <div className="preparation-detail-container">
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
          <div className="back-button-container">
            <button 
              onClick={() => navigate('/preparations')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!preparation) {
    return (
      <div>
        <Navigation />
        <div className="preparation-detail-container">
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">Préparation non trouvée</div>
          </div>
          <div className="back-button-container">
            <button 
              onClick={() => navigate('/preparations')}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="preparation-detail-container">
        <div className="detail-header">
          <h1 className="detail-title">Détails de la préparation</h1>
          <Link to="/preparations" className="back-link">
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </Link>
        </div>
        
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✓</div>
            <div className="alert-content">{success}</div>
          </div>
        )}
        
        <div className="detail-card">
          <div className="detail-section vehicle-info">
            <h2 className="section-title">
              <i className="fas fa-car"></i> Informations du véhicule
            </h2>
            <div className="info-item">
              <span className="info-label">Plaque d'immatriculation:</span>
              <span className="info-value highlight">{preparation.licensePlate}</span>
            </div>
            {preparation.vehicleModel && (
              <div className="info-item">
                <span className="info-label">Modèle:</span>
                <span className="info-value">{preparation.vehicleModel}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Statut:</span>
              <span className={`status-badge status-${preparation.status}`}>
                {preparation.status === 'pending' && 'En attente'}
                {preparation.status === 'in-progress' && 'En cours'}
                {preparation.status === 'completed' && 'Terminée'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Préparateur:</span>
              <span className="info-value">
                {preparation.userId ? preparation.userId.fullName : 'Non assigné'}
              </span>
            </div>
          </div>
          
          <div className="detail-section tasks-section">
            <h2 className="section-title">
              <i className="fas fa-tasks"></i> Tâches de préparation
            </h2>
            
            <div className="task-grid">
              {/* Lavage extérieur */}
              <div className="task-card">
                <div 
                  className={`task-header ${expandedTask === 'exteriorWashing' ? 'expanded' : ''}`}
                  onClick={() => toggleTaskExpansion('exteriorWashing')}
                >
                  <h3 className="task-title">Lavage extérieur</h3>
                  <div className="task-header-info">
                    <span className={`task-status ${preparation.tasks.exteriorWashing.status}`}>
                      {getTaskStatusLabel(preparation.tasks.exteriorWashing.status)}
                    </span>
                    <i className={`fas fa-chevron-${expandedTask === 'exteriorWashing' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedTask === 'exteriorWashing' && (
                  <div className="task-content">
                    {preparation.tasks.exteriorWashing.startedAt && (
                      <div className="task-info">
                        <i className="fas fa-clock"></i> Commencée: {formatDate(preparation.tasks.exteriorWashing.startedAt)}
                      </div>
                    )}
                    
                    {preparation.tasks.exteriorWashing.completedAt && (
                      <div className="task-info">
                        <i className="fas fa-check-circle"></i> Terminée: {formatDate(preparation.tasks.exteriorWashing.completedAt)}
                      </div>
                    )}
                    
                    {preparation.tasks.exteriorWashing.notes && (
                      <div className="task-notes">
                        <strong>Notes:</strong> {preparation.tasks.exteriorWashing.notes}
                      </div>
                    )}
                    
                    {/* Photos avant/après si complétées */}
                    {(preparation.tasks.exteriorWashing.photos?.before || preparation.tasks.exteriorWashing.photos?.after) && (
                      <div className="task-photos">
                        {preparation.tasks.exteriorWashing.photos.before && (
                          <div className="photo-container">
                            <div className="photo-header">Photo avant</div>
                            <img 
                              src={preparation.tasks.exteriorWashing.photos.before.url} 
                              alt="Avant lavage" 
                              className="photo-image"
                              onClick={() => openFullScreenImage(preparation.tasks.exteriorWashing.photos.before.url)}
                            />
                            <div className="photo-timestamp">
                              {formatDate(preparation.tasks.exteriorWashing.photos.before.timestamp)}
                            </div>
                          </div>
                        )}
                        
                        {preparation.tasks.exteriorWashing.photos.after && (
                          <div className="photo-container">
                            <div className="photo-header">Photo après</div>
                            <img 
                              src={preparation.tasks.exteriorWashing.photos.after.url} 
                              alt="Après lavage" 
                              className="photo-image" 
                              onClick={() => openFullScreenImage(preparation.tasks.exteriorWashing.photos.after.url)}
                            />
                            <div className="photo-timestamp">
                              {formatDate(preparation.tasks.exteriorWashing.photos.after.timestamp)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Photos additionnelles */}
                    {preparation.tasks.exteriorWashing.photos?.additional && 
                     preparation.tasks.exteriorWashing.photos.additional.length > 0 && (
                      <div className="additional-photos">
                        <div className="additional-photos-title">Photos additionnelles ({preparation.tasks.exteriorWashing.photos.additional.length})</div>
                        <div className="additional-photos-grid">
                          {preparation.tasks.exteriorWashing.photos.additional.map((photo, index) => (
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
                    {preparation.tasks.exteriorWashing.status === 'not_started' && 
                     !preparation.tasks.exteriorWashing.startedAt && (
                      <div className="task-not-started-message">
                        <i className="fas fa-info-circle"></i>
                        <span>Cette tâche n'a pas encore été démarrée.</span>
                      </div>
                    )}
                    
                    {/* Actions selon le statut de la tâche */}
                    {canEdit() && preparation.status !== 'completed' && (
                      <div className="task-actions">
                        {preparation.tasks.exteriorWashing.status === 'not_started' && (
                          <div className="task-step">
                            <div className="task-step-header">
                              <span className="step-number">1</span>
                              <span>Commencer le lavage extérieur</span>
                            </div>
                            
                            <p>Prenez une photo de l'état initial du véhicule avant de commencer le lavage.</p>
                            
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
                                onClick={() => handleStartTask('exteriorWashing')}
                                className="btn btn-primary"
                                disabled={!photoBeforeFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Commencer le lavage'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {preparation.tasks.exteriorWashing.status === 'in_progress' && (
                          <div className="task-step">
                            <div className="task-step-header">
                              <span className="step-number">2</span>
                              <span>Terminer le lavage extérieur</span>
                            </div>
                            
                            <p>Prenez une photo du véhicule après le lavage pour documenter le travail effectué.</p>
                            
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
                                onClick={() => handleCompleteTask('exteriorWashing')}
                                className="btn btn-success"
                                disabled={!photoAfterFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Terminer le lavage'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Formulaire pour ajouter une photo additionnelle (disponible si la tâche est en cours ou terminée) */}
                        {(preparation.tasks.exteriorWashing.status === 'in_progress' || preparation.tasks.exteriorWashing.status === 'completed') && (
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
                                onClick={() => handleAddAdditionalPhoto('exteriorWashing')}
                                className="btn btn-photo"
                                disabled={!additionalPhotoFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Ajouter la photo'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Nettoyage intérieur - Structure similaire */}
              <div className="task-card">
                <div 
                  className={`task-header ${expandedTask === 'interiorCleaning' ? 'expanded' : ''}`}
                  onClick={() => toggleTaskExpansion('interiorCleaning')}
                >
                  <h3 className="task-title">Nettoyage intérieur</h3>
                  <div className="task-header-info">
                    <span className={`task-status ${preparation.tasks.interiorCleaning.status}`}>
                      {getTaskStatusLabel(preparation.tasks.interiorCleaning.status)}
                    </span>
                    <i className={`fas fa-chevron-${expandedTask === 'interiorCleaning' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedTask === 'interiorCleaning' && (
                  <div className="task-content">
                    {preparation.tasks.interiorCleaning.startedAt && (
                      <div className="task-info">
                        <i className="fas fa-clock"></i> Commencée: {formatDate(preparation.tasks.interiorCleaning.startedAt)}
                      </div>
                    )}
                    
                    {preparation.tasks.interiorCleaning.completedAt && (
                      <div className="task-info">
                        <i className="fas fa-check-circle"></i> Terminée: {formatDate(preparation.tasks.interiorCleaning.completedAt)}
                      </div>
                    )}
                    
                    {preparation.tasks.interiorCleaning.notes && (
                      <div className="task-notes">
                        <strong>Notes:</strong> {preparation.tasks.interiorCleaning.notes}
                      </div>
                    )}
                    
                    {/* Photos avant/après si complétées */}
                    {(preparation.tasks.interiorCleaning.photos?.before || preparation.tasks.interiorCleaning.photos?.after) && (
                      <div className="task-photos">
                        {preparation.tasks.interiorCleaning.photos.before && (
                          <div className="photo-container">
                            <div className="photo-header">Photo avant</div>
                            <img 
                              src={preparation.tasks.interiorCleaning.photos.before.url} 
                              alt="Avant nettoyage" 
                              className="photo-image"
                              onClick={() => openFullScreenImage(preparation.tasks.interiorCleaning.photos.before.url)}
                            />
                            <div className="photo-timestamp">
                              {formatDate(preparation.tasks.interiorCleaning.photos.before.timestamp)}
                            </div>
                          </div>
                        )}
                        
                        {preparation.tasks.interiorCleaning.photos.after && (
                          <div className="photo-container">
                            <div className="photo-header">Photo après</div>
                            <img 
                              src={preparation.tasks.interiorCleaning.photos.after.url} 
                              alt="Après nettoyage" 
                              className="photo-image" 
                              onClick={() => openFullScreenImage(preparation.tasks.interiorCleaning.photos.after.url)}
                            />
                            <div className="photo-timestamp">
                              {formatDate(preparation.tasks.interiorCleaning.photos.after.timestamp)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Photos additionnelles */}
                    {preparation.tasks.interiorCleaning.photos?.additional && 
                     preparation.tasks.interiorCleaning.photos.additional.length > 0 && (
                      <div className="additional-photos">
                        <div className="additional-photos-title">Photos additionnelles ({preparation.tasks.interiorCleaning.photos.additional.length})</div>
                        <div className="additional-photos-grid">
                          {preparation.tasks.interiorCleaning.photos.additional.map((photo, index) => (
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
                    {preparation.tasks.interiorCleaning.status === 'not_started' && 
                     !preparation.tasks.interiorCleaning.startedAt && (
                      <div className="task-not-started-message">
                        <i className="fas fa-info-circle"></i>
                        <span>Cette tâche n'a pas encore été démarrée.</span>
                      </div>
                    )}
                    
                    {/* Actions selon le statut de la tâche */}
                    {canEdit() && preparation.status !== 'completed' && (
                      <div className="task-actions">
                        {preparation.tasks.interiorCleaning.status === 'not_started' && (
                          <div className="task-step">
                            <div className="task-step-header">
                              <span className="step-number">1</span>
                              <span>Commencer le nettoyage intérieur</span>
                            </div>
                            
                            <p>Prenez une photo de l'état initial de l'intérieur avant de commencer le nettoyage.</p>
                            
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
                                onClick={() => handleStartTask('interiorCleaning')}
                                className="btn btn-primary"
                                disabled={!photoBeforeFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Commencer le nettoyage'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {preparation.tasks.interiorCleaning.status === 'in_progress' && (
                          <div className="task-step">
                            <div className="task-step-header">
                              <span className="step-number">2</span>
                              <span>Terminer le nettoyage intérieur</span>
                            </div>
                            
                            <p>Prenez une photo de l'intérieur après le nettoyage pour documenter le travail effectué.</p>
                            
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
                                onClick={() => handleCompleteTask('interiorCleaning')}
                                className="btn btn-success"
                                disabled={!photoAfterFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Terminer le nettoyage'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Formulaire pour ajouter une photo additionnelle (disponible si la tâche est en cours ou terminée) */}
                        {(preparation.tasks.interiorCleaning.status === 'in_progress' || preparation.tasks.interiorCleaning.status === 'completed') && (
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
                                onClick={() => handleAddAdditionalPhoto('interiorCleaning')}
                                className="btn btn-photo"
                                disabled={!additionalPhotoFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Ajouter la photo'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Mise de carburant */}
              <div className="task-card">
                <div 
                  className={`task-header ${expandedTask === 'refueling' ? 'expanded' : ''}`}
                  onClick={() => toggleTaskExpansion('refueling')}
                >
                  <h3 className="task-title">Mise de carburant</h3>
                  <div className="task-header-info">
                    <span className={`task-status ${preparation.tasks.refueling.status}`}>
                      {getTaskStatusLabel(preparation.tasks.refueling.status)}
                    </span>
                    <i className={`fas fa-chevron-${expandedTask === 'refueling' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedTask === 'refueling' && (
                  <div className="task-content">
                    {preparation.tasks.refueling.startedAt && (
                      <div className="task-info">
                        <i className="fas fa-clock"></i> Commencée: {formatDate(preparation.tasks.refueling.startedAt)}
                      </div>
                    )}
                    
                    {preparation.tasks.refueling.completedAt && (
                      <div className="task-info">
                        <i className="fas fa-check-circle"></i> Terminée: {formatDate(preparation.tasks.refueling.completedAt)}
                      </div>
                    )}
                    
                    {preparation.tasks.refueling.amount && (
                      <div className="task-info">
                        <i className="fas fa-gas-pump"></i> Quantité: {preparation.tasks.refueling.amount} L
                      </div>
                    )}
                    
                    {preparation.tasks.refueling.notes && (
                      <div className="task-notes">
                        <strong>Notes:</strong> {preparation.tasks.refueling.notes}
                      </div>
                    )}
                    
                    {/* Photos avant/après si complétées */}
                    {(preparation.tasks.refueling.photos?.before || preparation.tasks.refueling.photos?.after) && (
                      <div className="task-photos">
                        {preparation.tasks.refueling.photos.before && (
                          <div className="photo-container">
                            <div className="photo-header">Photo avant</div>
                            <img 
                              src={preparation.tasks.refueling.photos.before.url} 
                              alt="Avant carburant" 
                              className="photo-image"
                              onClick={() => openFullScreenImage(preparation.tasks.refueling.photos.before.url)}
                            />
                            <div className="photo-timestamp">
                              {formatDate(preparation.tasks.refueling.photos.before.timestamp)}
                            </div>
                          </div>
                        )}
                        
                        {preparation.tasks.refueling.photos.after && (
                          <div className="photo-container">
                            <div className="photo-header">Photo après</div>
                            <img 
                              src={preparation.tasks.refueling.photos.after.url} 
                              alt="Après carburant" 
                              className="photo-image" 
                              onClick={() => openFullScreenImage(preparation.tasks.refueling.photos.after.url)}
                            />
                            <div className="photo-timestamp">
                              {formatDate(preparation.tasks.refueling.photos.after.timestamp)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Photos additionnelles */}
                    {preparation.tasks.refueling.photos?.additional && 
                     preparation.tasks.refueling.photos.additional.length > 0 && (
                      <div className="additional-photos">
                        <div className="additional-photos-title">Photos additionnelles ({preparation.tasks.refueling.photos.additional.length})</div>
                        <div className="additional-photos-grid">
                          {preparation.tasks.refueling.photos.additional.map((photo, index) => (
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
                    {preparation.tasks.refueling.status === 'not_started' && 
                     !preparation.tasks.refueling.startedAt && (
                      <div className="task-not-started-message">
                        <i className="fas fa-info-circle"></i>
                        <span>Cette tâche n'a pas encore été démarrée.</span>
                      </div>
                    )}
                    
                    {/* Actions selon le statut de la tâche */}
                    {canEdit() && preparation.status !== 'completed' && (
                      <div className="task-actions">
                        {preparation.tasks.refueling.status === 'not_started' && (
                          <div className="task-step">
                            <div className="task-step-header">
                              <span className="step-number">1</span>
                              <span>Commencer la mise de carburant</span>
                            </div>
                            
                            <p>Prenez une photo de la jauge de carburant avant le remplissage.</p>
                            
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
                                  placeholder="Observations sur le niveau de carburant initial..."
                                />
                              </div>
                              
                              <button 
                                onClick={() => handleStartTask('refueling')}
                                className="btn btn-primary"
                                disabled={!photoBeforeFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Commencer le plein'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {preparation.tasks.refueling.status === 'in_progress' && (
                          <div className="task-step">
                            <div className="task-step-header">
                              <span className="step-number">2</span>
                              <span>Terminer la mise de carburant</span>
                            </div>
                            
                            <p>Prenez une photo de la jauge de carburant après le remplissage et indiquez la quantité ajoutée.</p>
                            
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
                              
                              <div className="form-group">
                                <label className="form-label">Notes (optionnel)</label>
                                <textarea
                                  value={taskNotes}
                                  onChange={(e) => setTaskNotes(e.target.value)}
                                  className="form-textarea"
                                  placeholder="Observations sur le plein..."
                                />
                              </div>
                              
                              <button 
                                onClick={() => handleCompleteTask('refueling')}
                                className="btn btn-success"
                                disabled={!photoAfterFile || !refuelingAmount || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Terminer le plein'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Formulaire pour ajouter une photo additionnelle (disponible si la tâche est en cours ou terminée) */}
                        {(preparation.tasks.refueling.status === 'in_progress' || preparation.tasks.refueling.status === 'completed') && (
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
                                onClick={() => handleAddAdditionalPhoto('refueling')}
                                className="btn btn-photo"
                                disabled={!additionalPhotoFile || taskLoading}
                              >
                                {taskLoading ? 'Traitement...' : 'Ajouter la photo'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="detail-section notes-section">
            <h2 className="section-title">
              <i className="fas fa-sticky-note"></i> Notes
            </h2>
            
            {preparation.status !== 'completed' && canEdit() ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="notes-textarea"
                placeholder="Ajouter des notes concernant cette préparation..."
                rows="4"
              ></textarea>
            ) : (
              <div className="notes-content">
                {preparation.notes ? preparation.notes : 'Aucune note disponible'}
              </div>
            )}
          </div>
          
          <div className="detail-section dates-section">
            <h2 className="section-title">
              <i className="fas fa-calendar-alt"></i> Dates
            </h2>
            
            <div className="dates-grid">
              <div className="date-item">
                <span className="date-label">Créée le:</span>
                <span className="date-value">{formatDate(preparation.createdAt)}</span>
              </div>
              
              <div className="date-item">
                <span className="date-label">Débutée le:</span>
                <span className="date-value">{formatDate(preparation.startTime)}</span>
              </div>
              
              <div className="date-item">
                <span className="date-label">Terminée le:</span>
                <span className="date-value">{formatDate(preparation.endTime)}</span>
              </div>
              
              <div className="date-item">
                <span className="date-label">Dernière modification:</span>
                <span className="date-value">{formatDate(preparation.updatedAt)}</span>
              </div>
            </div>
          </div>
          
          {canEdit() && preparation.status !== 'completed' && (
            <div className="detail-actions">
              <button
                onClick={() => navigate('/preparations')}
                className="btn btn-secondary"
              >
                Retour à la liste
              </button>
              
              {hasCompletedTasks() && (
                <button
                  onClick={handleCompletePreparation}
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? 'Finalisation...' : 'Terminer la préparation'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparationDetail;