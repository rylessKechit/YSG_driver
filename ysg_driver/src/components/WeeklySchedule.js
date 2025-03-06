// src/components/WeeklySchedule.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import scheduleService from '../services/scheduleService';
import '../styles/WeeklySchedule.css';

const WeeklySchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser } = useAuth();
  
  const days = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' }
  ];
  
  // Déterminer la date du jour actuel et de la semaine
  const today = new Date();
  const currentDay = days[today.getDay() === 0 ? 6 : today.getDay() - 1].value;
  
  // Au chargement, définir le jour actuel comme jour étendu par défaut
  useEffect(() => {
    setExpandedDay(currentDay);
  }, [currentDay]);
  
  // Calculer les dates de la semaine
  const getWeekDates = () => {
    const dates = {};
    const weekStart = new Date(today);
    // Reculer jusqu'au lundi
    weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    
    days.forEach((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      dates[day.value] = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    });
    
    return dates;
  };
  
  const weekDates = getWeekDates();

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const data = await scheduleService.getUserSchedule(currentUser._id);
        setSchedule(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement du planning:', err);
        setError('Impossible de charger votre planning');
        setLoading(false);
      }
    };
    
    fetchSchedule();
  }, [currentUser]);

  // Vérifier si c'est un préparateur
  if (currentUser?.role !== 'preparator') {
    return null;
  }

  // Obtenir l'entrée de planning pour un jour spécifique
  const getEntryForDay = (day) => {
    return schedule.find(entry => entry.day === day);
  };
  
  // Gérer le clic sur un jour pour l'étendre/réduire
  const toggleDayExpansion = (day) => {
    if (expandedDay === day) {
      setExpandedDay(null);
    } else {
      setExpandedDay(day);
    }
  };

  // Obtenir l'entrée de planning pour le jour actuel
  const currentDayEntry = getEntryForDay(currentDay);

  return (
    <div className="weekly-schedule-container">
      <div className="schedule-header">
        <h2 className="schedule-title">
          <i className="fas fa-calendar-alt"></i> Mon planning
        </h2>
        <button 
          className="toggle-schedule-btn" 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Réduire le planning" : "Afficher le planning complet"}
        >
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </button>
      </div>
      
      {error ? (
        <div className="schedule-error">{error}</div>
      ) : loading ? (
        <div className="schedule-loading">
          <div className="small-spinner"></div>
          <span>Chargement du planning...</span>
        </div>
      ) : schedule.length === 0 ? (
        <div className="no-schedule">
          <p>Aucun planning défini pour cette semaine.</p>
        </div>
      ) : !isExpanded ? (
        // Mode compact - affiche uniquement le jour actuel
        <div className="compact-view">
          <div className={`today-card ${currentDayEntry ? (currentDayEntry.entryType === 'rest' ? 'rest-day' : 'work-day') : 'no-schedule'}`}>
            <div className="today-header">
              <div className="today-date">
                <span className="day-name">{days.find(d => d.value === currentDay)?.label}</span>
                <span className="date">{weekDates[currentDay]}</span>
              </div>
              <div className="today-badge">Aujourd'hui</div>
            </div>
            
            {currentDayEntry ? (
              <div className="today-content">
                {currentDayEntry.entryType === 'rest' ? (
                  <div className="rest-day-info">
                    <i className="fas fa-bed"></i>
                    <span>Jour de repos</span>
                  </div>
                ) : (
                  <>
                    <div className="today-schedule">
                      <i className="fas fa-clock"></i>
                      <span>{currentDayEntry.startTime} - {currentDayEntry.endTime}</span>
                    </div>
                    {currentDayEntry.location && (
                      <div className="today-location">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{currentDayEntry.location}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="no-schedule-info">
                <i className="fas fa-calendar-times"></i>
                <span>Aucun horaire prévu</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Mode étendu - affiche la vue semaine complète
        <div className="mobile-week-view">
          {days.map(day => {
            const entry = getEntryForDay(day.value);
            const isToday = day.value === currentDay;
            const isExpanded = expandedDay === day.value;
            const isRestDay = entry && entry.entryType === 'rest';
            
            return (
              <div 
                key={day.value} 
                className={`mobile-day-card ${isToday ? 'today' : ''} ${entry ? 'has-schedule' : 'no-schedule'} ${isRestDay ? 'rest-day' : ''}`}
              >
                <div 
                  className={`mobile-day-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleDayExpansion(day.value)}
                >
                  <div className="mobile-day-name">
                    {day.label} <span className="mobile-day-date">{weekDates[day.value]}</span>
                    {isToday && <span className="today-badge">Aujourd'hui</span>}
                  </div>
                  <div className="mobile-day-summary">
                    {entry ? (
                      isRestDay ? (
                        <span className="rest-day-badge">
                          <i className="fas fa-bed"></i> Repos
                        </span>
                      ) : (
                        <span className="work-day-badge">
                          <i className="fas fa-briefcase"></i> {entry.startTime}-{entry.endTime}
                        </span>
                      )
                    ) : (
                      <span className="no-schedule-badge">Non planifié</span>
                    )}
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                  </div>
                </div>
                
                {isExpanded && entry && (
                  <div className="mobile-day-details">
                    {isRestDay ? (
                      <div className="rest-day-info">
                        <i className="fas fa-bed"></i>
                        <div className="rest-day-label">Jour de repos</div>
                      </div>
                    ) : (
                      <>
                        <div className="detail-item">
                          <div className="detail-label">
                            <i className="fas fa-clock"></i> Horaires:
                          </div>
                          <div className="detail-value">{entry.startTime} - {entry.endTime}</div>
                        </div>
                        
                        {entry.location && (
                          <div className="detail-item">
                            <div className="detail-label">
                              <i className="fas fa-map-marker-alt"></i> Lieu:
                            </div>
                            <div className="detail-value">{entry.location}</div>
                          </div>
                        )}
                        
                        {entry.tasks && (
                          <div className="detail-item tasks-detail">
                            <div className="detail-label">
                              <i className="fas fa-tasks"></i> Tâches:
                            </div>
                            <div className="detail-value">{entry.tasks}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {isExpanded && !entry && (
                  <div className="mobile-day-details empty">
                    <p>Pas d'horaire défini pour ce jour</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;