// src/pages/MovementDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const [allDrivers, setAllDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [photoType, setPhotoType] = useState('front');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photosStatus, setPhotosStatus] = useState({
    front: false,   // Face avant avec plaque
    passenger: false, // Côté passager
    driver: false,  // Côté conducteur
    rear: false,    // Face arrière
    windshield: false, // Pare-brise
    roof: false,     // Toit
    meter: false    // Compteur kilométrique
  });
  const [success, setSuccess] = useState(null);

const [expandedPhotoSection, setExpandedPhotoSection] = useState(null);
const [selectedPhotoFiles, setSelectedPhotoFiles] = useState({
  front: null,
  passenger: null,
  driver: null,
  rear: null,
  windshield: null,
  roof: null,
  meter: null
});
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Charger les détails du mouvement
  useEffect(() => {
    loadMovement();
  }, [id]);

  // Variables d'état pour l'upload multiple
const [selectedFiles, setSelectedFiles] = useState([]);

// Gérer la sélection de plusieurs fichiers
const handleMultipleFilesChange = (e) => {
  if (e.target.files && e.target.files.length > 0) {
    setSelectedFiles(Array.from(e.target.files));
  }
};

// Fonction pour basculer l'ouverture/fermeture d'une section de photo
const togglePhotoSection = (section) => {
  if (expandedPhotoSection === section) {
    setExpandedPhotoSection(null);
  } else {
    setExpandedPhotoSection(section);
  }
};

// Gérer la sélection d'une photo pour une section spécifique
const handlePhotoSelect = (e, photoType) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setSelectedPhotoFiles(prev => ({
      ...prev,
      [photoType]: file
    }));
  }
};

// Télécharger une seule photo et mettre à jour le statut
const handleUploadSinglePhoto = async (photoType) => {
  try {
    setUploadingPhoto(true);
    setError(null);
    
    const file = selectedPhotoFiles[photoType];
    if (!file) {
      setError(`Veuillez sélectionner une photo pour ${getPhotoTypeLabel(photoType)}`);
      return;
    }
    
    const formData = new FormData();
    formData.append('photos', file);
    formData.append('type', photoType);
    
    await movementService.uploadPhotos(id, formData);
    
    // Mettre à jour le statut de la photo
    setPhotosStatus(prev => ({
      ...prev,
      [photoType]: true
    }));
    
    // Réinitialiser le fichier sélectionné
    setSelectedPhotoFiles(prev => ({
      ...prev,
      [photoType]: null
    }));
    
    // Afficher un message de succès et recharger le mouvement
    setSuccess(`Photo ${getPhotoTypeLabel(photoType)} téléchargée avec succès`);
    setTimeout(() => setSuccess(null), 3000);
    
    await loadMovement();
  } catch (err) {
    console.error(`Erreur lors du téléchargement de la photo ${photoType}:`, err);
    setError(err.response?.data?.message || `Erreur lors du téléchargement de la photo ${getPhotoTypeLabel(photoType)}`);
  } finally {
    setUploadingPhoto(false);
  }
};

// Réinitialiser le statut d'une photo pour permettre le remplacement
const handleResetPhotoStatus = (photoType) => {
  setPhotosStatus(prev => ({
    ...prev,
    [photoType]: false
  }));
  
  // Ouvrir la section correspondante
  setExpandedPhotoSection(photoType);
};

// Obtenir l'URL d'une photo à partir de son type
const getPhotoUrlByType = (photoType) => {
  if (!movement || !movement.photos) return '';
  
  const photo = movement.photos.find(photo => photo.type === photoType);
  return photo ? photo.url : '';
};

