// src/pages/MovementDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';

// Import des composants réutilisables
import VehicleInfoSection from '../components/movement/VehicleInfoSection';
import RouteInfoSection from '../components/movement/RouteInfoSection';
import DriverAssignmentSection from '../components/movement/DriverAssignmentSection';
import PhotoUploadSection from '../components/movement/PhotoUploadSection';
import NotesSection from '../components/movement/NotesSection';
import DatesSection from '../components/movement/DatesSection';
import ActionButtons from '../components/movement/ActionButtons';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AlertMessage from '../components/ui/AlertMessage';

import '../styles/MovementDetail.css';

const MovementDetail = () => {
  // États de base
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(null);
  
  // États pour les images de départ et d'arrivée
  const initialPhotoState = {
    front: null,
    passenger: null,
    driver: null,
    rear: null,
    windshield: null,
    roof: null,
    meter: null
  };
  
  // États pour les photos au départ
  const [expandedPhotoSection, setExpandedPhotoSection] = useState(null);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState({...initialPhotoState});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photosStatus, setPhotosStatus] = useState({...initialPhotoState});

  // États pour les photos à l'arrivée
  const [expandedArrivalPhotoSection, setExpandedArrivalPhotoSection] = useState(null);
  const [selectedArrivalPhotoFiles, setSelectedArrivalPhotoFiles] = useState({...initialPhotoState});
  const [uploadingArrivalPhoto, setUploadingArrivalPhoto] = useState(false);
  const [arrivalPhotosStatus, setArrivalPhotosStatus] = useState({...initialPhotoState});
  
  const { currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  // Charger les détails du mouvement à l'initialisation
  useEffect(() => { loadMovement(); }, [id]);

  // Charger tous les chauffeurs (admin seulement)
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadDrivers();
    }
  }, [currentUser]);

  // Fonctions principales
  const loadMovement = async () => {
    try {
      setLoading(true);
      const data = await movementService.getMovement(id);
      setMovement(data);
      
      if (data.notes) setNotes(data.notes);
      
      // Analyser les photos pour déterminer quelles vues sont déjà disponibles
      if (data.photos?.length > 0) {
        const updatedPhotoStatus = { ...photosStatus };
        const updatedArrivalPhotoStatus = { ...arrivalPhotosStatus };
        
        data.photos.forEach(photo => {
          if (photo.type) {
            if (photo.photoType === 'arrival') {
              updatedArrivalPhotoStatus[photo.type] = true;
            } else {
              updatedPhotoStatus[photo.type] = true;
            }
          }
        });
        
        setPhotosStatus(updatedPhotoStatus);
        setArrivalPhotosStatus(updatedArrivalPhotoStatus);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails du mouvement:', err);
      setError('Erreur lors du chargement des détails du mouvement');
    } finally {
      setLoading(false);
    }
  };

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

  // Gestion des actions principales
  const handleAssignDriver = async (driverId) => {
    try {
      setUpdateLoading(true);
      await movementService.assignDriver(id, driverId);
      
      setUpdateSuccess('Chauffeur assigné avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'assignation du chauffeur');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteMovement = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce mouvement ?')) return;
    
    try {
      setUpdateLoading(true);
      await movementService.deleteMovement(id);
      
      setUpdateSuccess('Mouvement supprimé avec succès');
      setTimeout(() => navigate('/movement/history'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du mouvement');
      setUpdateLoading(false);
    }
  };

  const handlePrepareMovement = async () => {
    try {
      setUpdateLoading(true);
      await movementService.prepareMovement(id);
      await loadMovement();
      
      setUpdateSuccess('Préparation du mouvement démarrée');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du démarrage de la préparation');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleStartMovement = async () => {
    try {
      setUpdateLoading(true);
      await movementService.startMovement(id);
      await loadMovement();
      
      setUpdateSuccess('Mouvement démarré avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du démarrage du mouvement');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCompleteMovement = async () => {
    try {
      if (!allRequiredArrivalPhotosTaken()) {
        setError('Veuillez prendre toutes les photos requises à l\'arrivée avant de terminer le trajet');
        return;
      }
      
      setUpdateLoading(true);
      await movementService.completeMovement(id, { notes });
      await loadMovement();
      
      setUpdateSuccess('Mouvement terminé avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la fin du mouvement');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Fonctions pour la gestion des photos
  const handleImagePreview = (url) => {
    if (url) setFullscreenPreview(url);
  };

  const handleExpandPhotoSection = (section) => {
    setExpandedPhotoSection(expandedPhotoSection === section ? null : section);
  };

  const handleExpandArrivalPhotoSection = (section) => {
    setExpandedArrivalPhotoSection(expandedArrivalPhotoSection === section ? null : section);
  };

  const handleSelectPhoto = (type, file) => {
    setSelectedPhotoFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleSelectArrivalPhoto = (type, file) => {
    setSelectedArrivalPhotoFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleUploadPhoto = async (photoType) => {
    try {
      setUploadingPhoto(true);
      setError(null);
      
      const file = selectedPhotoFiles[photoType];
      if (!file) {
        setError(`Veuillez sélectionner une photo pour ${photoType}`);
        return;
      }
      
      const formData = new FormData();
      formData.append('photos', file);
      formData.append('type', photoType);
      
      await movementService.uploadPhotos(id, formData);
      
      // Mettre à jour l'état AVANT de recharger le mouvement
      setPhotosStatus(prev => ({ ...prev, [photoType]: true }));
      setSelectedPhotoFiles(prev => ({ ...prev, [photoType]: null }));
      
      setUpdateSuccess(`Photo ${photoType} téléchargée avec succès`);
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
    } catch (err) {
      setError(err.response?.data?.message || `Erreur lors du téléchargement de la photo`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUploadArrivalPhoto = async (photoType) => {
    try {
      setUploadingArrivalPhoto(true);
      setError(null);
      
      const file = selectedArrivalPhotoFiles[photoType];
      if (!file) {
        setError(`Veuillez sélectionner une photo pour ${photoType}`);
        return;
      }
      
      const formData = new FormData();
      formData.append('photos', file);
      formData.append('type', photoType);
      formData.append('photoType', 'arrival');
      
      await movementService.uploadPhotos(id, formData);
      
      setArrivalPhotosStatus(prev => ({ ...prev, [photoType]: true }));
      setSelectedArrivalPhotoFiles(prev => ({ ...prev, [photoType]: null }));
      
      setUpdateSuccess(`Photo d'arrivée ${photoType} téléchargée avec succès`);
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
    } catch (err) {
      setError(err.response?.data?.message || `Erreur lors du téléchargement de la photo`);
    } finally {
      setUploadingArrivalPhoto(false);
    }
  };

  const handleResetPhotoStatus = (photoType) => {
    setPhotosStatus(prev => ({ ...prev, [photoType]: false }));
    setExpandedPhotoSection(photoType);
  };

  const handleResetArrivalPhotoStatus = (photoType) => {
    setArrivalPhotosStatus(prev => ({ ...prev, [photoType]: false }));
    setExpandedArrivalPhotoSection(photoType);
  };

  // Fonctions utilitaires
  const getPhotoUrlByType = (photoType) => {
    if (!movement?.photos) return '';
    const photo = movement.photos.find(p => 
      p.type === photoType && (!p.photoType || p.photoType === 'departure')
    );
    return photo ? photo.url : '';
  };

  const getArrivalPhotoUrlByType = (photoType) => {
    if (!movement?.photos) return '';
    const photo = movement.photos.find(p => 
      p.type === photoType && p.photoType === 'arrival'
    );
    return photo ? photo.url : '';
  };

  const allRequiredPhotosTaken = () => 
    photosStatus && Object.values(photosStatus).every(status => status === true);

  const allRequiredArrivalPhotosTaken = () => 
    arrivalPhotosStatus && Object.values(arrivalPhotosStatus).every(status => status === true);

  const navigateBack = () => navigate('/movement/history');

  // Rendu des vues conditionnelles
  if (loading && !movement) {
    return (
      <div>
        <Navigation />
        <div className="loading-container"><LoadingSpinner /></div>
      </div>
    );
  }

  if ((error && !movement) || !movement) {
    return (
      <div>
        <Navigation />
        <div className="detail-container">
          <AlertMessage type="error" message={error || "Mouvement non trouvé"} />
          <div className="back-button-container">
            <button onClick={navigateBack} className="btn btn-primary">
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
          <a onClick={navigateBack} className="back-link" href="#back">
            <i className="fas fa-arrow-left"></i> Retour à l'historique
          </a>
        </div>
        
        {error && <AlertMessage type="error" message={error} />}
        {updateSuccess && <AlertMessage type="success" message={updateSuccess} />}
        
        <div className="detail-card">
          {/* Section d'informations du véhicule */}
          <VehicleInfoSection movement={movement} />
          
          {/* Section d'assignation du chauffeur (admin uniquement) */}
          {currentUser.role === 'admin' && (
            <DriverAssignmentSection
              movement={movement}
              allDrivers={allDrivers}
              loadingDrivers={loadingDrivers}
              onAssignDriver={handleAssignDriver}
              updateLoading={updateLoading}
            />
          )}
          
          {/* Section d'itinéraire */}
          <RouteInfoSection movement={movement} />
          
          {/* Section d'upload de photos guidé au départ */}
          {movement.status === 'preparing' && 
           movement.userId && 
           currentUser.role === 'driver' && 
           movement.userId._id === currentUser._id && (
            <PhotoUploadSection
              movement={movement}
              photosStatus={photosStatus}
              expandedSection={expandedPhotoSection}
              selectedFiles={selectedPhotoFiles}
              onExpandSection={handleExpandPhotoSection}
              onSelectPhoto={handleSelectPhoto}
              onUploadPhoto={handleUploadPhoto}
              onResetPhotoStatus={handleResetPhotoStatus}
              uploadingPhoto={uploadingPhoto}
              getPhotoUrlByType={getPhotoUrlByType}
              sectionTitle="Photos du véhicule au départ"
              instructionText="Pour continuer ce mouvement, vous devez prendre les photos suivantes du véhicule avant le départ. Chaque section doit être complétée."
            />
          )}

          {/* Section d'upload de photos guidé à l'arrivée */}
          {movement.status === 'in-progress' && 
          movement.userId && 
          currentUser.role === 'driver' && 
          movement.userId._id === currentUser._id && (
            <PhotoUploadSection
              movement={movement}
              photosStatus={arrivalPhotosStatus}
              expandedSection={expandedArrivalPhotoSection}
              selectedFiles={selectedArrivalPhotoFiles}
              onExpandSection={handleExpandArrivalPhotoSection}
              onSelectPhoto={handleSelectArrivalPhoto}
              onUploadPhoto={handleUploadArrivalPhoto}
              onResetPhotoStatus={handleResetArrivalPhotoStatus}
              uploadingPhoto={uploadingArrivalPhoto}
              getPhotoUrlByType={getArrivalPhotoUrlByType}
              sectionTitle="Photos du véhicule à l'arrivée"
              instructionText="Pour terminer ce mouvement, vous devez prendre les photos suivantes du véhicule à l'arrivée. Chaque section doit être complétée."
            />
          )}

          {fullscreenPreview && (
            <div className="fullscreen-preview" onClick={() => setFullscreenPreview(null)}>
              <div className="preview-container">
                <img src={fullscreenPreview} alt="Prévisualisation plein écran" />
                <button className="close-preview" onClick={() => setFullscreenPreview(null)}>×</button>
              </div>
            </div>
          )}
          
          {/* Section des notes */}
          <NotesSection
            notes={notes}
            onChange={setNotes}
            readOnly={movement.status === 'completed'}
          />
          
          {/* Section des dates */}
          <DatesSection movement={movement} />
          
          {/* Actions selon le statut et le rôle */}
          <ActionButtons
            movement={movement}
            currentUser={currentUser}
            loading={updateLoading}
            allPhotosTaken={allRequiredPhotosTaken()}
            allArrivalPhotosTaken={allRequiredArrivalPhotosTaken()}
            onPrepareMovement={handlePrepareMovement}
            onStartMovement={handleStartMovement}
            onCompleteMovement={handleCompleteMovement}
            onDeleteMovement={handleDeleteMovement}
            navigateBack={navigateBack}
          />
        </div>
      </div>
    </div>
  );
};

export default MovementDetail;