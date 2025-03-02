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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photoType, setPhotoType] = useState('before');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState('');
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

  // Mettre à jour une tâche
  const handleUpdateTask = async (taskType, completed, additionalData = {}) => {
    try {
      setTaskLoading(taskType);
      
      const payload = {
        taskType,
        completed,
        notes: additionalData.notes || '',
        ...additionalData
      };
      
      await preparationService.updateTask(id, payload);
      await loadPreparation();
      
      setSuccess(`Tâche "${getTaskLabel(taskType)}" mise à jour avec succès`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la tâche:', err);
      setError('Erreur lors de la mise à jour de la tâche');
    } finally {
      setTaskLoading('');
    }
  };

  // Gérer la sélection des fichiers pour l'upload
  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // Uploader des photos
  const handleUploadPhotos = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins une photo');
      return;
    }
    
    try {
      setUploadLoading(true);
      
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });
      formData.append('type', photoType);
      
      await preparationService.uploadPhotos(id, formData);
      await loadPreparation();
      
      setSelectedFiles([]);
      setSuccess('Photos téléchargées avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors du téléchargement des photos:', err);
      setError('Erreur lors du téléchargement des photos');
    } finally {
      setUploadLoading(false);
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
      case 'vehicleTransfer': return 'Transfert de véhicule';
      default: return 'Tâche inconnue';
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
            {preparation.assignedBy && (
              <div className="info-item">
                <span className="info-label">Assigné par:</span>
                <span className="info-value">{preparation.assignedBy.fullName}</span>
              </div>
            )}
          </div>
          
          <div className="detail-section tasks-section">
            <h2 className="section-title">
              <i className="fas fa-tasks"></i> Tâches de préparation
            </h2>
            
            <div className="task-grid">
              {/* Lavage extérieur */}
              <div className="task-card">
                <div className="task-header">
                  <h3 className="task-title">Lavage extérieur</h3>
                  <span className={`task-status ${preparation.tasks.exteriorWashing?.completed ? 'completed' : 'pending'}`}>
                    {preparation.tasks.exteriorWashing?.completed ? 'Terminé' : 'À faire'}
                  </span>
                </div>
                
                {preparation.tasks.exteriorWashing?.completedAt && (
                  <div className="task-info">
                    <i className="fas fa-clock"></i> {formatDate(preparation.tasks.exteriorWashing.completedAt)}
                  </div>
                )}
                
                {preparation.tasks.exteriorWashing?.notes && (
                  <div className="task-notes">
                    <strong>Notes:</strong> {preparation.tasks.exteriorWashing.notes}
                  </div>
                )}
                
                {canEdit() && preparation.status !== 'completed' && (
                  <div className="task-actions">
                    <button 
                      onClick={() => handleUpdateTask('exteriorWashing', !preparation.tasks.exteriorWashing?.completed)}
                      className={`btn ${preparation.tasks.exteriorWashing?.completed ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={taskLoading === 'exteriorWashing'}
                    >
                      {taskLoading === 'exteriorWashing' ? (
                        <span>Mise à jour...</span>
                      ) : preparation.tasks.exteriorWashing?.completed ? (
                        <>
                          <i className="fas fa-times"></i> Annuler
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> Marquer comme terminé
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Nettoyage intérieur */}
              <div className="task-card">
                <div className="task-header">
                  <h3 className="task-title">Nettoyage intérieur</h3>
                  <span className={`task-status ${preparation.tasks.interiorCleaning?.completed ? 'completed' : 'pending'}`}>
                    {preparation.tasks.interiorCleaning?.completed ? 'Terminé' : 'À faire'}
                  </span>
                </div>
                
                {preparation.tasks.interiorCleaning?.completedAt && (
                  <div className="task-info">
                    <i className="fas fa-clock"></i> {formatDate(preparation.tasks.interiorCleaning.completedAt)}
                  </div>
                )}
                
                {preparation.tasks.interiorCleaning?.notes && (
                  <div className="task-notes">
                    <strong>Notes:</strong> {preparation.tasks.interiorCleaning.notes}
                  </div>
                )}
                
                {canEdit() && preparation.status !== 'completed' && (
                  <div className="task-actions">
                    <button 
                      onClick={() => handleUpdateTask('interiorCleaning', !preparation.tasks.interiorCleaning?.completed)}
                      className={`btn ${preparation.tasks.interiorCleaning?.completed ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={taskLoading === 'interiorCleaning'}
                    >
                      {taskLoading === 'interiorCleaning' ? (
                        <span>Mise à jour...</span>
                      ) : preparation.tasks.interiorCleaning?.completed ? (
                        <>
                          <i className="fas fa-times"></i> Annuler
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> Marquer comme terminé
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Mise de carburant */}
              <div className="task-card">
                <div className="task-header">
                  <h3 className="task-title">Mise de carburant</h3>
                  <span className={`task-status ${preparation.tasks.refueling?.completed ? 'completed' : 'pending'}`}>
                    {preparation.tasks.refueling?.completed ? 'Terminé' : 'À faire'}
                  </span>
                </div>
                
                {preparation.tasks.refueling?.completedAt && (
                  <div className="task-info">
                    <i className="fas fa-clock"></i> {formatDate(preparation.tasks.refueling.completedAt)}
                  </div>
                )}
                
                {preparation.tasks.refueling?.amount && (
                  <div className="task-info">
                    <i className="fas fa-gas-pump"></i> {preparation.tasks.refueling.amount} L
                  </div>
                )}
                
                {preparation.tasks.refueling?.notes && (
                  <div className="task-notes">
                    <strong>Notes:</strong> {preparation.tasks.refueling.notes}
                  </div>
                )}
                
                {canEdit() && preparation.status !== 'completed' && (
                  <div className="task-actions">
                    <button 
                      onClick={() => {
                        const amount = prompt('Combien de litres de carburant ajoutés?', preparation.tasks.refueling?.amount || '');
                        if (amount !== null) {
                          handleUpdateTask('refueling', !preparation.tasks.refueling?.completed, { amount: parseFloat(amount) || 0 });
                        }
                      }}
                      className={`btn ${preparation.tasks.refueling?.completed ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={taskLoading === 'refueling'}
                    >
                      {taskLoading === 'refueling' ? (
                        <span>Mise à jour...</span>
                      ) : preparation.tasks.refueling?.completed ? (
                        <>
                          <i className="fas fa-times"></i> Annuler
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> Marquer comme terminé
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Transfert de véhicule */}
              <div className="task-card">
                <div className="task-header">
                  <h3 className="task-title">Transfert de véhicule</h3>
                  <span className={`task-status ${preparation.tasks.vehicleTransfer?.completed ? 'completed' : 'pending'}`}>
                    {preparation.tasks.vehicleTransfer?.completed ? 'Terminé' : 'À faire'}
                  </span>
                </div>
                
                {preparation.tasks.vehicleTransfer?.completedAt && (
                  <div className="task-info">
                    <i className="fas fa-clock"></i> {formatDate(preparation.tasks.vehicleTransfer.completedAt)}
                  </div>
                )}
                
                {preparation.tasks.vehicleTransfer?.departureLocation && (
                  <div className="task-info">
                    <i className="fas fa-map-marker-alt"></i> De: {preparation.tasks.vehicleTransfer.departureLocation.name}
                  </div>
                )}
                
                {preparation.tasks.vehicleTransfer?.arrivalLocation && (
                  <div className="task-info">
                    <i className="fas fa-flag-checkered"></i> À: {preparation.tasks.vehicleTransfer.arrivalLocation.name}
                  </div>
                )}
                
                {preparation.tasks.vehicleTransfer?.notes && (
                  <div className="task-notes">
                    <strong>Notes:</strong> {preparation.tasks.vehicleTransfer.notes}
                  </div>
                )}
                
                {canEdit() && preparation.status !== 'completed' && (
                  <div className="task-actions">
                    <button 
                      onClick={() => {
                        if (!preparation.tasks.vehicleTransfer?.completed) {
                          const departureLocation = prompt('Lieu de départ du transfert:', preparation.tasks.vehicleTransfer?.departureLocation?.name || '');
                          const arrivalLocation = prompt('Lieu d\'arrivée du transfert:', preparation.tasks.vehicleTransfer?.arrivalLocation?.name || '');
                          
                          if (departureLocation && arrivalLocation) {
                            handleUpdateTask('vehicleTransfer', true, { 
                              departureLocation: { name: departureLocation },
                              arrivalLocation: { name: arrivalLocation }
                            });
                          }
                        } else {
                          handleUpdateTask('vehicleTransfer', false);
                        }
                      }}
                      className={`btn ${preparation.tasks.vehicleTransfer?.completed ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={taskLoading === 'vehicleTransfer'}
                    >
                      {taskLoading === 'vehicleTransfer' ? (
                        <span>Mise à jour...</span>
                      ) : preparation.tasks.vehicleTransfer?.completed ? (
                        <>
                          <i className="fas fa-times"></i> Annuler
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> Marquer comme terminé
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="detail-section photos-section">
            <h2 className="section-title">
              <i className="fas fa-images"></i> Photos
            </h2>
            
            {canEdit() && preparation.status !== 'completed' && (
              <div className="photo-upload-form">
                <h3 className="subsection-title">Ajouter des photos</h3>
                
                <form onSubmit={handleUploadPhotos}>
                  <div className="form-group">
                    <label htmlFor="photoType" className="form-label">Type de photo</label>
                    <select 
                      id="photoType" 
                      value={photoType} 
                      onChange={(e) => setPhotoType(e.target.value)}
                      className="form-select"
                    >
                      <option value="before">Avant préparation</option>
                      <option value="after">Après préparation</option>
                      <option value="damage">Dégâts / Dommages</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="photos" className="form-label">Sélectionner des photos</label>
                    <input 
                      type="file" 
                      id="photos" 
                      onChange={handleFileChange} 
                      multiple 
                      accept="image/*"
                      className="form-input file-input" 
                    />
                    <p className="form-help-text">Vous pouvez sélectionner jusqu'à 5 photos à la fois</p>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      <p>{selectedFiles.length} photo(s) sélectionnée(s)</p>
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={uploadLoading || selectedFiles.length === 0}
                  >
                    {uploadLoading ? 'Envoi en cours...' : 'Télécharger les photos'}
                  </button>
                </form>
              </div>
            )}
            
            <div className="photos-gallery">
              {preparation.photos && preparation.photos.length > 0 ? (
                <div className="photos-grid">
                  {preparation.photos.map((photo, index) => (
                    <div key={index} className="photo-item" onClick={() => openFullScreenImage(photo.url)}>
                      <img src={photo.url} alt={`Photo ${index + 1}`} className="preparation-photo" />
                      <div className="photo-info">
                        <span className={`photo-type ${photo.type}`}>
                          {photo.type === 'before' && 'Avant'}
                          {photo.type === 'after' && 'Après'}
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
              
              {(preparation.tasks.exteriorWashing?.completed || 
                preparation.tasks.interiorCleaning?.completed || 
                preparation.tasks.refueling?.completed || 
                preparation.tasks.vehicleTransfer?.completed) && (
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