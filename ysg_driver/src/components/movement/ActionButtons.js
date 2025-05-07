import React, { useMemo, useState } from 'react';
import orderFormService from '../../services/orderFormService';

const ActionButtons = ({ 
  movement, 
  currentUser, 
  loading, 
  allPhotosTaken,
  allArrivalPhotosTaken = false,
  onPrepareMovement,
  onStartMovement,
  onCompleteMovement,
  onDeleteMovement,
  navigateBack
}) => {
  const [loadingOrderForm, setLoadingOrderForm] = useState(false);
  const [orderFormError, setOrderFormError] = useState(null);

  // Calcul mémorisé pour éviter des calculs répétés à chaque render
  const canEditMovement = useMemo(() => {
    if (!movement || !currentUser) return false;
    
    // Les administrateurs peuvent toujours modifier
    if (currentUser.role === 'admin' || currentUser.role === 'team-leader') return true;
    
    // Extraire l'ID de manière robuste
    const movementUserId = typeof movement.userId === 'object' && movement.userId !== null
      ? movement.userId._id
      : movement.userId;

    // Les chauffeurs peuvent modifier seulement s'ils sont assignés
    return currentUser.role === 'driver' && 
           movementUserId && 
           String(movementUserId) === String(currentUser._id);
  }, [movement, currentUser]);

  // Ouvrir le bon de commande
  const handleViewOrderForm = async () => {
    try {
      setLoadingOrderForm(true);
      setOrderFormError(null);
      
      const orderFormUrl = await orderFormService.getOrderFormUrl(movement._id);
      
      // Vérifier si nous sommes sur mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Sur mobile, proposer un download ou une ouverture dans une app externe
        // Option 1: utiliser un lien <a> avec attribut download
        const link = document.createElement('a');
        link.href = orderFormUrl;
        link.setAttribute('download', `bon_commande_${movement.licensePlate}.pdf`);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Afficher un message pour guider l'utilisateur
        setOrderFormError('Si le téléchargement ne démarre pas, vérifiez les notifications de votre appareil ou appuyez longuement sur le bouton et choisissez "Ouvrir dans une nouvelle fenêtre".');
        setTimeout(() => setOrderFormError(null), 6000);
      } else {
        // Sur desktop, comportement standard
        window.open(orderFormUrl, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du bon de commande:', error);
      setOrderFormError('Impossible de récupérer le bon de commande');
      setTimeout(() => setOrderFormError(null), 3000);
    } finally {
      setLoadingOrderForm(false);
    }
  };

  // Déterminer si le bon de commande est disponible
  const showOrderFormButton = useMemo(() => {
    // Afficher le bouton si le mouvement est au moins assigné ou s'il a déjà un bon de commande
    return movement && 
           (movement.status !== 'pending' || 
            (movement.orderForm && movement.orderForm.url)) &&
           (canEditMovement || currentUser.role === 'admin' || currentUser.role === 'team-leader');
  }, [movement, canEditMovement, currentUser]);

  return (
    <div className="detail-actions">
      {/* Bouton de retour - toujours visible */}
      <button 
        onClick={navigateBack} 
        className="btn btn-secondary"
      >
        Retour à la liste
      </button>
      
      {/* Bouton de préparation - visible quand assigné */}
      {movement.status === 'assigned' && canEditMovement && (
        <button 
          onClick={onPrepareMovement} 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Démarrage...' : 'Préparer le véhicule'}
        </button>
      )}
      
      {/* Bouton "En route" - visible quand en préparation ET que toutes les photos sont prises */}
      {movement.status === 'preparing' && canEditMovement && (
        <button 
          onClick={onStartMovement} 
          className="btn btn-success" 
          disabled={loading || !allPhotosTaken}
          title={!allPhotosTaken ? "Toutes les photos requises doivent être prises" : ""}
        >
          {loading ? 'Démarrage...' : 'En route'}
        </button>
      )}
      
      {/* Bouton de complétion - visible quand en cours */}
      {movement.status === 'in-progress' && canEditMovement && (
        <button 
          onClick={onCompleteMovement} 
          className="btn btn-warning" 
          disabled={loading || !allArrivalPhotosTaken}
          title={!allArrivalPhotosTaken ? "Toutes les photos d'arrivée requises doivent être prises" : ""}
        >
          {loading ? 'Finalisation...' : 'Terminer le trajet'}
        </button>
      )}
      
      {/* Bouton de suppression - admin uniquement pour les mouvements non démarrés */}
      {(currentUser.role === 'admin' || currentUser.role === 'team-leader') && 
       ['pending', 'assigned'].includes(movement.status) && (
        <button 
          onClick={onDeleteMovement} 
          className="btn btn-danger" 
          disabled={loading}
        >
          {loading ? 'Suppression...' : 'Supprimer le mouvement'}
        </button>
      )}
      
      {/* Bouton pour voir le bon de commande */}
      {showOrderFormButton && (
        <button 
          onClick={handleViewOrderForm}
          className="btn btn-info"
          disabled={loadingOrderForm}
        >
          {loadingOrderForm ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Chargement...
            </>
          ) : (
            <>
              <i className="fas fa-file-pdf"></i> Bon de commande
            </>
          )}
        </button>
      )}
      
      {/* Message d'erreur pour le bon de commande */}
      {orderFormError && (
        <div className="order-form-error">
          {orderFormError}
        </div>
      )}
    </div>
  );
};

// Utiliser React.memo pour éviter les rendus inutiles
export default React.memo(ActionButtons);