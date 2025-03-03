// src/components/WeeklySchedule.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import scheduleService from '../services/scheduleService';
import '../styles/WeeklySchedule.css';

const WeeklySchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  return (
    <div className="weekly-schedule-container">
      <h2 className="schedule-title">
        <i className="fas fa-calendar-alt"></i> Mon planning de la semaine
      </h2>
      
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
      ) : (
        <div className="week-view">
            {days.map(day => {
            const entry = getEntryForDay(day.value);
            const isToday = day.value === currentDay;
            const isRestDay = entry && entry.entryType === 'rest';
            
            return (
                <div 
                key={day.value} 
                className={`day-card ${isToday ? 'today' : ''} ${entry ? 'has-schedule' : 'no-schedule'} ${isRestDay ? 'rest-day' : ''}`}
                >
                <div className="day-header">
                    <div className="day-name">{day.label}</div>
                    <div className="day-date">{weekDates[day.value]}</div>
                </div>
                
                {entry ? (
                    <div className="day-content">
                    {isRestDay ? (
                        <div className="rest-day-info">
                        <i className="fas fa-bed"></i>
                        <div className="rest-day-label">Jour de repos</div>
                        </div>
                    ) : (
                        <>
                        <div className="schedule-time">
                            <i className="fas fa-clock"></i> {entry.startTime} - {entry.endTime}
                        </div>
                        
                        {entry.location && (
                            <div className="schedule-location">
                            <i className="fas fa-map-marker-alt"></i> {entry.location}
                            </div>
                        )}
                        
                        {entry.tasks && (
                            <div className="schedule-tasks">
                            <div className="tasks-label">Tâches:</div>
                            <div className="tasks-content">{entry.tasks}</div>
                            </div>
                        )}
                        </>
                    )}
                    </div>
                ) : (
                    <div className="day-content empty">
                    <p>Pas d'horaire défini</p>
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