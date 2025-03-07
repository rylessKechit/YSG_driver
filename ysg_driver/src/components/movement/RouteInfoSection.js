// src/components/movement/RouteInfoSection.js
import React from 'react';
import DateDisplay from '../ui/DateDisplay';

const RouteInfoSection = ({ movement }) => {
  return (
    <div className="detail-section route-info">
      <h2 className="section-title">
        <i className="fas fa-map-marker-alt"></i> Itinéraire
      </h2>
      <div className="route-map">
        <div className="route-point">
          <div className="point-marker departure"></div>
          <div className="point-details">
            <div className="point-type">Départ</div>
            <div className="point-name">{movement.departureLocation.name}</div>
            <div className="point-time">
              <DateDisplay date={movement.departureTime} />
            </div>
            {movement.departureLocation.coordinates && movement.departureLocation.coordinates.latitude && (
              <div className="point-coordinates">
                Lat: {movement.departureLocation.coordinates.latitude.toFixed(4)}, 
                Lng: {movement.departureLocation.coordinates.longitude.toFixed(4)}
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
              <DateDisplay date={movement.arrivalTime} />
            </div>
            {movement.arrivalLocation.coordinates && movement.arrivalLocation.coordinates.latitude && (
              <div className="point-coordinates">
                Lat: {movement.arrivalLocation.coordinates.latitude.toFixed(4)}, 
                Lng: {movement.arrivalLocation.coordinates.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteInfoSection;