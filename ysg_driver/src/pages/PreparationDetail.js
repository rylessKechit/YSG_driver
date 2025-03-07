// src/pages/PreparationDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import preparationService from '../services/preparationService';
import Navigation from '../components/Navigation';

// Import des composants réutilisables
import PreparationInfoSection from '../components/preparation/PreparationInfoSection';
import PreparationTaskSection from '../components/preparation/PreparationTaskSection';
import PreparationDatesSection from '../components/preparation/PreparationDatesSection';
import PreparationActions from '../components/preparation/PreparationActions';
import NotesSection from '../components/movement/NotesSection';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AlertMessage from '../components/ui/AlertMessage';

import '../styles/PreparationDetail.css';

const PreparationDetail = () => {
  const { id } = useParams();
  const [preparation, setPreparation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notes, setNotes] = useState('');
  
  // État pour l'accordéon des tâches
  const [expandedTask, setExpandedTask] = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Chargement initial des données
  useEffect(() => {
    loadPreparation();
  }, [id]);

  // Charger les détails de la préparation
  const loadPreparation = async () => {
    try {
      setLoading(true);
      const data = await preparationService.getPreparation(id);
      setPreparation(data);
      
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des détails de la préparation:', err);
      setError('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le clic sur une tâche pour l'étendre/réduire
  const toggleTaskExpansion = (taskType) => {
    if (expandedTask === taskType) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskType);
    }
  };

  // Commencer une tâche
  const handleStartTask = async (taskType, photoFile, taskNotes) => {
    if (!photoFile) {
      setError('Vous devez prendre une photo de l\'état initial avant de commencer la tâche');
      return;
    }
    
    try {
      setTaskLoading(true);
      setError(null);
      
      await preparationService.startTask(id, taskType, photoFile, taskNotes);
      
      setSuccess(`Tâche commencée avec succès`);
      
      // Recharger la préparation pour afficher les changements
      await loadPreparation();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors du démarrage de la tâche:', err);
      setError(err.response?.data?.message || 'Erreur lors du démarrage de la tâche');
    } finally {
      setTaskLoading(false);
    }
  };

  // Terminer une tâche
  const handleCompleteTask = async (taskType, photoFile, additionalData) => {
    if (!photoFile) {
      setError('Vous devez prendre une photo de l\'état final pour terminer la tâche');
      return;
    }
    
    try {
      setTaskLoading(true);
      setError(null);
      
      await preparationService.completeTask(id, taskType, photoFile, additionalData);
      
      setSuccess(`Tâche terminée avec succès`);
      
      // Recharger la préparation pour afficher les changements
      await loadPreparation();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la finalisation de la tâche:', err);
      setError(err.response?.data?.message || 'Erreur lors de la finalisation de la tâche');
    } finally {
      setTaskLoading(false);
    }
  };

  // Ajouter une photo additionnelle
  const handleAddTaskPhoto = async (taskType, photoFile, description) => {
    if (!photoFile) {
      setError('Veuillez sélectionner une photo à ajouter');
      return;
    }
    
    try {
      setTaskLoading(true);
      setError(null);
      
      await preparationService.addTaskPhoto(id, taskType, photoFile, description);
      
      setSuccess('Photo additionnelle ajoutée avec succès');
      
      // Recharger la préparation pour afficher les changements
      await loadPreparation();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la photo:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout de la photo');
    } finally {
      setTaskLoading(false);
    }
  };

  // Gérer le stationnement (cas spécial)
  const handleParkingTask = async (taskType, photoFile, taskNotes) => {
    if (!photoFile) {
      setError('Vous devez prendre une photo pour valider le stationnement');
      return;
    }
    
    try {
      setTaskLoading(true);
      setError(null);
      
      // ÉTAPE 1: Démarrer la tâche de parking (passer à "in_progress")
      await preparationService.startTask(id, 'parking', photoFile, taskNotes);
      
      // Brève pause pour s'assurer que la première requête est traitée
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ÉTAPE 2: Compléter immédiatement la tâche (passer à "completed")
      const additionalData = { notes: taskNotes };
      await preparationService.completeTask(id, 'parking', photoFile, additionalData);
      
      setSuccess('Stationnement validé avec succès');
      
      // Recharger la préparation pour afficher les changements
      await loadPreparation();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la validation du stationnement:', err);
      setError(err.response?.data?.message || 'Erreur lors de la validation du stationnement');
    } finally {
      setTaskLoading(false);
    }
  };

  // Terminer la préparation
  const handleCompletePreparation = async () => {
    try {
      setLoading(true);
      
      await preparationService.completePreparation(id, { notes });
      await loadPreparation();
      
      setSuccess('Préparation terminée avec succès');
      setTimeout(() => {
        setSuccess(null);
        navigate('/preparations');
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la finalisation de la préparation:', err);
      setError('Erreur lors de la finalisation de la préparation');
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur peut éditer (préparateur assigné ou admin)
  const canEdit = () => {
    if (!preparation || !currentUser) return false;
    
    return (
      (preparation.userId && preparation.userId._id === currentUser._id) || 
      currentUser.role === 'admin'
    );
  };

  // Obtenir l'URL d'une photo à partir de son type
  const getPhotoUrlByType = (taskType, photoType) => {
    if (!preparation || !preparation.tasks[taskType] || !preparation.tasks[taskType].photos) return '';
    
    const photos = preparation.tasks[taskType].photos;
    return photos[photoType]?.url || '';
  };

  // Vérifier si au moins une tâche est complétée
  const hasCompletedTasks = () => {
    if (!preparation) return false;
    
    return Object.values(preparation.tasks).some(task => task.status === 'completed');
  };

  // Naviguer vers la liste des préparations
  const navigateBack = () => {
    navigate('/preparations');
  };

  if (loading && !preparation) {
    return (
      <div>
        <Navigation />
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error && !preparation) {
    return (
      <div>
        <Navigation />
        <div className="preparation-detail-container">
          <AlertMessage type="error" message={error} />
          <div className="back-button-container">
            <button 
              onClick={navigateBack}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!preparation) {
    return (
      <div>
        <Navigation />
        <div className="preparation-detail-container">
          <AlertMessage type="error" message="Préparation non trouvée" />
          <div className="back-button-container">
            <button 
              onClick={navigateBack}
              className="btn btn-primary"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Liste des types de tâches
  const taskTypes = ['exteriorWashing', 'interiorCleaning', 'refueling', 'parking'];

  return (
    <div>
      <Navigation />
      
      <div className="preparation-detail-container">
        <div className="detail-header">
          <h1 className="detail-title">Détails de la préparation</h1>
          <Link to="/preparations" className="back-link">
            <i className="fas fa-arrow-left"></i> Retour à la liste
          </Link>
        </div>
        
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}
        
        <div className="detail-card">
          {/* Section d'informations du véhicule */}
          <PreparationInfoSection preparation={preparation} />
          
          {/* Section des tâches de préparation */}
          <div className="detail-section tasks-section">
            <h2 className="section-title">
              <i className="fas fa-tasks"></i> Tâches de préparation
            </h2>
            
            <div className="task-grid">
              {taskTypes.map(taskType => (
                <PreparationTaskSection
                  key={taskType}
                  preparation={preparation}
                  taskType={taskType}
                  expandedTask={expandedTask}
                  onToggleTask={toggleTaskExpansion}
                  canEdit={canEdit()}
                  onStartTask={handleStartTask}
                  onCompleteTask={handleCompleteTask}
                  onAddTaskPhoto={handleAddTaskPhoto}
                  onParkingTask={handleParkingTask}
                  uploadingPhoto={taskLoading}
                  getPhotoUrlByType={getPhotoUrlByType}
                />
              ))}
            </div>
          </div>
          
          {/* Section des notes */}
          <NotesSection
            notes={notes}
            onChange={setNotes}
            readOnly={preparation.status === 'completed' || !canEdit()}
          />
          
          {/* Section des dates */}
          <PreparationDatesSection preparation={preparation} />
          
          {/* Actions selon le statut et le rôle */}
          <PreparationActions
            preparation={preparation}
            canEdit={canEdit()}
            loading={loading}
            hasCompletedTasks={hasCompletedTasks()}
            onCompletePreparation={handleCompletePreparation}
            navigateBack={navigateBack}
          />
        </div>
      </div>
    </div>
  );
};

export default PreparationDetail;