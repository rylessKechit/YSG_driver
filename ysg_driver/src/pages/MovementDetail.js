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
  
  // États pour les photos au départ
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

  const [fullscreenPreview, setFullscreenPreview] = useState(null);

  // États pour les photos à l'arrivée
  const [expandedArrivalPhotoSection, setExpandedArrivalPhotoSection] = useState(null);
  const [selectedArrivalPhotoFiles, setSelectedArrivalPhotoFiles] = useState({
    front: null,
    passenger: null,
    driver: null,
    rear: null,
    windshield: null,
    roof: null,
    meter: null
  });
  const [uploadingArrivalPhoto, setUploadingArrivalPhoto] = useState(false);
  const [arrivalPhotosStatus, setArrivalPhotosStatus] = useState({
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
        console.log("Toutes les photos reçues:", data.photos);
        
        // Nouvelle approche: on conserve l'état actuel et on met à jour seulement ce qui est confirmé
        const updatedPhotoStatus = { ...photosStatus };
        
        data.photos.forEach(photo => {
          // Si la photo a un type défini et qu'elle est de type "departure" (ou sans type spécifié)
          if (photo.type && (photo.photoType === 'departure' || !photo.photoType)) {
            updatedPhotoStatus[photo.type] = true;
            console.log(`Photo de type ${photo.type} trouvée et marquée comme complétée`);
          }
        });
        
        console.log("État des photos mis à jour après chargement:", updatedPhotoStatus);
        setPhotosStatus(updatedPhotoStatus);
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des détails du mouvement:', err);
      setError('Erreur lors du chargement des détails du mouvement');
    } finally {
      setLoading(false);
    }
  };

  // Ajoutez cette fonction pour gérer le clic sur la prévisualisation
  const handleImagePreview = (url) => {
    if (url) {
      setFullscreenPreview(url);
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
      // Vérifier que toutes les photos d'arrivée ont été prises
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
      console.error('Erreur lors de la fin du mouvement:', err);
      setError(err.response?.data?.message || 'Erreur lors de la fin du mouvement');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Fonction pour gérer l'expansion des sections de photo au départ
  const handleExpandPhotoSection = (section) => {
    setExpandedPhotoSection(expandedPhotoSection === section ? null : section);
  };

  // Fonction pour gérer l'expansion des sections de photo à l'arrivée
  const handleExpandArrivalPhotoSection = (section) => {
    setExpandedArrivalPhotoSection(expandedArrivalPhotoSection === section ? null : section);
  };

  // Gérer la sélection d'une photo pour une section spécifique au départ
  const handleSelectPhoto = (type, file) => {
    setSelectedPhotoFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  // Gérer la sélection d'une photo pour une section spécifique à l'arrivée
  const handleSelectArrivalPhoto = (type, file) => {
    setSelectedArrivalPhotoFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  // Télécharger une photo au départ
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
      
      console.log(`Téléchargement de la photo pour ${photoType}...`);
      await movementService.uploadPhotos(id, formData);
      
      // Mettre à jour l'état AVANT de recharger le mouvement
      setPhotosStatus(prev => {
        const newStatus = {
          ...prev,
          [photoType]: true
        };
        console.log(`État des photos mis à jour pour ${photoType}:`, newStatus);
        return newStatus;
      });
      
      // Réinitialiser le fichier sélectionné
      setSelectedPhotoFiles(prev => ({
        ...prev,
        [photoType]: null
      }));
      
      setUpdateSuccess(`Photo ${photoType} téléchargée avec succès`);
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      // Recharger les données du mouvement
      await loadMovement();
      
    } catch (err) {
      console.error(`Erreur lors du téléchargement de la photo ${photoType}:`, err);
      setError(err.response?.data?.message || `Erreur lors du téléchargement de la photo`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Télécharger une photo à l'arrivée
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
      formData.append('photoType', 'arrival'); // Ajout du type de photo: arrivée
      
      await movementService.uploadPhotos(id, formData);
      
      // Mettre à jour le statut de la photo
      setArrivalPhotosStatus(prev => ({
        ...prev,
        [photoType]: true
      }));
      
      // Réinitialiser le fichier sélectionné
      setSelectedArrivalPhotoFiles(prev => ({
        ...prev,
        [photoType]: null
      }));
      
      // Afficher un message de succès et recharger le mouvement
      setUpdateSuccess(`Photo d'arrivée téléchargée avec succès`);
      setTimeout(() => setUpdateSuccess(null), 3000);
      
      await loadMovement();
    } catch (err) {
      console.error(`Erreur lors du téléchargement de la photo d'arrivée ${photoType}:`, err);
      setError(err.response?.data?.message || `Erreur lors du téléchargement de la photo`);
    } finally {
      setUploadingArrivalPhoto(false);
    }
  };

  // Réinitialiser le statut d'une photo pour permettre le remplacement (départ)
  const handleResetPhotoStatus = (photoType) => {
    setPhotosStatus(prev => ({
      ...prev,
      [photoType]: false
    }));
    
    // Ouvrir la section correspondante
    setExpandedPhotoSection(photoType);
  };

  // Réinitialiser le statut d'une photo pour permettre le remplacement (arrivée)
  const handleResetArrivalPhotoStatus = (photoType) => {
    setArrivalPhotosStatus(prev => ({
      ...prev,
      [photoType]: false
    }));
    
    // Ouvrir la section correspondante
    setExpandedArrivalPhotoSection(photoType);
  };

  // Obtenir l'URL d'une photo à partir de son type (départ)
  const getPhotoUrlByType = (photoType) => {
    if (!movement || !movement.photos) return '';
    
    // Chercher la photo avec le type spécifié
    const photo = movement.photos.find(photo => 
      photo.type === photoType && 
      (photo.photoType === 'departure' || !photo.photoType)
    );
    
    // Ajouter un log pour voir ce qui est trouvé
    console.log(`Photo trouvée pour ${photoType}:`, photo);
    
    return photo ? photo.url : '';
  };

  // Obtenir l'URL d'une photo à partir de son type (arrivée)
  const getArrivalPhotoUrlByType = (photoType) => {
    if (!movement || !movement.photos) return '';
    
    const photo = movement.photos.find(photo => photo.type === photoType && photo.photoType === 'arrival');
    return photo ? photo.url : '';
  };

  // Vérifier si toutes les photos requises ont été prises au départ
  const allRequiredPhotosTaken = () => {
    if (!photosStatus) return false;
    return Object.values(photosStatus).every(status => status === true);
  };

  // Vérifier si toutes les photos requises ont été prises à l'arrivée
  const allRequiredArrivalPhotosTaken = () => {
    if (!arrivalPhotosStatus) return false;
    return Object.values(arrivalPhotosStatus).every(status => status === true);
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