// Uploader plusieurs photos à la fois
const handleMultipleUpload = async () => {
  if (selectedFiles.length === 0) {
    setError('Veuillez sélectionner au moins une photo');
    return;
  }
  
  try {
    setUploadingPhoto(true);
    
    // Détermine les types de photos manquantes
    const missingPhotoTypes = Object.entries(photosStatus)
      .filter(([_, taken]) => !taken)
      .map(([type]) => type);
    
    // Si on a plus de fichiers que de photos manquantes, on limite
    const maxFilesToUpload = Math.min(selectedFiles.length, missingPhotoTypes.length);
    
    // Pour chaque fichier, on l'associe à un type manquant
    for (let i = 0; i < maxFilesToUpload; i++) {
      const file = selectedFiles[i];
      const photoType = missingPhotoTypes[i];
      
      const formData = new FormData();
      formData.append('photos', file);
      formData.append('type', photoType);
      
      await movementService.uploadPhotos(id, formData);
      
      // Marquer cette vue comme photographiée
      setPhotosStatus(prev => ({
        ...prev,
        [photoType]: true
      }));
    }
    
    // Réinitialiser la sélection de fichiers
    setSelectedFiles([]);
    document.getElementById('multi-photos').value = '';
    
    // Message de succès
    setUpdateSuccess(`${maxFilesToUpload} photo(s) téléchargée(s) avec succès`);
    setTimeout(() => setUpdateSuccess(null), 3000);
    
    // Recharger le mouvement pour afficher les nouvelles photos
    await loadMovement();
  } catch (err) {
    console.error('Erreur lors du téléchargement des photos:', err);
    setError(err.response?.data?.message || 'Erreur lors du téléchargement des photos');
  } finally {
    setUploadingPhoto(false);
  }
};

  // Charger tous les chauffeurs (admin seulement)
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      const loadDrivers = async () => {
        try {
          setLoadingDrivers(true);
          const drivers = await movementService.getAllDrivers();
          setAllDrivers(drivers);
          setLoadingDrivers(false);
        } catch (err) {
          console.error('Erreur lors du chargement des chauffeurs:', err);
          setLoadingDrivers(false);
        }
      };
      
      loadDrivers();
    }
  }, [currentUser]);

  // Charger les détails du mouvement
  const loadMovement = async () => {
    try {
      setLoading(true);
      const data = await movementService.getMovement(id);
      setMovement(data);
      
      if (data.notes) {
        setNotes(data.notes);
      }
      
      // Analyser les photos pour déterminer quelles vues sont déjà disponibles
      if (data.photos && data.photos.length > 0) {
        const newPhotoStatus = { ...photosStatus };
        
        data.photos.forEach(photo => {
          if (photo.type && newPhotoStatus.hasOwnProperty(photo.type)) {
            newPhotoStatus[photo.type] = true;
          }
        });
        
        setPhotosStatus(newPhotoStatus);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des détails du mouvement:', err);
      setError('Erreur lors du chargement des détails du mouvement');
    } finally {
      setLoading(false);
    }
  };

  // Assigner un chauffeur au mouvement
  const handleAssignDriver = async () => {
    if (!selectedDriver) {
      setError('Veuillez sélectionner un chauffeur');
      return;
    }
    
    try {
      setUpdateLoading(true);
      await movementService.assignDriver(id, selectedDriver);
      
      setUpdateSuccess('Chauffeur assigné avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
      setSelectedDriver('');
    } catch (err) {
      console.error('Erreur lors de l\'assignation du chauffeur:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'assignation du chauffeur');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Supprimer le mouvement
  const handleDeleteMovement = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce mouvement ?')) {
      return;
    }
    
    try {
      setUpdateLoading(true);
      await movementService.deleteMovement(id);
      
      setUpdateSuccess('Mouvement supprimé avec succès');
      setTimeout(() => {
        navigate('/movement/history');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la suppression du mouvement:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du mouvement');
      setUpdateLoading(false);
    }
  };

  // Démarrer la préparation du mouvement (première étape)
  const handlePrepareMovement = async () => {
    try {
      setUpdateLoading(true);
      
      await movementService.prepareMovement(id);
      await loadMovement();
      
      setUpdateSuccess('Préparation du mouvement démarrée');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors du démarrage de la préparation:', err);
      setError(err.response?.data?.message || 'Erreur lors du démarrage de la préparation');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Démarrer le trajet (deuxième étape, après la préparation)
  const handleStartMovement = async () => {
    try {
      setUpdateLoading(true);
      
      await movementService.startMovement(id);
      await loadMovement();
      
      setUpdateSuccess('Mouvement démarré avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors du démarrage du mouvement:', err);
      setError(err.response?.data?.message || 'Erreur lors du démarrage du mouvement');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Gérer le changement de fichier pour l'upload de photo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Uploader une photo
  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Veuillez sélectionner une photo');
      return;
    }
    
    try {
      setUploadingPhoto(true);
      
      const formData = new FormData();
      formData.append('photos', selectedFile);
      formData.append('type', photoType);
      
      await movementService.uploadPhotos(id, formData);
      
      // Marquer cette vue comme photographiée
      setPhotosStatus(prev => ({
        ...prev,
        [photoType]: true
      }));
      
      setSelectedFile(null);
      document.getElementById('photo-upload').value = '';
      
      setUpdateSuccess('Photo téléchargée avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
    } catch (err) {
      console.error('Erreur lors du téléchargement de la photo:', err);
      setError(err.response?.data?.message || 'Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Terminer le mouvement (avec vérification des photos)
  const handleCompleteMovement = async () => {
    try {
      setUpdateLoading(true);
      
      await movementService.completeMovement(id, { notes });
      await loadMovement();
      
      setUpdateSuccess('Mouvement terminé avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la fin du mouvement:', err);
      setError(err.response?.data?.message || 'Erreur lors de la fin du mouvement');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Vérifier si toutes les photos requises ont été prises
  const allRequiredPhotosTaken = () => {
    return Object.values(photosStatus).every(status => status === true);
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

  // Ouvrir l'image en plein écran
  const openFullScreenImage = (url) => {
    window.open(url, '_blank');
  };

  // Obtenir le libellé du type de photo
  const getPhotoTypeLabel = (type) => {
    switch (type) {
      case 'front': return 'Face avant';
      case 'passenger': return 'Côté passager';
      case 'driver': return 'Côté conducteur';
      case 'rear': return 'Face arrière';
      case 'windshield': return 'Pare-brise';
      case 'roof': return 'Toit';
      case 'meter': return 'Compteur';
      case 'departure': return 'Départ';
      case 'arrival': return 'Arrivée';
      case 'damage': return 'Dommage';
      default: return 'Autre';
    }
  };

  // Vérifier si l'utilisateur peut éditer ce mouvement
  const canEditMovement = () => {
    if (!movement || !currentUser) return false;
    
    // Les admins peuvent toujours éditer
    if (currentUser.role === 'admin') return true;
    
    // Les chauffeurs peuvent éditer uniquement s'ils sont assignés
    if (currentUser.role === 'driver' && 
        movement.userId && 
        movement.userId._id === currentUser._id) {
      return true;
    }
    
    return false;
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

  if (error && !movement) {
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
        
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}
        
        {updateSuccess && (
          <div className="alert alert-success">
            <div className="alert-icon">✓</div>
            <div className="alert-content">{updateSuccess}</div>
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
                {movement.status === 'assigned' && 'Assigné'}
                {movement.status === 'preparing' && 'En préparation'}
                {movement.status === 'in-progress' && 'En cours'}
                {movement.status === 'completed' && 'Terminé'}
                {movement.status === 'cancelled' && 'Annulé'}
              </span>
            </div>
          </div>
          
          {/* Section d'assignation de chauffeur - Visible pour les administrateurs uniquement */}
          {currentUser.role === 'admin' && (
            <div className="detail-section driver-assignment">
              <h2 className="section-title">
                <i className="fas fa-user"></i> Chauffeur assigné
              </h2>
              
              {movement.userId ? (
                <div className="assigned-driver">
                  <div className="info-item">
                    <span className="info-label">Chauffeur:</span>
                    <span className="info-value">{movement.userId.fullName}</span>
                  </div>
                  
                  {/* Option pour modifier le chauffeur si le mouvement n'est pas démarré */}
                  {movement.status === 'pending' || movement.status === 'assigned' ? (
                    <div className="change-driver">
                      <h3 className="subsection-title">Modifier le chauffeur</h3>
                      
                      {loadingDrivers ? (
                        <div className="loading-indicator-small">Chargement des chauffeurs...</div>
                      ) : (
                        <div className="assign-form">
                          <select 
                            value={selectedDriver} 
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="form-select"
                          >
                            <option value="">Sélectionnez un chauffeur</option>
                            <optgroup label="Chauffeurs en service">
                              {allDrivers.filter(driver => driver.isOnDuty).map(driver => (
                                <option key={driver._id} value={driver._id}>
                                  {driver.fullName} - En service
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Chauffeurs hors service">
                              {allDrivers.filter(driver => !driver.isOnDuty).map(driver => (
                                <option key={driver._id} value={driver._id}>
                                  {driver.fullName} - Hors service
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          
                          <button 
                            onClick={handleAssignDriver}
                            className="btn btn-primary"
                            disabled={updateLoading || !selectedDriver}
                          >
                            {updateLoading ? 'Mise à jour...' : 'Changer de chauffeur'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="no-driver-assigned">
                  <p className="no-assignment-message">Aucun chauffeur assigné à ce mouvement.</p>
                  
                  {loadingDrivers ? (
                    <div className="loading-indicator-small">Chargement des chauffeurs...</div>
                  ) : (
                    <div className="assign-form">
                      <select 
                        value={selectedDriver} 
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        className="form-select"
                      >
                        <option value="">Sélectionnez un chauffeur</option>
                        <optgroup label="Chauffeurs en service">
                          {allDrivers.filter(driver => driver.isOnDuty).map(driver => (
                            <option key={driver._id} value={driver._id}>
                              {driver.fullName} - En service
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Chauffeurs hors service">
                          {allDrivers.filter(driver => !driver.isOnDuty).map(driver => (
                            <option key={driver._id} value={driver._id}>
                              {driver.fullName} - Hors service
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      
                      <button 
                        onClick={handleAssignDriver}
                        className="btn btn-primary"
                        disabled={updateLoading || !selectedDriver}
                      >
                        {updateLoading ? 'Assignation...' : 'Assigner un chauffeur'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
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
                  {movement.departureLocation.coordinates && movement.departureLocation.coordinates.latitude && (
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
                  {movement.arrivalLocation.coordinates && movement.arrivalLocation.coordinates.latitude && (
                    <div className="point-coordinates">
                      Lat: {movement.arrivalLocation.coordinates.latitude}, 
                      Lng: {movement.arrivalLocation.coordinates.longitude}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Section pour l'upload de photos guidé - Visible uniquement pour le chauffeur assigné et en préparation */}
          {canEditMovement() && (movement.status === 'preparing') && (
          <div className="detail-section photo-upload-section">
            <h2 className="section-title">
              <i className="fas fa-camera"></i> Photos du véhicule
            </h2>
            
            <div className="photo-guidelines">
              <p className="guidelines-intro">
                Pour continuer ce mouvement, vous devez prendre les photos suivantes du véhicule. Chaque section doit être complétée.
              </p>
            </div>
            
            {/* Accordéon des zones à photographier */}
            <div className="photo-accordion">
              {/* Item 1: Face avant */}
              <div className="photo-accordion-item">
                <div className={`photo-accordion-header ${photosStatus.front ? 'completed' : ''}`} onClick={() => togglePhotoSection('front')}>
                  <div className="photo-section-title">
                    <span className="status-icon">
                      {photosStatus.front ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
                    </span>
                    <span>Face avant avec plaque</span>
                  </div>
                  <div className="photo-section-actions">
                    {photosStatus.front ? (
                      <span className="photo-status-text">Complété</span>
                    ) : (
                      <span className="photo-status-text">À photographier</span>
                    )}
                    <i className={`fas fa-chevron-${expandedPhotoSection === 'front' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedPhotoSection === 'front' && (
                  <div className="photo-accordion-content">
                    {photosStatus.front ? (
                      <div className="completed-photo">
                        <img 
                          src={getPhotoUrlByType('front')} 
                          alt="Face avant" 
                          className="preview-image"
                          onClick={() => openFullScreenImage(getPhotoUrlByType('front'))} 
                        />
                        <button className="btn btn-secondary photo-replace-btn" onClick={() => handleResetPhotoStatus('front')}>
                          Remplacer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-container">
                        <p className="photo-instruction">Prenez une photo de la face avant du véhicule. Assurez-vous que la plaque d'immatriculation soit bien visible.</p>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSelect(e, 'front')}
                            className="photo-input" 
                          />
                          {selectedPhotoFiles.front && (
                            <div className="photo-preview-wrapper">
                              <img 
                                src={URL.createObjectURL(selectedPhotoFiles.front)} 
                                alt="Prévisualisation" 
                                className="preview-image"
                              />
                            </div>
                          )}
                          <button 
                            className="btn btn-primary upload-photo-btn"
                            disabled={!selectedPhotoFiles.front || uploadingPhoto}
                            onClick={() => handleUploadSinglePhoto('front')}
                          >
                            {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Item 2: Côté passager */}
              <div className="photo-accordion-item">
                <div className={`photo-accordion-header ${photosStatus.passenger ? 'completed' : ''}`} onClick={() => togglePhotoSection('passenger')}>
                  <div className="photo-section-title">
                    <span className="status-icon">
                      {photosStatus.passenger ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
                    </span>
                    <span>Côté passager</span>
                  </div>
                  <div className="photo-section-actions">
                    {photosStatus.passenger ? (
                      <span className="photo-status-text">Complété</span>
                    ) : (
                      <span className="photo-status-text">À photographier</span>
                    )}
                    <i className={`fas fa-chevron-${expandedPhotoSection === 'passenger' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedPhotoSection === 'passenger' && (
                  <div className="photo-accordion-content">
                    {photosStatus.passenger ? (
                      <div className="completed-photo">
                        <img 
                          src={getPhotoUrlByType('passenger')} 
                          alt="Côté passager" 
                          className="preview-image"
                          onClick={() => openFullScreenImage(getPhotoUrlByType('passenger'))} 
                        />
                        <button className="btn btn-secondary photo-replace-btn" onClick={() => handleResetPhotoStatus('passenger')}>
                          Remplacer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-container">
                        <p className="photo-instruction">Prenez une photo du côté passager du véhicule.</p>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSelect(e, 'passenger')}
                            className="photo-input" 
                          />
                          {selectedPhotoFiles.passenger && (
                            <div className="photo-preview-wrapper">
                              <img 
                                src={URL.createObjectURL(selectedPhotoFiles.passenger)} 
                                alt="Prévisualisation" 
                                className="preview-image"
                              />
                            </div>
                          )}
                          <button 
                            className="btn btn-primary upload-photo-btn"
                            disabled={!selectedPhotoFiles.passenger || uploadingPhoto}
                            onClick={() => handleUploadSinglePhoto('passenger')}
                          >
                            {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Item 3: Côté conducteur */}
              <div className="photo-accordion-item">
                <div className={`photo-accordion-header ${photosStatus.driver ? 'completed' : ''}`} onClick={() => togglePhotoSection('driver')}>
                  <div className="photo-section-title">
                    <span className="status-icon">
                      {photosStatus.driver ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
                    </span>
                    <span>Côté conducteur</span>
                  </div>
                  <div className="photo-section-actions">
                    {photosStatus.driver ? (
                      <span className="photo-status-text">Complété</span>
                    ) : (
                      <span className="photo-status-text">À photographier</span>
                    )}
                    <i className={`fas fa-chevron-${expandedPhotoSection === 'driver' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedPhotoSection === 'driver' && (
                  <div className="photo-accordion-content">
                    {photosStatus.driver ? (
                      <div className="completed-photo">
                        <img 
                          src={getPhotoUrlByType('driver')} 
                          alt="Côté conducteur" 
                          className="preview-image"
                          onClick={() => openFullScreenImage(getPhotoUrlByType('driver'))} 
                        />
                        <button className="btn btn-secondary photo-replace-btn" onClick={() => handleResetPhotoStatus('driver')}>
                          Remplacer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-container">
                        <p className="photo-instruction">Prenez une photo du côté conducteur du véhicule.</p>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSelect(e, 'driver')}
                            className="photo-input" 
                          />
                          {selectedPhotoFiles.driver && (
                            <div className="photo-preview-wrapper">
                              <img 
                                src={URL.createObjectURL(selectedPhotoFiles.driver)} 
                                alt="Prévisualisation" 
                                className="preview-image"
                              />
                            </div>
                          )}
                          <button 
                            className="btn btn-primary upload-photo-btn"
                            disabled={!selectedPhotoFiles.driver || uploadingPhoto}
                            onClick={() => handleUploadSinglePhoto('driver')}
                          >
                            {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Item 4: Face arrière */}
              <div className="photo-accordion-item">
                <div className={`photo-accordion-header ${photosStatus.rear ? 'completed' : ''}`} onClick={() => togglePhotoSection('rear')}>
                  <div className="photo-section-title">
                    <span className="status-icon">
                      {photosStatus.rear ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
                    </span>
                    <span>Face arrière</span>
                  </div>
                  <div className="photo-section-actions">
                    {photosStatus.rear ? (
                      <span className="photo-status-text">Complété</span>
                    ) : (
                      <span className="photo-status-text">À photographier</span>
                    )}
                    <i className={`fas fa-chevron-${expandedPhotoSection === 'rear' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedPhotoSection === 'rear' && (
                  <div className="photo-accordion-content">
                    {photosStatus.rear ? (
                      <div className="completed-photo">
                        <img 
                          src={getPhotoUrlByType('rear')} 
                          alt="Face arrière" 
                          className="preview-image"
                          onClick={() => openFullScreenImage(getPhotoUrlByType('rear'))} 
                        />
                        <button className="btn btn-secondary photo-replace-btn" onClick={() => handleResetPhotoStatus('rear')}>
                          Remplacer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-container">
                        <p className="photo-instruction">Prenez une photo de l'arrière du véhicule.</p>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSelect(e, 'rear')}
                            className="photo-input" 
                          />
                          {selectedPhotoFiles.rear && (
                            <div className="photo-preview-wrapper">
                              <img 
                                src={URL.createObjectURL(selectedPhotoFiles.rear)} 
                                alt="Prévisualisation" 
                                className="preview-image"
                              />
                            </div>
                          )}
                          <button 
                            className="btn btn-primary upload-photo-btn"
                            disabled={!selectedPhotoFiles.rear || uploadingPhoto}
                            onClick={() => handleUploadSinglePhoto('rear')}
                          >
                            {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Item 5: Pare-brise */}
              <div className="photo-accordion-item">
                <div className={`photo-accordion-header ${photosStatus.windshield ? 'completed' : ''}`} onClick={() => togglePhotoSection('windshield')}>
                  <div className="photo-section-title">
                    <span className="status-icon">
                      {photosStatus.windshield ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
                    </span>
                    <span>Pare-brise</span>
                  </div>
                  <div className="photo-section-actions">
                    {photosStatus.windshield ? (
                      <span className="photo-status-text">Complété</span>
                    ) : (
                      <span className="photo-status-text">À photographier</span>
                    )}
                    <i className={`fas fa-chevron-${expandedPhotoSection === 'windshield' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedPhotoSection === 'windshield' && (
                  <div className="photo-accordion-content">
                    {photosStatus.windshield ? (
                      <div className="completed-photo">
                        <img 
                          src={getPhotoUrlByType('windshield')} 
                          alt="Pare-brise" 
                          className="preview-image"
                          onClick={() => openFullScreenImage(getPhotoUrlByType('windshield'))} 
                        />
                        <button className="btn btn-secondary photo-replace-btn" onClick={() => handleResetPhotoStatus('windshield')}>
                          Remplacer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-container">
                        <p className="photo-instruction">Prenez une photo du pare-brise du véhicule.</p>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSelect(e, 'windshield')}
                            className="photo-input" 
                          />
                          {selectedPhotoFiles.windshield && (
                            <div className="photo-preview-wrapper">
                              <img 
                                src={URL.createObjectURL(selectedPhotoFiles.windshield)} 
                                alt="Prévisualisation" 
                                className="preview-image"
                              />
                            </div>
                          )}
                          <button 
                            className="btn btn-primary upload-photo-btn"
                            disabled={!selectedPhotoFiles.windshield || uploadingPhoto}
                            onClick={() => handleUploadSinglePhoto('windshield')}
                          >
                            {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Item 6: Toit */}
              <div className="photo-accordion-item">
                <div className={`photo-accordion-header ${photosStatus.roof ? 'completed' : ''}`} onClick={() => togglePhotoSection('roof')}>
                  <div className="photo-section-title">
                    <span className="status-icon">
                      {photosStatus.roof ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
                    </span>
                    <span>Toit</span>
                  </div>
                  <div className="photo-section-actions">
                    {photosStatus.roof ? (
                      <span className="photo-status-text">Complété</span>
                    ) : (
                      <span className="photo-status-text">À photographier</span>
                    )}
                    <i className={`fas fa-chevron-${expandedPhotoSection === 'roof' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedPhotoSection === 'roof' && (
                  <div className="photo-accordion-content">
                    {photosStatus.roof ? (
                      <div className="completed-photo">
                        <img 
                          src={getPhotoUrlByType('roof')} 
                          alt="Toit" 
                          className="preview-image"
                          onClick={() => openFullScreenImage(getPhotoUrlByType('roof'))} 
                        />
                        <button className="btn btn-secondary photo-replace-btn" onClick={() => handleResetPhotoStatus('roof')}>
                          Remplacer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-container">
                        <p className="photo-instruction">Prenez une photo du toit du véhicule.</p>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSelect(e, 'roof')}
                            className="photo-input" 
                          />
                          {selectedPhotoFiles.roof && (
                            <div className="photo-preview-wrapper">
                              <img 
                                src={URL.createObjectURL(selectedPhotoFiles.roof)} 
                                alt="Prévisualisation" 
                                className="preview-image"
                              />
                            </div>
                          )}
                          <button 
                            className="btn btn-primary upload-photo-btn"
                            disabled={!selectedPhotoFiles.roof || uploadingPhoto}
                            onClick={() => handleUploadSinglePhoto('roof')}
                          >
                            {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* NOUVEL ITEM 7: Compteur */}
              <div className="photo-accordion-item">
                <div className={`photo-accordion-header ${photosStatus.meter ? 'completed' : ''}`} onClick={() => togglePhotoSection('meter')}>
                  <div className="photo-section-title">
                    <span className="status-icon">
                      {photosStatus.meter ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
                    </span>
                    <span>Compteur</span>
                  </div>
                  <div className="photo-section-actions">
                    {photosStatus.meter ? (
                      <span className="photo-status-text">Complété</span>
                    ) : (
                      <span className="photo-status-text">À photographier</span>
                    )}
                    <i className={`fas fa-chevron-${expandedPhotoSection === 'meter' ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {expandedPhotoSection === 'meter' && (
                  <div className="photo-accordion-content">
                    {photosStatus.meter ? (
                      <div className="completed-photo">
                        <img 
                          src={getPhotoUrlByType('meter')} 
                          alt="Compteur" 
                          className="preview-image"
                          onClick={() => openFullScreenImage(getPhotoUrlByType('meter'))} 
                        />
                        <button className="btn btn-secondary photo-replace-btn" onClick={() => handleResetPhotoStatus('meter')}>
                          Remplacer la photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-container">
                        <p className="photo-instruction">Prenez une photo du compteur kilométrique du véhicule. Assurez-vous que les chiffres soient bien lisibles.</p>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoSelect(e, 'meter')}
                            className="photo-input" 
                          />
                          {selectedPhotoFiles.meter && (
                            <div className="photo-preview-wrapper">
                              <img 
                                src={URL.createObjectURL(selectedPhotoFiles.meter)} 
                                alt="Prévisualisation" 
                                className="preview-image"
                              />
                            </div>
                          )}
                          <button 
                            className="btn btn-primary upload-photo-btn"
                            disabled={!selectedPhotoFiles.meter || uploadingPhoto}
                            onClick={() => handleUploadSinglePhoto('meter')}
                          >
                            {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Section de statut des photos - Suppression du bouton "Commencer le trajet" */}
            <div className="photos-confirmation-section">
              {allRequiredPhotosTaken() ? (
                <div className="photos-complete-message">
                  <i className="fas fa-check-circle"></i>
                  <span>Toutes les photos requises ont été prises</span>
                </div>
              ) : (
                <div className="photos-incomplete-message">
                  <i className="fas fa-info-circle"></i>
                  <span>Veuillez prendre toutes les photos requises pour continuer</span>
                </div>
              )}
              
              {/* Le bouton "Commencer le trajet" a été supprimé car redondant */}
            </div>
          </div>
        )}
          
          <div className="detail-section notes-section">
            <h2 className="section-title">Notes</h2>
            {movement.status !== 'completed' && canEditMovement() ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
          
          {/* Actions en fonction du statut et du rôle */}
          <div className="detail-actions">
            {/* Bouton retour */}
            <button
              onClick={() => navigate('/movement/history')}
              className="btn btn-secondary"
            >
              Retour à la liste
            </button>
            
            {/* Options pour supprimer (admin uniquement, si non démarré) */}
            {currentUser.role === 'admin' && (movement.status === 'pending' || movement.status === 'assigned') && (
              <button
                onClick={handleDeleteMovement}
                className="btn btn-danger"
                disabled={updateLoading}
              >
                {updateLoading ? 'Suppression...' : 'Supprimer le mouvement'}
              </button>
            )}
            
            {/* Étape 1: Démarrer la préparation (chauffeur assigné) */}
            {movement.status === 'assigned' && 
              movement.userId && 
              currentUser.role === 'driver' && 
              movement.userId._id === currentUser._id && (
              <button
                onClick={handlePrepareMovement}
                className="btn btn-primary"
                disabled={updateLoading}
              >
                {updateLoading ? 'Démarrage...' : 'Préparer le véhicule'}
              </button>
            )}
            
            {/* Étape 2: Démarrer le trajet (après préparation et photos) */}
            {movement.status === 'preparing' && 
              movement.userId && 
              currentUser.role === 'driver' && 
              movement.userId._id === currentUser._id && (
              <button
                onClick={handleStartMovement}
                className="btn btn-success"
                disabled={updateLoading || !allRequiredPhotosTaken()}
                title={!allRequiredPhotosTaken() ? "Toutes les photos requises doivent être prises" : ""}
              >
                {updateLoading ? 'Démarrage...' : 'En route'}
              </button>
            )}
            
            {/* Étape 3: Terminer le trajet */}
            {movement.status === 'in-progress' && 
              movement.userId && 
              currentUser.role === 'driver' && 
              movement.userId._id === currentUser._id && (
              <button
                onClick={handleCompleteMovement}
                className="btn btn-success"
                disabled={updateLoading}
              >
                {updateLoading ? 'Finalisation...' : 'Terminer le trajet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetail;