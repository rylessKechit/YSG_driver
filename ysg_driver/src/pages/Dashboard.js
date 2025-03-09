// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import timelogService from '../services/timelogService';
import movementService from '../services/movementService';
import preparationService from '../services/preparationService';
import Navigation from '../components/Navigation';
import WeeklySchedule from '../components/WeeklySchedule';
import GreetingSection from '../components/dashboard/GreetingSection';
import StatusCard from '../components/dashboard/StatusCard';
import AssignedMovements from '../components/dashboard/AssignedMovements';
import QuickActions from '../components/dashboard/QuickActions';
import RecentMovements from '../components/dashboard/RecentMovements';
import RecentPreparations from '../components/dashboard/RecentPreparations';
import '../styles/Dashboard.css';
import InProgressMovement from '../components/dashboard/InProgressMovement';
import InProgressPreparations from '../components/dashboard/InProgressPreparations';

const Dashboard = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [assignedMovements, setAssignedMovements] = useState([]);
  const [inProgressMovements, setInProgressMovements] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [inProgressPreparations, setInProgressPreparations] = useState([]);
  const [recentPreparations, setRecentPreparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Chargement des préparations
  // Dans la fonction loadPreparations du Dashboard.js
  const loadPreparations = async () => {
    try {
      if (currentUser?.role === 'preparator' || currentUser?.role === 'driver' || currentUser?.role === 'team-leader') {
        // Une seule requête pour toutes les préparations de l'utilisateur
        // Augmenter la limite pour obtenir suffisamment de données
        const allPreparations = await preparationService.getPreparations(
          null, 
          50,  // Augmentation de la limite pour avoir assez de données
          null, // Pas de filtre de statut
          currentUser._id
        );
        
        // Filtrer côté client
        const completed = allPreparations.preparations.filter(p => p.status === 'completed');
        const inProgress = allPreparations.preparations.filter(p => p.status === 'in-progress');
        
        setRecentPreparations(completed.slice(0, 5));
        setInProgressPreparations(inProgress.slice(0, 5));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des préparations:', err);
      setError('Erreur lors du chargement des données');
    }
  };

  // Chargement des données du tableau de bord
  useEffect(() => {
    // Dans useEffect de Dashboard.js
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Récupérer le pointage actif
        const timeLog = await timelogService.getActiveTimeLog()
          .catch(err => {
            if (err.response && err.response.status === 404) {
              return null; // Pas de pointage actif
            }
            throw err;
          });
        
        setActiveTimeLog(timeLog);
        
        // Si c'est un chauffeur, obtenir TOUS ses mouvements en une seule requête
        if (currentUser?.role === 'driver') {
          // On demande plus de mouvements (par ex. 30) pour avoir assez de données
          // pour toutes les sections, sans pagination
          const movementsData = await movementService.getMovements(1, 30, null);
          const allMovements = movementsData.movements;
          
          // Filtrer les données côté client
          const assigned = allMovements.filter(m => m.status === 'assigned');
          const inProgress = allMovements.filter(m => m.status === 'in-progress');
          const completed = allMovements.filter(m => m.status === 'completed');
          
          setAssignedMovements(assigned);
          setInProgressMovements(inProgress);
          // Prendre uniquement les 5 premiers mouvements complétés pour l'historique
          setRecentMovements(completed.slice(0, 5));
        } else if (['admin', 'team-leader'].includes(currentUser?.role)) {
          // Pour les admin et team-leaders, garder la requête unique
          const movementsData = await movementService.getMovements(1, 5, null);
          setRecentMovements(movementsData.movements);
        }
        
        // Charger les préparations si nécessaire
        await loadPreparations();
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Chargement du tableau de bord...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="dashboard-container">
        {/* Section de salutation */}
        <GreetingSection currentUser={currentUser} />

        {/* Planning hebdomadaire pour les préparateurs */}
        {currentUser.role === 'preparator' && <WeeklySchedule />}
        
        {/* Affichage des erreurs */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}
        
        {/* Statut de service */}
        {(currentUser.role === 'driver' || currentUser.role === 'preparator' || currentUser.role === 'team-leader') && (
          <StatusCard activeTimeLog={activeTimeLog} />
        )}

        {/* Mouvement in progress (chauffeurs seulement) */}
        {((currentUser.role === 'driver' | currentUser.role === 'team-leader') && inProgressMovements.length > 0 ) && (
          <InProgressMovement movements={inProgressMovements} />
        )}
        
        {/* Mouvements assignés (chauffeurs seulement) */}
        {currentUser.role === 'driver' && assignedMovements.length > 0 && (
          <AssignedMovements movements={assignedMovements} />
        )}
        
        {/* Actions rapides */}
        <QuickActions currentUser={currentUser} />

        {/* Préparations en cours */}
        {(currentUser.role === 'preparator' || currentUser.role === 'driver' || currentUser.role === 'team-leader') && 
          inProgressPreparations.length > 0 && (
          <InProgressPreparations preparations={inProgressPreparations} />
        )}
        
        {/* Préparations récentes */}
        {(currentUser.role === 'preparator' || currentUser.role === 'driver' || currentUser.role === 'team-leader') && 
          recentPreparations.length > 0 && (
          <RecentPreparations preparations={recentPreparations} />
        )}
        
        {/* Mouvements récents (chauffeurs ou chefs d'équipe) */}
        {((currentUser.role === 'driver' || currentUser.role === 'team-leader' || currentUser.role === 'preparator') && recentMovements.length > 0) && (
          <RecentMovements movements={recentMovements} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;