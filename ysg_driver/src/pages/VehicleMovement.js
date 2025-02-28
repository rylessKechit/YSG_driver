import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import timelogService from '../services/timelogService';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';
import '../styles/VehicleMovement.css';

const VehicleMovement = () => {
  const [formData, setFormData] = useState({
    licensePlate: '',
    vehicleModel: '',
    departureLocation: {
      name: '',
      coordinates: { latitude: null, longitude: null }
    },
    arrivalLocation: {
      name: '',
      coordinates: { latitude: null, longitude: null }
    },
    notes: ''
  });
  
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur a un service actif
  useEffect(() => {
    const checkActiveTimeLog = async () => {
      try {
        setLoading(true);
        const timeLog = await timelogService.getActiveTimeLog();
        setActiveTimeLog(timeLog);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la vérification du statut de service:', err);
        if (err.response && err.response.status === 404) {
          setError('Vous devez être en service pour créer un mouvement de véhicule');
        } else {
          setError('Erreur lors de la vérification du statut de service');
        }
        setLoading(false);
      }
    };

    checkActiveTimeLog();
  }, []);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Gérer la sélection des photos
  const handlePhotoChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  // Utiliser la géolocalisation pour le lieu de départ
  const useCurrentLocationForDeparture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            departureLocation: {
              ...formData.departureLocation,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            }
          });
          setSuccess('Position actuelle utilisée pour le lieu de départ');
          setTimeout(() => setSuccess(null), 3000);
        },
        (err) => {
          setError(`Erreur de géolocalisation: ${err.message}`);
        }
      );
    } else {
      setError('La géolocalisation n\'est pas prise en charge par votre navigateur');
    }
  };

  // Utiliser la géolocalisation pour le lieu d'arrivée
  const useCurrentLocationForArrival = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            arrivalLocation: {
              ...formData.arrivalLocation,
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            }
          });
          setSuccess('Position actuelle utilisée pour le lieu d\'arrivée');
          setTimeout(() => setSuccess(null), 3000);
        },
        (err) => {
          setError(`Erreur de géolocalisation: ${err.message}`);
        }
      );
    } else {
      setError('La géolocalisation n\'est pas prise en charge par votre navigateur');
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activeTimeLog) {
      setError('Vous devez être en service pour créer un mouvement de véhicule');
      return;
    }
    
    if (!formData.licensePlate || !formData.departureLocation.name || !formData.arrivalLocation.name) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Créer le mouvement
      const response = await movementService.createMovement(formData);
      const movementId = response.movement._id;
      
      // Uploader les photos si nécessaire
      if (photos.length > 0) {
        const photoFormData = new FormData();
        photos.forEach(photo => {
          photoFormData.append('photos', photo);
        });
        photoFormData.append('type', 'departure');
        
        await movementService.uploadPhotos(movementId, photoFormData);
      }
      
      // Démarrer le mouvement
      await movementService.startMovement(movementId);
      
      setSuccess('Mouvement de véhicule créé et démarré avec succès');
      setTimeout(() => {
        navigate('/movement/history');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la création du mouvement:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du mouvement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation />
      
      <div className="vehicle-movement-container">
        <h1 className="page-title">Nouveau mouvement de véhicule</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {!activeTimeLog ? (
              <div className="no-service-message">
                <p>Vous devez être en service pour créer un mouvement de véhicule.</p>
                <button 
                  onClick={() => navigate('/timelog')}
                  className="btn btn-primary"
                >
                  Aller à la page de pointage
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="movement-form">
                <div className="form-section">
                  <h2 className="section-title">Informations du véhicule</h2>
                  
                  <div className="form-group">
                    <label htmlFor="licensePlate" className="form-label">
                      Plaque d'immatriculation *
                    </label>
                    <input
                      type="text"
                      id="licensePlate"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ex: AB-123-CD"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="vehicleModel" className="form-label">
                      Modèle du véhicule
                    </label>
                    <input
                      type="text"
                      id="vehicleModel"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ex: Renault Clio"
                    />
                  </div>
                </div>
                
                <div className="form-section">
                  <h2 className="section-title">Lieu de départ</h2>
                  
                  <div className="form-group">
                    <label htmlFor="departureLocation.name" className="form-label">
                      Nom du lieu de départ *
                    </label>
                    <input
                      type="text"
                      id="departureLocation.name"
                      name="departureLocation.name"
                      value={formData.departureLocation.name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ex: Aéroport d'Orly"
                      required
                    />
                  </div>
                  
                  <div className="location-coordinates">
                    {formData.departureLocation.coordinates.latitude && (
                      <p className="coordinates-text">
                        Coordonnées: {formData.departureLocation.coordinates.latitude.toFixed(4)}, 
                        {formData.departureLocation.coordinates.longitude.toFixed(4)}
                      </p>
                    )}
                    <button 
                      type="button" 
                      onClick={useCurrentLocationForDeparture}
                      className="btn btn-secondary"
                    >
                      Utiliser ma position actuelle
                    </button>
                  </div>
                </div>
                
                <div className="form-section">
                  <h2 className="section-title">Lieu d'arrivée</h2>
                  
                  <div className="form-group">
                    <label htmlFor="arrivalLocation.name" className="form-label">
                      Nom du lieu d'arrivée *
                    </label>
                    <input
                      type="text"
                      id="arrivalLocation.name"
                      name="arrivalLocation.name"
                      value={formData.arrivalLocation.name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ex: Aéroport Charles de Gaulle"
                      required
                    />
                  </div>
                  
                  <div className="location-coordinates">
                    {formData.arrivalLocation.coordinates.latitude && (
                      <p className="coordinates-text">
                        Coordonnées: {formData.arrivalLocation.coordinates.latitude.toFixed(4)}, 
                        {formData.arrivalLocation.coordinates.longitude.toFixed(4)}
                      </p>
                    )}
                    <button 
                      type="button" 
                      onClick={useCurrentLocationForArrival}
                      className="btn btn-secondary"
                    >
                      Utiliser ma position actuelle
                    </button>
                  </div>
                </div>
                
                <div className="form-section">
                  <h2 className="section-title">Photos du véhicule</h2>
                  
                  <div className="form-group">
                    <label htmlFor="photos" className="form-label">
                      Ajouter des photos
                    </label>
                    <input
                      type="file"
                      id="photos"
                      name="photos"
                      onChange={handlePhotoChange}
                      className="form-input file-input"
                      multiple
                      accept="image/*"
                    />
                    <p className="help-text">
                      Vous pouvez sélectionner plusieurs photos (max 5)
                    </p>
                  </div>
                  
                  {photos.length > 0 && (
                    <div className="selected-photos">
                      <p>{photos.length} photo(s) sélectionnée(s)</p>
                    </div>
                  )}
                </div>
                
                <div className="form-section">
                  <h2 className="section-title">Notes</h2>
                  
                  <div className="form-group">
                    <label htmlFor="notes" className="form-label">
                      Notes additionnelles
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="form-textarea"
                      rows="4"
                      placeholder="Informations supplémentaires..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Création en cours...' : 'Créer et démarrer le trajet'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleMovement;