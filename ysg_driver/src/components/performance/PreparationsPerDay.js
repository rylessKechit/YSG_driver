// src/components/performance/PreparationsPerDay.js
import React, { useState, useEffect } from 'react';

const PreparationsPerDay = ({ performanceData }) => {
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'all'
  const [chartData, setChartData] = useState([]);
  const { preparatorsData, period } = performanceData;
  
  // Combiner et organiser les données des préparations par jour
  useEffect(() => {
    const prepareDailyData = () => {
      // Créer un objet pour stocker les données agrégées par date
      const aggregatedData = {};
      
      // Parcourir tous les préparateurs
      preparatorsData.forEach(preparator => {
        const daily = preparator.metrics.dailyPreparations;
        
        // Ajouter chaque entrée quotidienne à l'agrégation
        daily.forEach(day => {
          if (!aggregatedData[day.date]) {
            aggregatedData[day.date] = {
              date: day.date,
              counts: {},
              total: 0
            };
          }
          
          // Ajouter le compte pour ce préparateur
          aggregatedData[day.date].counts[preparator.preparatorId] = day.count;
          aggregatedData[day.date].total += day.count;
        });
      });
      
      // Convertir l'objet en tableau et trier par date
      let result = Object.values(aggregatedData).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      // Filtrer en fonction du mode de visualisation
      if (viewMode === 'week') {
        // Garder seulement les 7 derniers jours
        result = result.slice(-7);
      } else if (viewMode === 'month') {
        // Garder seulement les 30 derniers jours
        result = result.slice(-30);
      }
      
      setChartData(result);
    };
    
    prepareDailyData();
  }, [preparatorsData, viewMode]);

  // Obtenir le nom du préparateur à partir de son ID (version abrégée)
  const getPreparatorShortName = (id) => {
    return `P${id.slice(0, 3)}`;
  };

  // Formater une date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Obtenir la couleur pour un préparateur spécifique
  const getPreparatorColor = (index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];
    return colors[index % colors.length];
  };

  return (
    <div className="chart-card preparations-per-day">
      <div className="chart-header">
        <h2 className="chart-title">
          <i className="fas fa-calendar-day"></i> Préparations par jour
        </h2>
        
        <div className="chart-controls">
          <button 
            className={`chart-control-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semaine
          </button>
          <button 
            className={`chart-control-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mois
          </button>
          <button 
            className={`chart-control-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            Tout
          </button>
        </div>
      </div>
      
      <div className="chart-content">
        {chartData.length === 0 ? (
          <div className="no-data-message">Aucune donnée disponible pour cette période</div>
        ) : (
          <>
            <div className="bar-chart">
              {chartData.map((day, index) => (
                <div key={day.date} className="chart-column">
                  <div className="day-bars">
                    {preparatorsData.map((preparator, pIndex) => {
                      const count = day.counts[preparator.preparatorId] || 0;
                      if (count === 0) return null;
                      
                      return (
                        <div 
                          key={preparator.preparatorId}
                          className="day-bar"
                          style={{
                            height: `${count * 20}px`,
                            backgroundColor: getPreparatorColor(pIndex)
                          }}
                          title={`${getPreparatorShortName(preparator.preparatorId)}: ${count} préparations`}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="day-label">{formatDate(day.date)}</div>
                  <div className="day-total">{day.total}</div>
                </div>
              ))}
            </div>
            
            <div className="chart-legend">
              {preparatorsData.map((preparator, index) => (
                <div key={preparator.preparatorId} className="legend-item">
                  <span 
                    className="legend-color" 
                    style={{ backgroundColor: getPreparatorColor(index) }}
                  ></span>
                  <span className="legend-label">{getPreparatorShortName(preparator.preparatorId)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreparationsPerDay;