// src/components/performance/TaskCompletionChart.js
import React, { useState } from 'react';

const TaskCompletionChart = ({ performanceData }) => {
  const [chartType, setChartType] = useState('average'); // 'average' ou 'count'
  const { preparatorsData } = performanceData;
  
  // Définition des tâches avec leur noms et couleurs
  const taskTypes = [
    { key: 'exteriorWashing', label: 'Lavage extérieur', color: '#3b82f6' },
    { key: 'interiorCleaning', label: 'Nettoyage intérieur', color: '#10b981' },
    { key: 'refueling', label: 'Mise de carburant', color: '#f59e0b' },
    { key: 'parking', label: 'Stationnement', color: '#6366f1' }
  ];

  // Formatage du temps en minutes en format lisible
  const formatTime = (minutes) => {
    return `${minutes} min`;
  };

  // Obtenir le nom du préparateur à partir de son ID
  const getPreparatorName = (id) => {
    const preparator = preparatorsData.find(p => p.preparatorId === id);
    return preparator ? `Préparateur ${preparator.preparatorId.slice(0, 5)}...` : 'Inconnu';
  };

  // Calculer la largeur maximale pour les barres
  const getMaxValue = () => {
    if (chartType === 'average') {
      return Math.max(...preparatorsData.flatMap(p => 
        Object.values(p.metrics.taskMetrics).map(task => task.avgTime)
      )) * 1.2; // Ajouter 20% de marge
    } else {
      return Math.max(...preparatorsData.flatMap(p => 
        Object.values(p.metrics.taskMetrics).map(task => task.count)
      )) * 1.2; // Ajouter 20% de marge
    }
  };

  // Calculer la largeur relative de la barre
  const getBarWidth = (value) => {
    const maxVal = getMaxValue();
    return maxVal > 0 ? (value / maxVal) * 100 : 0;
  };

  return (
    <div className="chart-card task-completion-chart">
      <div className="chart-header">
        <h2 className="chart-title">
          <i className="fas fa-tasks"></i> Performance par type de tâche
        </h2>

        <div className="chart-controls">
          <button
            className={`chart-control-btn ${chartType === 'average' ? 'active' : ''}`}
            onClick={() => setChartType('average')}
          >
            Temps moyen
          </button>
          <button
            className={`chart-control-btn ${chartType === 'count' ? 'active' : ''}`}
            onClick={() => setChartType('count')}
          >
            Nombre de tâches
          </button>
        </div>
      </div>

      <div className="chart-content">
        {preparatorsData.map((preparator, pIndex) => (
          <div key={preparator.preparatorId} className="chart-group">
            <div className="group-header">
              <div className="preparator-name">{getPreparatorName(preparator.preparatorId)}</div>
              <div className="total-metric">
                {chartType === 'average' 
                  ? `Moyenne globale: ${formatTime(preparator.metrics.avgCompletionTime)}`
                  : `Total: ${preparator.metrics.totalPreparations} préparations`
                }
              </div>
            </div>

            <div className="task-bars">
              {taskTypes.map((task) => {
                const taskData = preparator.metrics.taskMetrics[task.key];
                const value = chartType === 'average' ? taskData.avgTime : taskData.count;
                const barWidth = getBarWidth(value);
                
                return (
                  <div key={task.key} className="task-bar-container">
                    <div className="task-label">
                      <span className="color-dot" style={{ backgroundColor: task.color }}></span>
                      <span>{task.label}</span>
                    </div>
                    <div className="bar-wrapper">
                      <div 
                        className="task-bar" 
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: task.color
                        }}
                      ></div>
                      <span className="bar-value">
                        {chartType === 'average' ? formatTime(value) : `${value} tâches`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskCompletionChart;