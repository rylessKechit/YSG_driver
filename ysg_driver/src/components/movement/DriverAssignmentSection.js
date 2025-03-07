// src/components/movement/DriverAssignmentSection.js
import React, { useState } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const DriverAssignmentSection = ({ 
  movement, 
  allDrivers, 
  loadingDrivers, 
  onAssignDriver, 
  updateLoading 
}) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  
  const handleAssignDriver = () => {
    if (selectedDriver) {
      onAssignDriver(selectedDriver);
      setSelectedDriver('');
    }
  };

  return (
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
          {(movement.status === 'pending' || movement.status === 'assigned') && (
            <div className="change-driver">
              <h3 className="subsection-title">Modifier le chauffeur</h3>
              
              {loadingDrivers ? (
                <div className="loading-indicator-small">
                  <LoadingSpinner size="small" /> Chargement des chauffeurs...
                </div>
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
          )}
        </div>
      ) : (
        <div className="no-driver-assigned">
          <p className="no-assignment-message">Aucun chauffeur assigné à ce mouvement.</p>
          
          {loadingDrivers ? (
            <div className="loading-indicator-small">
              <LoadingSpinner size="small" /> Chargement des chauffeurs...
            </div>
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
  );
};

export default DriverAssignmentSection;