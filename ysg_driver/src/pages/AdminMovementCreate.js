// src/pages/AdminMovementCreate.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import movementService from '../services/movementService';
import Navigation from '../components/Navigation';
import '../styles/AdminMovementCreate.css';

const AdminMovementCreate = () => {
  const [formData, setFormData] = useState({
    userId: '',
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
  
  const [driversOnDuty, setDriversOnDuty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDrivers, setFetchingDrivers] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Vérifier que l'utilisateur est admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Charger les chauffeurs en service
  useEffect(() => {
    const loadDriversOnDuty = async () => {
      try {
        setFetchingDrivers(true);
        const drivers = await movementService.getDriversOnDuty();
        setDriversOnDuty(drivers);
      } catch (err) {
        console.error('Erreur lors du chargement des chauffeurs en service:', err);
        setError('Impossible de charger les chauffeurs en service');
      } finally {
        setFetchingDrivers(false);
      }
    };

    loadDriversOnDuty();
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
    
    if (!formData.userId || !formData.licensePlate || !formData.departureLocation.name || !formData.arrivalLocation.name) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Créer le mouvement
      const response = await movementService.createMovement(formData);
      
      setSuccess('Mouvement créé et assigné avec succès');
      setTimeout(() => {
        navigate('/admin/movements');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du mouvement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation />
      
      <div className="admin-movement-container">
        <div className="page-header">
          <h1 className="page-title">Créer un mouvement de véhicule</h1>
          <p className="page-subtitle">Assignez un nouveau mouvement à un chauffeur en service</p>
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
        
        {fetchingDrivers ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Chargement des chauffeurs en service...</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h2 className="section-title">
                    <i className="fas fa-user"></i> Sélection du chauffeur
                  </h2>
                  
                  <div className="form-group">
                    <label htmlFor="userId" className="form-label">Chauffeur *</label>
                    <select
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Sélectionnez un chauffeur</option>
                      {driversOnDuty.length > 0 ? (
                        driversOnDuty.map(driver => (
                          <option key={driver._id} value={driver._id}>
                            {driver.fullName} ({driver.username}) - En service depuis {new Date(driver.serviceStartTime).toLocaleTimeString()}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Aucun chauffeur en service</option>
                      )}
                    </select>
                    {driversOnDuty.length === 0 && (
                      <p className="form-hint">Aucun chauffeur n'est actuellement en service. Le mouvement sera créé en attente.</p>
                    )}
                  </div>
                </div>
                
                <div className="form-section">
                  <h2 className="section-title">
                    <i className="fas fa-car"></i> Informations du véhicule
                  </h2>
                  
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
                  <h2 className="section-title">
                    <i className="fas fa-map-marker-alt"></i> Lieu de départ
                  </h2>
                  
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
                  
                  <div className="location-helper">
                    {formData.departureLocation.coordinates.latitude && (
                      <div className="coordinates-box">
                        <p>Lat: {formData.departureLocation.coordinates.latitude.toFixed(6)}</p>
                        <p>Lng: {formData.departureLocation.coordinates.longitude.toFixed(6)}</p>
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={useCurrentLocationForDeparture}
                      className="btn btn-secondary"
                    >
                      <i className="fas fa-map-pin"></i> Utiliser ma position actuelle
                    </button>
                  </div>
                </div>
                
                <div className="form-section">
                  <h2 className="section-title">
                    <i className="fas fa-flag-checkered"></i> Lieu d'arrivée
                  </h2>
                  
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
                  
                  <div className="location-helper">
                    {formData.arrivalLocation.coordinates.latitude && (
                      <div className="coordinates-box">
                        <p>Lat: {formData.arrivalLocation.coordinates.latitude.toFixed(6)}</p>
                        <p>Lng: {formData.arrivalLocation.coordinates.longitude.toFixed(6)}</p>
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={useCurrentLocationForArrival}
                      className="btn btn-secondary"
                    >
                      <i className="fas fa-map-pin"></i> Utiliser ma position actuelle
                    </button>
                  </div>
                </div>
                
                <div className="form-section">
                  <h2 className="section-title">
                    <i className="fas fa-sticky-note"></i> Notes
                  </h2>
                  
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
                      placeholder="Informations supplémentaires pour le chauffeur..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => navigate('/admin/movements')}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Création en cours...' : 'Créer et assigner le mouvement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMovementCreate;