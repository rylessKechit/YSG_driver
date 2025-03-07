// src/components/movement/ActionButtons.js
import React from 'react';

const ActionButtons = ({ 
  movement, 
  currentUser, 
  loading, 
  allPhotosTaken,
  onPrepareMovement,
  onStartMovement,
  onCompleteMovement,
  onDeleteMovement,
  navigateBack
}) => {

  // Check if user can edit this movement
  const canEdit = () => {
    if (!movement || !currentUser) return false;
    
    // Admins can always edit
    if (currentUser.role === 'admin') return true;
    
    // Drivers can edit only if they are assigned
    if (currentUser.role === 'driver' && 
        movement.userId && 
        movement.userId._id === currentUser._id) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="detail-actions">
      {/* Back button */}
      <button
        onClick={navigateBack}
        className="btn btn-secondary"
      >
        Retour à la liste
      </button>
      
      {/* Admin-only: delete button (if not started) */}
      {currentUser.role === 'admin' && (movement.status === 'pending' || movement.status === 'assigned') && (
        <button
          onClick={onDeleteMovement}
          className="btn btn-danger"
          disabled={loading}
        >
          {loading ? 'Suppression...' : 'Supprimer le mouvement'}
        </button>
      )}
      
      {/* Step 1: Start preparation (assigned driver) */}
      {movement.status === 'assigned' && 
        movement.userId && 
        currentUser.role === 'driver' && 
        movement.userId._id === currentUser._id && (
        <button
          onClick={onPrepareMovement}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Démarrage...' : 'Préparer le véhicule'}
        </button>
      )}
      
      {/* Step 2: Start movement (after preparation and photos) */}
      {movement.status === 'preparing' && 
        movement.userId && 
        currentUser.role === 'driver' && 
        movement.userId._id === currentUser._id && (
        <button
          onClick={onStartMovement}
          className="btn btn-success"
          disabled={loading || !allPhotosTaken}
          title={!allPhotosTaken ? "Toutes les photos requises doivent être prises" : ""}
        >
          {loading ? 'Démarrage...' : 'En route'}
        </button>
      )}
      
      {/* Step 3: Complete movement */}
      {movement.status === 'in-progress' && 
        movement.userId && 
        currentUser.role === 'driver' && 
        movement.userId._id === currentUser._id && (
        <button
          onClick={onCompleteMovement}
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? 'Finalisation...' : 'Terminer le trajet'}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;