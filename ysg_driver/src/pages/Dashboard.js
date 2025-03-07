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

const Dashboard = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [assignedMovements, setAssignedMovements] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [preparations, setPreparations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Chargement des préparations
  const loadPreparations = async () => {
    try {
      if (currentUser?.role === 'preparator') {
        const response = await preparationService.getPreparations(null, 5, 'completed' || null);
        setPreparations(response.preparations);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des préparations:', err);
      setError('Erreur lors du chargement des données');
    }
  };

  // Chargement des données du tableau de bord
  useEffect(() => {
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
        
        // Si c'est un chauffeur, obtenir ses mouvements assignés
        if (currentUser?.role === 'driver') {
          const assignedData = await movementService.getMovements(1, 5, 'assigned');
          setAssignedMovements(assignedData.movements);
        }
        
        // Récupérer les mouvements récents (terminés pour les chauffeurs, tous pour les admins)
        if (['driver', 'admin', 'team-leader'].includes(currentUser?.role)) {
          const movementsData = await movementService.getMovements(
            1, 
            5, 
            currentUser?.role === 'driver' ? 'completed' : null
          );
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
        
        {/* Mouvements assignés (chauffeurs seulement) */}
        {currentUser.role === 'driver' && assignedMovements.length > 0 && (
          <AssignedMovements movements={assignedMovements} />
        )}
        
        {/* Actions rapides */}
        <QuickActions currentUser={currentUser} />
        
        {/* Préparations récentes (préparateurs) */}
        {currentUser.role === 'preparator' && (
          <RecentPreparations preparations={preparations} />
        )}
        
        {/* Mouvements récents (chauffeurs ou chefs d'équipe) */}
        {(currentUser.role === 'driver' || currentUser.role === 'team-leader') && (
          <RecentMovements movements={recentMovements} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;