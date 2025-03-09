// src/pages/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import timelogService from '../services/timelogService';
import movementService from '../services/movementService';
import preparationService from '../services/preparationService';
import Navigation from '../components/Navigation';
import WeeklySchedule from '../components/WeeklySchedule';
import GreetingSection from '../components/dashboard/GreetingSection';
import StatusCard from '../components/dashboard/StatusCard';
import QuickActions from '../components/dashboard/QuickActions';
import '../styles/Dashboard.css';

// Importations dynamiques des composants selon le rôle
const AssignedMovements = React.lazy(() => import('../components/dashboard/AssignedMovements'));
const InProgressMovement = React.lazy(() => import('../components/dashboard/InProgressMovement'));
const InProgressPreparations = React.lazy(() => import('../components/dashboard/InProgressPreparations'));
const RecentMovements = React.lazy(() => import('../components/dashboard/RecentMovements'));
const RecentPreparations = React.lazy(() => import('../components/dashboard/RecentPreparations'));

const Dashboard = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [movementsData, setMovementsData] = useState({
    assigned: [],
    inProgress: [],
    recent: []
  });
  const [preparationsData, setPreparationsData] = useState({
    inProgress: [],
    recent: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Fonction pour charger les données
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Récupérer le pointage actif
        const timeLog = await timelogService.getActiveTimeLog()
          .catch(err => {
            if (err.response?.status === 404) return null;
            throw err;
          });
        
        setActiveTimeLog(timeLog);
        
        // 2. Charger les mouvements selon le rôle
        if (['driver', 'team-leader', 'admin'].includes(currentUser?.role)) {
          const movementsResponse = await movementService.getMovements(1, 30);
          const allMovements = movementsResponse.movements || [];
          
          // Filtrer par statut
          setMovementsData({
            assigned: allMovements.filter(m => m.status === 'assigned'),
            inProgress: allMovements.filter(m => m.status === 'in-progress'),
            recent: allMovements.filter(m => m.status === 'completed').slice(0, 5)
          });
        }
        
        // 3. Charger les préparations si nécessaire
        if (['preparator', 'driver', 'team-leader', 'admin'].includes(currentUser?.role)) {
          const preparationsResponse = await preparationService.getPreparations(1, 50);
          const allPreparations = preparationsResponse.preparations || [];
          
          setPreparationsData({
            inProgress: allPreparations.filter(p => p.status === 'in-progress').slice(0, 5),
            recent: allPreparations.filter(p => p.status === 'completed').slice(0, 5)
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  // Déterminer quels composants afficher selon le rôle
  const componentsByRole = useMemo(() => {
    if (!currentUser) return [];
    
    const roleComponents = [];
    
    // Tous les rôles ont GreetingSection et QuickActions
    roleComponents.push({ component: 'greeting', label: 'Greeting' });
    
    // WeeklySchedule uniquement pour les préparateurs
    if (currentUser.role === 'preparator') {
      roleComponents.push({ component: 'weeklySchedule', label: 'Planning' });
    }
    
    // StatusCard pour chauffeurs, préparateurs et chefs d'équipe
    if (['driver', 'preparator', 'team-leader'].includes(currentUser.role)) {
      roleComponents.push({ component: 'statusCard', label: 'StatusCard' });
    }
    
    // Mouvements en cours pour chauffeurs et chefs d'équipe
    if (['driver', 'team-leader'].includes(currentUser.role) && 
        movementsData.inProgress.length > 0) {
      roleComponents.push({ component: 'inProgressMovement', label: 'InProgressMovement' });
    }
    
    // Mouvements assignés pour chauffeurs
    if (currentUser.role === 'driver' && movementsData.assigned.length > 0) {
      roleComponents.push({ component: 'assignedMovements', label: 'AssignedMovements' });
    }
    
    // QuickActions pour tous
    roleComponents.push({ component: 'quickActions', label: 'QuickActions' });
    
    // Préparations en cours pour préparateurs, chauffeurs et chefs d'équipe
    if (['preparator', 'driver', 'team-leader'].includes(currentUser.role) && 
        preparationsData.inProgress.length > 0) {
      roleComponents.push({ component: 'inProgressPreparations', label: 'InProgressPreparations' });
    }
    
    // Préparations récentes pour préparateurs, chauffeurs et chefs d'équipe
    if (['preparator', 'driver', 'team-leader'].includes(currentUser.role) && 
        preparationsData.recent.length > 0) {
      roleComponents.push({ component: 'recentPreparations', label: 'RecentPreparations' });
    }
    
    // Mouvements récents pour chauffeurs, chefs d'équipe et admin
    if (['driver', 'team-leader', 'admin'].includes(currentUser.role) && 
        movementsData.recent.length > 0) {
      roleComponents.push({ component: 'recentMovements', label: 'RecentMovements' });
    }
    
    return roleComponents;
  }, [currentUser, movementsData, preparationsData]);

  // Rendu du composant selon le type
  const renderComponent = (componentType) => {
    switch(componentType) {
      case 'greeting':
        return <GreetingSection currentUser={currentUser} />;
      case 'weeklySchedule':
        return <WeeklySchedule />;
      case 'statusCard':
        return <StatusCard activeTimeLog={activeTimeLog} />;
      case 'quickActions':
        return <QuickActions currentUser={currentUser} />;
      case 'inProgressMovement':
        return <InProgressMovement movements={movementsData.inProgress} />;
      case 'assignedMovements':
        return <AssignedMovements movements={movementsData.assigned} />;
      case 'inProgressPreparations':
        return <InProgressPreparations preparations={preparationsData.inProgress} />;
      case 'recentPreparations':
        return <RecentPreparations preparations={preparationsData.recent} />;
      case 'recentMovements':
        return <RecentMovements movements={movementsData.recent} />;
      default:
        return null;
    }
  };

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
        {/* Affichage des erreurs */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}
        
        {/* Afficher les composants selon le rôle */}
        {componentsByRole.map((item, index) => (
          <React.Fragment key={index}>
            {renderComponent(item.component)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;