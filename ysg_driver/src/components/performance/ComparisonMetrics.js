// src/components/performance/ComparisonMetrics.js
import React, { useState, useMemo } from 'react';

const ComparisonMetrics = ({ 
  performanceData, 
  allUsers, 
  selectedUsers,
  isDriverView = false,
  isPreparatorView = false
}) => {
  const [selectedMetric, setSelectedMetric] = useState(isDriverView ? 'avgCompletionTime' : 'avgCompletionTime');
  
  // Déterminer la source de données en fonction du type de vue et s'assurer qu'elle existe
  const dataSource = isDriverView 
    ? (performanceData?.comparativeData || [])
    : (performanceData?.preparatorsData || []);
  
  // ID des utilisateurs dans les données
  const userIdField = isDriverView ? 'driverId' : 'preparatorId';
  
  // Liste des métriques disponibles pour la comparaison
  const metrics = useMemo(() => {
    // Métriques communes
    const commonMetrics = [
      { 
        id: 'avgCompletionTime', 
        label: 'Temps moyen de complétion', 
        unit: 'min',
        inverse: true // Plus faible est meilleur
      },
      { 
        id: 'totalItems', 
        label: `Nombre total de ${isDriverView ? 'mouvements' : 'préparations'}`, 
        unit: '',
        inverse: false // Plus élevé est meilleur
      },
      { 
        id: 'itemsPerDay', 
        label: `${isDriverView ? 'Mouvements' : 'Préparations'} par jour`, 
        unit: '',
        inverse: false
      }
    ];
    
    // Métriques spécifiques aux préparateurs
    const preparatorMetrics = [
      { 
        id: 'exteriorWashingTime', 
        label: 'Temps moyen - Lavage extérieur', 
        unit: 'min',
        inverse: true
      },
      { 
        id: 'interiorCleaningTime', 
        label: 'Temps moyen - Nettoyage intérieur', 
        unit: 'min',
        inverse: true
      },
      { 
        id: 'refuelingTime', 
        label: 'Temps moyen - Mise de carburant', 
        unit: 'min',
        inverse: true
      },
      { 
        id: 'parkingTime', 
        label: 'Temps moyen - Stationnement', 
        unit: 'min',
        inverse: true
      },
      {
        id: 'completionRate',
        label: 'Taux de complétion',
        unit: '%',
        inverse: false
      }
    ];
    
    // Métriques spécifiques aux chauffeurs
    const driverMetrics = [
      { 
        id: 'averagePreparationTime', 
        label: 'Temps moyen de préparation', 
        unit: 'min',
        inverse: true
      },
      { 
        id: 'averageMovementTime', 
        label: 'Temps moyen de trajet', 
        unit: 'min',
        inverse: true
      }
    ];
    
    // Retourner les métriques selon le type de vue
    if (isDriverView) {
      return [...commonMetrics, ...driverMetrics];
    } else if (isPreparatorView) {
      return [...commonMetrics, ...preparatorMetrics];
    } else {
      return commonMetrics;
    }
  }, [isDriverView, isPreparatorView]);

  // Obtenir la valeur d'une métrique pour un utilisateur spécifique
  const getMetricValue = (user, metricId) => {
    // Vérifier d'abord si l'utilisateur existe
    if (!user || !user._id) return 0;
    
    const userData = dataSource.find(d => d[userIdField] === user._id);
    if (!userData || !userData.metrics) return 0;
    
    const metrics = userData.metrics;
    
    if (isDriverView) {
      // Métriques pour les chauffeurs
      switch (metricId) {
        case 'avgCompletionTime':
          return metrics.averageCompletionTime || 0;
        case 'totalItems':
          return metrics.totalMovements || 0;
        case 'itemsPerDay':
          return metrics.movementsPerDay || 0;
        case 'averagePreparationTime':
          return metrics.averagePreparationTime || 0;
        case 'averageMovementTime':
          return metrics.averageMovementTime || 0;
        default:
          return 0;
      }
    } else {
      // Métriques pour les préparateurs
      switch (metricId) {
        case 'avgCompletionTime':
          return metrics.avgCompletionTime || 0;
        case 'totalItems':
          return metrics.totalPreparations || 0;
        case 'itemsPerDay':
          return parseFloat(((metrics.totalPreparations || 0) / (performanceData?.period?.days || 1)).toFixed(1));
        case 'exteriorWashingTime':
          return metrics.taskMetrics?.exteriorWashing?.avgTime || 0;
        case 'interiorCleaningTime':
          return metrics.taskMetrics?.interiorCleaning?.avgTime || 0;
        case 'refuelingTime':
          return metrics.taskMetrics?.refueling?.avgTime || 0;
        case 'parkingTime':
          return metrics.taskMetrics?.parking?.avgTime || 0;
        case 'completionRate':
          return metrics.completedPreparations > 0 && metrics.totalPreparations > 0 
            ? parseFloat(((metrics.completedPreparations / metrics.totalPreparations) * 100).toFixed(1)) 
            : 0;
        default:
          return 0;
      }
    }
  };

  // Formater la valeur d'une métrique selon son type
  const formatMetricValue = (value, metricId) => {
    const metric = metrics.find(m => m.id === metricId);
    if (!metric) return value;
    
    if (metricId === 'itemsPerDay' || metricId === 'completionRate') {
      return value.toFixed(1) + (metric.unit ? ` ${metric.unit}` : '');
    }
    
    return metric.unit ? `${value} ${metric.unit}` : value;
  };

  // Filtrer les utilisateurs à comparer
  const usersToCompare = allUsers.filter(u => 
    selectedUsers.includes(u._id)
  );

  // Trier les utilisateurs selon la métrique sélectionnée
  const sortedUsers = [...usersToCompare].sort((a, b) => {
    const valueA = getMetricValue(a, selectedMetric);
    const valueB = getMetricValue(b, selectedMetric);
    const metric = metrics.find(m => m.id === selectedMetric);
    
    if (!metric) return 0;
    
    return metric.inverse 
      ? valueA - valueB  // Si inverse, le plus petit est meilleur
      : valueB - valueA; // Sinon, le plus grand est meilleur
  });

  // Obtenir le meilleur utilisateur pour la métrique sélectionnée
  const getBestUser = () => {
    if (sortedUsers.length === 0) return null;
    return sortedUsers[0];
  };

  // Calculer le pourcentage relatif pour la barre de progression
  const calculatePercentage = (user) => {
    const bestUser = getBestUser();
    if (!bestUser) return 0;
    
    const bestUserValue = getMetricValue(bestUser, selectedMetric);
    const currentValue = getMetricValue(user, selectedMetric);
    const metric = metrics.find(m => m.id === selectedMetric);
    
    if (!metric) return 0;
    
    if (bestUserValue === 0) return 0;
    
    if (metric.inverse) {
      // Pour les métriques inverses (temps), plus faible est meilleur
      return (bestUserValue / (currentValue || 1)) * 100;
    } else {
      // Pour les métriques régulières, plus élevé est meilleur
      return ((currentValue || 0) / (bestUserValue || 1)) * 100;
    }
  };

  // Texte du titre en fonction du type de vue
  const titleText = isDriverView ? "Comparaison des chauffeurs" : "Comparaison des préparateurs";

  return (
    <div className="comparison-metrics-section">
      <h2 className="section-title">
        <i className="fas fa-chart-bar"></i> {titleText}
      </h2>
      
      <div className="metric-selector">
        <label htmlFor="metric-select">Métrique:</label>
        <div className="select-wrapper">
          <select 
            id="metric-select" 
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            {metrics.map(metric => (
              <option key={metric.id} value={metric.id}>
                {metric.label}
              </option>
            ))}
          </select>
          <i className="fas fa-chevron-down"></i>
        </div>
      </div>
      
      <div className="comparison-table">
        <div className="comparison-header">
          <div className="comparison-col user-col">{isDriverView ? "Chauffeur" : "Préparateur"}</div>
          <div className="comparison-col value-col">Valeur</div>
          <div className="comparison-col progress-col">Performance relative</div>
        </div>
        
        <div className="comparison-body">
          {sortedUsers.map((user, index) => {
            const value = getMetricValue(user, selectedMetric);
            const percentage = calculatePercentage(user);
            const isFirst = index === 0;
            
            return (
              <div 
                key={user._id} 
                className={`comparison-row ${isFirst ? 'best-performer' : ''}`}
              >
                <div className="comparison-col user-col">
                  {isFirst && <i className="fas fa-trophy trophy-icon"></i>}
                  <span className="user-name">{user.fullName}</span>
                </div>
                <div className="comparison-col value-col">
                  {formatMetricValue(value, selectedMetric)}
                </div>
                <div className="comparison-col progress-col">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: isFirst ? '#10b981' : '#3b82f6'
                      }}
                    ></div>
                  </div>
                  <span className="progress-value">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComparisonMetrics;