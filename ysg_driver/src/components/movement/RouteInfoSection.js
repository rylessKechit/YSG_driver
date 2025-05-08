// src/components/movement/RouteInfoSection.js
import React, { useState, useEffect } from 'react';
import DateDisplay from '../ui/DateDisplay';
import axios from 'axios'; // Assurez-vous que axios est installé

const RouteInfoSection = ({ movement }) => {
  // État pour stocker l'ETA
  const [eta, setEta] = useState(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [etaError, setEtaError] = useState(null);

  // Fonction pour ouvrir l'itinéraire complet dans Waze
  const openRouteInWaze = () => {
    try {
      const { coordinates: fromCoords } = movement.departureLocation;
      const { coordinates: toCoords } = movement.arrivalLocation;
      
      if (!fromCoords || !toCoords || !fromCoords.latitude || !toCoords.latitude) {
        alert("Coordonnées GPS manquantes pour l'itinéraire complet.");
        return;
      }
      
      // Construire l'URL Waze pour l'itinéraire
      const wazeUrl = `https://waze.com/ul?ll=${toCoords.latitude},${toCoords.longitude}&from=${fromCoords.latitude},${fromCoords.longitude}&navigate=yes`;
      
      // Ouvrir Waze dans un nouvel onglet
      window.open(wazeUrl, '_blank');
    } catch (error) {
      console.error("Erreur lors de l'ouverture de Waze:", error);
      alert("Impossible d'ouvrir l'itinéraire dans Waze.");
    }
  };

  // Fonction pour calculer l'ETA manuellement
  const calculateETA = () => {
    try {
      setEtaLoading(true);
      setEtaError(null);
      
      const { coordinates: origin } = movement.departureLocation;
      const { coordinates: destination } = movement.arrivalLocation;
      
      if (!origin || !destination || !origin.latitude || !destination.latitude) {
        throw new Error("Coordonnées GPS manquantes");
      }
      
      // Calculer la distance à vol d'oiseau (formule de Haversine)
      const R = 6371; // Rayon de la Terre en km
      const dLat = (destination.latitude - origin.latitude) * Math.PI / 180;
      const dLon = (destination.longitude - origin.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(origin.latitude * Math.PI / 180) * Math.cos(destination.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Estimer le temps de trajet (en supposant une vitesse moyenne de 50 km/h)
      const averageSpeed = 50; // km/h
      const timeInHours = distance / averageSpeed;
      const timeInMinutes = Math.round(timeInHours * 60);
      
      // Formater les résultats
      let durationText;
      if (timeInMinutes < 60) {
        durationText = `${timeInMinutes} min`;
      } else {
        const hours = Math.floor(timeInMinutes / 60);
        const mins = timeInMinutes % 60;
        durationText = `${hours} h ${mins} min`;
      }
      
      const distanceText = distance < 10 ? 
        `${Math.round(distance * 10) / 10} km` : 
        `${Math.round(distance)} km`;
      
      // Stocker le résultat
      setEta({
        duration: durationText,
        distance: distanceText,
        // Ajouter un temps avec trafic (un peu plus long)
        durationWithTraffic: distance < 20 ? durationText : 
          `${Math.round(timeInMinutes * 1.2)} min`
      });
    } catch (error) {
      console.error("Erreur lors du calcul de l'ETA:", error);
      setEtaError("Impossible d'estimer le temps d'arrivée");
    } finally {
      setEtaLoading(false);
    }
  };

  // Calculer l'ETA au chargement du composant
  useEffect(() => {
    const canShowEta = movement.status === 'assigned' || 
                        movement.status === 'preparing' || 
                        movement.status === 'in-progress';
    
    if (canShowEta && 
        movement.departureLocation?.coordinates?.latitude && 
        movement.arrivalLocation?.coordinates?.latitude) {
      calculateETA();
    }
  }, [movement.status, movement.departureLocation, movement.arrivalLocation]);

  // Composant pour afficher un point de l'itinéraire (départ ou arrivée)
  const RoutePoint = ({ type, location, time }) => {
    const isArrival = type === 'arrival';
    
    return (
      <div className="route-point">
        <div className={`point-marker ${type}`}></div>
        <div className="point-details">
          <div className="point-type">{isArrival ? 'Arrivée' : 'Départ'}</div>
          <div className="point-name">{location.name}</div>
          <div className="point-time">
            <DateDisplay date={time} />
          </div>
        </div>
      </div>
    );
  };

  // Vérifier si le mouvement a un statut approprié pour afficher le bouton Waze
  const canShowWazeButton = (movement.status === 'assigned' || 
                            movement.status === 'preparing' || 
                            movement.status === 'in-progress') &&
                            movement.departureLocation?.coordinates?.latitude &&
                            movement.arrivalLocation?.coordinates?.latitude;

  return (
    <div className="detail-section route-info">
      <h2 className="section-title">
        <i className="fas fa-map-marker-alt"></i> Itinéraire
      </h2>
      <div className="route-map">
        <RoutePoint 
          type="departure" 
          location={movement.departureLocation} 
          time={movement.departureTime} 
        />
        
        <RoutePoint 
          type="arrival" 
          location={movement.arrivalLocation} 
          time={movement.arrivalTime} 
        />
        
        {/* Bouton pour ouvrir l'itinéraire dans Waze + ETA */}
        {canShowWazeButton && (
          <div className="waze-navigation-section">
            <button 
              onClick={openRouteInWaze}
              className="btn btn-waze"
            >
              <i className="fas fa-route"></i> Naviguer avec Waze
            </button>
            
            {/* Section ETA */}
            <div className="eta-section">
              {etaLoading ? (
                <div className="eta-loading">
                  <i className="fas fa-spinner fa-spin"></i> Calcul du temps d'arrivée...
                </div>
              ) : etaError ? (
                <div className="eta-error">
                  <i className="fas fa-exclamation-circle"></i> {etaError}
                  <button onClick={calculateETA} className="eta-refresh">
                    <i className="fas fa-sync-alt"></i> Réessayer
                  </button>
                </div>
              ) : eta ? (
                <div className="eta-info">
                  <div className="eta-detail">
                    <span className="eta-label">Durée estimée:</span>
                    <span className="eta-value">{eta.duration}</span>
                  </div>
                  <div className="eta-detail">
                    <span className="eta-label">Distance:</span>
                    <span className="eta-value">{eta.distance}</span>
                  </div>
                  <button onClick={calculateETA} className="eta-refresh" title="Rafraîchir l'ETA">
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteInfoSection;