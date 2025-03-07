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
  const { id } = useParams();
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  
  // États pour les photos
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photosStatus, setPhotosStatus] = useState({
    front: false,
    passenger: false,
    driver: false,
    rear: false,
    windshield: false,
    roof: false,
    meter: false
  });
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Charger les détails du mouvement
  useEffect(() => {
    loadMovement();
  }, [id]);

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
  const handleAssignDriver = async (driverId) => {
    try {
      setUpdateLoading(true);
      await movementService.assignDriver(id, driverId);
      
      setUpdateSuccess('Chauffeur assigné avec succès');
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
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

  // Terminer le mouvement
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

  // Fonction pour gérer l'expansion des sections de photo
  const handleExpandPhotoSection = (section) => {
    setExpandedPhotoSection(expandedPhotoSection === section ? null : section);
  };

  // Gérer la sélection d'une photo pour une section spécifique
  const handleSelectPhoto = (type, file) => {
    setSelectedPhotoFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  // Télécharger une photo
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
      setUpdateSuccess(`Photo téléchargée avec succès`);
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
    } catch (err) {
      console.error(`Erreur lors du téléchargement de la photo ${photoType}:`, err);
      setError(err.response?.data?.message || `Erreur lors du téléchargement de la photo`);
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

  // Vérifier si toutes les photos requises ont été prises
  const allRequiredPhotosTaken = () => {
    return Object.values(photosStatus).every(status => status === true);
  };

  // Naviguer vers l'historique des mouvements
  const navigateBack = () => {
    navigate('/movement/history');
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !movement) {
    return (
      <div>
        <Navigation />
        <div className="detail-container">
          <AlertMessage type="error" message={error} />
          <div className="back-button-container">
            <button 
              onClick={navigateBack}
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
          <AlertMessage type="error" message="Mouvement non trouvé" />
          <div className="back-button-container">
            <button 
              onClick={navigateBack}
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
          
          {/* Section d'upload de photos guidé */}
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
            />
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