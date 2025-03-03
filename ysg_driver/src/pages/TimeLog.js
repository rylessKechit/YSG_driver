// src/pages/TimeLog.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import timelogService from '../services/timelogService';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import '../styles/TimeLog.css';

const TimeLog = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Rediriger si l'utilisateur est admin ou direction
  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'direction')) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Obtenir la géolocalisation actuelle
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            name: 'Position actuelle' // Vous pourriez utiliser une API de reverse geocoding pour obtenir l'adresse réelle
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          reject(error);
        }
      );
    });
  };

  // Charger le pointage actif au chargement de la page
  useEffect(() => {
    // Ne pas charger le pointage si l'utilisateur est admin ou direction
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'direction')) {
      setLoading(false);
      return;
    }
    
    const fetchActiveTimeLog = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Tentative de récupération du pointage actif...');
        const data = await timelogService.getActiveTimeLog();
        console.log('Réponse reçue:', data);
        
        setActiveTimeLog(data);
        
        // Obtenir la position actuelle en arrière-plan
        getCurrentLocation().catch(err => {
          console.error('Erreur de géolocalisation:', err);
          // Ne pas mettre d'erreur sur setError car ce n'est pas bloquant
        });
      } catch (err) {
        console.error('Erreur lors du chargement du pointage actif:', err);
        if (err.response && err.response.status === 404) {
          // C'est normal de ne pas avoir de pointage actif, pas d'erreur à afficher
          console.log('Aucun pointage actif trouvé (404)');
        } else {
          setError('Erreur lors du chargement du pointage actif. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTimeLog();
  }, [currentUser]);

  // Démarrer un pointage
  const handleStartTimeLog = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      // Obtenir la position actuelle
      let locationData;
      try {
        locationData = location || await getCurrentLocation();
      } catch (geoError) {
        console.error('Erreur de géolocalisation lors du démarrage:', geoError);
        // Continuer avec une localisation vide si la géolocalisation échoue
        locationData = {
          name: 'Position non disponible',
          coordinates: { latitude: null, longitude: null }
        };
      }
      
      console.log('Démarrage du pointage avec la localisation:', locationData);
      const response = await timelogService.startTimeLog(locationData);
      console.log('Réponse du démarrage:', response);
      
      setActiveTimeLog(response.timeLog);
      
      // Notification de succès
      setSuccess('Pointage démarré avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors du démarrage du pointage:', err);
      setError(err.response?.data?.message || 'Erreur lors du démarrage du pointage. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Terminer un pointage
  const handleEndTimeLog = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      // Obtenir la position actuelle
      let locationData;
      try {
        locationData = location || await getCurrentLocation();
      } catch (geoError) {
        console.error('Erreur de géolocalisation lors de la fin:', geoError);
        // Continuer avec une localisation vide si la géolocalisation échoue
        locationData = {
          name: 'Position non disponible',
          coordinates: { latitude: null, longitude: null }
        };
      }
      
      console.log('Fin du pointage avec la localisation:', locationData);
      const response = await timelogService.endTimeLog(locationData, notes);
      console.log('Réponse de la fin:', response);
      
      setActiveTimeLog(null);
      setNotes('');
      
      // Notification de succès
      setSuccess('Pointage terminé avec succès');
      setTimeout(() => {
        setSuccess(null);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la fin du pointage:', err);
      setError(err.response?.data?.message || 'Erreur lors de la fin du pointage. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      {/* Vérification pour ne pas afficher le contenu si l'utilisateur est admin ou direction */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'direction') ? (
        <div className="unauthorized-message">
          <h2>Accès non autorisé</h2>
          <p>Votre rôle ne permet pas d'accéder à la fonctionnalité de pointage.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Retour au tableau de bord
          </button>
        </div>
      ) : (
        <div className="timelog-container">
          <h1 className="timelog-title">Pointage de service</h1>
          
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
          
          <div className="timelog-card">
            <div className="status-section">
              <h2 className="status-title">Statut actuel</h2>
              <div className="status-indicator">
                <div className={`status-dot ${activeTimeLog ? 'active' : 'inactive'}`}></div>
                <span className="status-text">{activeTimeLog ? 'En service' : 'Hors service'}</span>
              </div>
            </div>
            
            {activeTimeLog ? (
              <div>
                <div className="timestamp">
                  <p>
                    Service démarré le {new Date(activeTimeLog.startTime).toLocaleString()}
                  </p>
                </div>
                
                <div className="notes-section">
                  <label htmlFor="notes" className="notes-label">
                    Notes de fin de service
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="notes-textarea"
                    rows="4"
                    placeholder="Entrez des notes concernant votre service (facultatif)"
                  ></textarea>
                </div>
                
                <button
                  onClick={handleEndTimeLog}
                  disabled={actionLoading}
                  className="btn-end"
                >
                  {actionLoading ? 'Traitement en cours...' : 'Terminer le service'}
                </button>
              </div>
            ) : (
              <div>
                <p className="instruction-text">
                  Appuyez sur le bouton ci-dessous pour commencer votre service.
                </p>
                
                <button
                  onClick={handleStartTimeLog}
                  disabled={actionLoading}
                  className="btn-start"
                >
                  {actionLoading ? 'Traitement en cours...' : 'Démarrer le service'}
                </button>
              </div>
            )}
          </div>
          
          <div className="back-link">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
              Retour au tableau de bord
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeLog;