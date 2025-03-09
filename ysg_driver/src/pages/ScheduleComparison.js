// src/pages/ScheduleComparison.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import scheduleService from '../services/scheduleService';
import timelogService from '../services/timelogService';
import userService from '../services/userService';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AlertMessage from '../components/ui/AlertMessage';
import '../styles/ScheduleComparison.css';

const ScheduleComparison = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: getStartOfWeek().toISOString().split('T')[0],
    endDate: getEndOfWeek().toISOString().split('T')[0]
  });
  const [scheduleData, setScheduleData] = useState([]);
  const [timelogData, setTimelogData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Jours de la semaine
  const days = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' }
  ];

  // Vérifier les autorisations
  useEffect(() => {
    if (currentUser && 
        currentUser.role !== 'admin' && 
        currentUser.role !== 'direction') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Fonction pour obtenir le premier jour de la semaine (lundi)
  function getStartOfWeek() {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  // Fonction pour obtenir le dernier jour de la semaine (dimanche)
  function getEndOfWeek() {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? 0 : 7);
    return new Date(date.setDate(diff));
  }

  // Charger la liste des préparateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        console.log('Tentative de chargement des utilisateurs...');
        const allUsers = await userService.getAllUsers();
        console.log('Utilisateurs chargés:', allUsers);
        
        // Filtrer les utilisateurs qui sont des préparateurs
        const preparators = allUsers.filter(user => user.role === 'preparator');
        console.log('Préparateurs filtrés:', preparators);
        
        setUsers(preparators);
        
        if (preparators && preparators.length > 0) {
          setSelectedUser(preparators[0]._id);
          console.log('Premier préparateur sélectionné:', preparators[0]);
        } else {
          console.log('Aucun préparateur trouvé');
          // Si aucun préparateur n'est trouvé, on affiche un message différent 
          // qui indique plus clairement le problème
          setError('Aucun utilisateur avec le rôle "préparateur" n\'a été trouvé. Veuillez en créer un dans l\'administration.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des préparateurs:', err);
        // Message d'erreur plus détaillé pour aider au débogage
        setError(`Erreur lors du chargement des préparateurs: ${err.message || 'Erreur inconnue'}`);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Charger les données de planning et de pointage
  useEffect(() => {
    if (!selectedUser) return;

    const fetchScheduleAndTimelogs = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Chargement des données pour l\'utilisateur:', selectedUser);

        // Charger le planning
        console.log('Tentative de chargement du planning...');
        const schedule = await scheduleService.getUserSchedule(selectedUser);
        console.log('Planning chargé:', schedule);
        setScheduleData(schedule || []); // Assurer que c'est toujours un tableau même si vide

        // Charger les pointages - MODIFICATIONS POUR CORRIGER LE PROBLÈME
        console.log('Tentative de chargement des pointages...');
        const timelogs = await timelogService.getTimeLogs(1, 500); // Augmenter le nombre pour être sûr
        console.log('Pointages bruts chargés:', timelogs);
        
        // Filtrer les pointages pour l'utilisateur sélectionné et dans la plage de dates
        const startDate = new Date(dateRange.startDate);
        startDate.setHours(0, 0, 0, 0);
        const startStr = startDate.toISOString();
        
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        const endStr = endDate.toISOString();
        
        console.log('Filtrage des pointages du', startStr, 'au', endStr, 'pour l\'utilisateur', selectedUser);
        
        // S'assurer que timelogs contient la propriété timeLogs avant de filtrer
        const timeLogsArray = timelogs && timelogs.timeLogs ? timelogs.timeLogs : [];
        console.log('Nombre total de pointages récupérés:', timeLogsArray.length);
        
        // Ajouter des logs détaillés pour chaque pointage
        timeLogsArray.forEach(log => {
          console.log(`Pointage ID:${log._id}, Utilisateur:${log.userId}, Date:${new Date(log.startTime).toLocaleString()}, Status:${log.status}`);
        });
        
        const filteredTimelogs = timeLogsArray.filter(log => {
          const logDate = new Date(log.startTime);
          const isCorrectUser = log.userId === selectedUser;
          const isInDateRange = logDate >= startDate && logDate <= endDate;
          
          console.log(`Log pour ${new Date(log.startTime).toLocaleString()}: bon utilisateur=${isCorrectUser}, dans plage=${isInDateRange}`);
          
          return isCorrectUser && isInDateRange;
        });
        
        console.log('Pointages filtrés après vérification complète:', filteredTimelogs);
        setTimelogData(filteredTimelogs);

        // Créer les données de comparaison
        generateComparisonData(schedule || [], filteredTimelogs);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        // Message d'erreur plus détaillé
        setError(`Erreur lors du chargement des données: ${err.message || 'Erreur inconnue'}`);
        setLoading(false);
      }
    };

    fetchScheduleAndTimelogs();
  }, [selectedUser, dateRange]);

  // Génération des données de comparaison
  const generateComparisonData = (schedule, timelogs) => {
    const weekDates = getWeekDates();
    const comparison = [];

    days.forEach(day => {
      const dayDate = weekDates[day.value];
      const scheduleEntry = schedule.find(entry => entry.day === day.value);
      
      // Trouver les pointages pour ce jour - MODIFICATION ICI POUR CORRIGER LE PROBLÈME
      const dayTimelogs = timelogs.filter(log => {
        // Convertir les deux dates en chaînes de format YYYY-MM-DD pour comparer uniquement les jours
        const logDate = new Date(log.startTime);
        const logDateStr = logDate.toISOString().split('T')[0];
        const dayDateStr = dayDate.toISOString().split('T')[0];
        
        // Log pour débogage
        console.log(`Comparaison: log=${logDateStr}, jour=${dayDateStr}, même jour=${logDateStr === dayDateStr}`);
        
        return logDateStr === dayDateStr;
      });

      console.log(`Pointages pour ${day.label} (${dayDate.toLocaleDateString()}):`, dayTimelogs);

      // Calculer les écarts
      let startDiff = null;
      let endDiff = null;
      let totalWorkedMinutes = 0;

      if (scheduleEntry && scheduleEntry.entryType === 'work' && dayTimelogs.length > 0) {
        // Convertir les heures prévues en minutes depuis minuit
        const [scheduledStartHours, scheduledStartMinutes] = scheduleEntry.startTime.split(':').map(Number);
        const [scheduledEndHours, scheduledEndMinutes] = scheduleEntry.endTime.split(':').map(Number);
        
        const scheduledStartMinutesFromMidnight = scheduledStartHours * 60 + scheduledStartMinutes;
        const scheduledEndMinutesFromMidnight = scheduledEndHours * 60 + scheduledEndMinutes;
        
        // Prendre le premier pointage comme heure d'arrivée
        const firstLog = dayTimelogs.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];
        const actualStartTime = new Date(firstLog.startTime);
        const actualStartMinutesFromMidnight = actualStartTime.getHours() * 60 + actualStartTime.getMinutes();
        
        // Calculer l'écart d'heure de début (en minutes)
        startDiff = actualStartMinutesFromMidnight - scheduledStartMinutesFromMidnight;
        
        console.log(`Écart de début pour ${day.label}: ${startDiff} minutes`);
        
        // Prendre le dernier pointage terminé comme heure de départ
        const completedLogs = dayTimelogs.filter(log => log.status === 'completed');
        if (completedLogs.length > 0) {
          const lastLog = completedLogs.sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];
          const actualEndTime = new Date(lastLog.endTime);
          const actualEndMinutesFromMidnight = actualEndTime.getHours() * 60 + actualEndTime.getMinutes();
          
          // Calculer l'écart d'heure de fin (en minutes)
          endDiff = actualEndMinutesFromMidnight - scheduledEndMinutesFromMidnight;
          
          console.log(`Écart de fin pour ${day.label}: ${endDiff} minutes`);
          
          // Calculer le temps total travaillé
          dayTimelogs.forEach(log => {
            if (log.status === 'completed' && log.endTime) {
              const start = new Date(log.startTime);
              const end = new Date(log.endTime);
              const durationMinutes = (end - start) / (1000 * 60);
              totalWorkedMinutes += durationMinutes;
              console.log(`Pointage ${log._id}: Durée = ${durationMinutes} minutes`);
            }
          });
          
          console.log(`Temps total travaillé pour ${day.label}: ${totalWorkedMinutes} minutes`);
        } else {
          console.log(`Pas de pointages complétés pour ${day.label}`);
        }
      } else if (dayTimelogs.length > 0) {
        // Si pas d'horaire prévu mais des pointages existent quand même
        console.log(`Pointages trouvés pour ${day.label} mais pas d'horaire prévu ou horaire de repos`);
        
        // Calculer le temps total travaillé même s'il n'y a pas d'horaire prévu
        dayTimelogs.forEach(log => {
          if (log.status === 'completed' && log.endTime) {
            const start = new Date(log.startTime);
            const end = new Date(log.endTime);
            const durationMinutes = (end - start) / (1000 * 60);
            totalWorkedMinutes += durationMinutes;
          }
        });
      } else {
        console.log(`Pas de pointages pour ${day.label}`);
      }

      comparison.push({
        day: day.value,
        dayLabel: day.label,
        date: dayDate,
        scheduled: scheduleEntry,
        timelogs: dayTimelogs,
        startDiff,
        endDiff,
        totalWorkedMinutes,
        shouldWork: scheduleEntry && scheduleEntry.entryType === 'work'
      });
    });

    setComparisonData(comparison);
  };

  // Obtenir les dates de la semaine
  const getWeekDates = () => {
    const dates = {};
    const startDate = new Date(dateRange.startDate);
    
    days.forEach((day, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      dates[day.value] = date;
    });
    
    return dates;
  };

  // Formater la différence en minutes en une chaîne lisible
  const formatDiffMinutes = (minutes) => {
    if (minutes === null) return 'N/A';
    
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    
    let result = '';
    if (hours > 0) {
      result += `${hours}h`;
    }
    if (mins > 0 || hours === 0) {
      result += `${mins}min`;
    }
    
    if (minutes < 0) {
      return `${result} avant`;
    } else if (minutes > 0) {
      return `${result} après`;
    } else {
      return 'À l\'heure';
    }
  };

  // Formater les minutes en HH:MM
  const formatMinutesToTime = (minutes) => {
    if (minutes === null || isNaN(minutes)) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Formater la date pour l'affichage
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Gérer le changement d'utilisateur
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  // Gérer le changement de date
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Semaine précédente
  const handlePreviousWeek = () => {
    const startDate = new Date(dateRange.startDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const endDate = new Date(dateRange.endDate);
    endDate.setDate(endDate.getDate() - 7);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  // Semaine suivante
  const handleNextWeek = () => {
    const startDate = new Date(dateRange.startDate);
    startDate.setDate(startDate.getDate() + 7);
    
    const endDate = new Date(dateRange.endDate);
    endDate.setDate(endDate.getDate() + 7);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  // Fonction pour obtenir la classe CSS en fonction de l'écart
  const getDifferenceClass = (diff) => {
    if (diff === null) return '';
    
    if (diff < -15) return 'early';      // Plus de 15 minutes en avance
    if (diff < 5) return 'on-time';      // À l'heure (±5 minutes)
    if (diff < 15) return 'slightly-late'; // Légèrement en retard (5-15 minutes)
    return 'late';                        // En retard (plus de 15 minutes)
  };

  // Calculer le total des temps travaillés
  const calculateTotalWorkedTime = () => {
    const totalMinutes = comparisonData.reduce((sum, day) => sum + (day.totalWorkedMinutes || 0), 0);
    return formatMinutesToTime(totalMinutes);
  };

  // Calculer le temps total prévu
  const calculateTotalScheduledTime = () => {
    let totalMinutes = 0;
    
    comparisonData.forEach(day => {
      if (day.scheduled && day.scheduled.entryType === 'work') {
        const [startHours, startMinutes] = day.scheduled.startTime.split(':').map(Number);
        const [endHours, endMinutes] = day.scheduled.endTime.split(':').map(Number);
        
        const startMinutesFromMidnight = startHours * 60 + startMinutes;
        const endMinutesFromMidnight = endHours * 60 + endMinutes;
        
        totalMinutes += endMinutesFromMidnight - startMinutesFromMidnight;
      }
    });
    
    return formatMinutesToTime(totalMinutes);
  };

  // Calculer la différence entre le temps prévu et le temps travaillé
  const calculateTotalDifference = () => {
    let totalScheduledMinutes = 0;
    let totalWorkedMinutes = 0;
    
    comparisonData.forEach(day => {
      // Calculer le temps prévu
      if (day.scheduled && day.scheduled.entryType === 'work') {
        const [startHours, startMinutes] = day.scheduled.startTime.split(':').map(Number);
        const [endHours, endMinutes] = day.scheduled.endTime.split(':').map(Number);
        
        const startMinutesFromMidnight = startHours * 60 + startMinutes;
        const endMinutesFromMidnight = endHours * 60 + endMinutes;
        
        totalScheduledMinutes += endMinutesFromMidnight - startMinutesFromMidnight;
      }
      
      // Ajouter le temps travaillé
      totalWorkedMinutes += day.totalWorkedMinutes || 0;
    });
    
    // Calculer la différence
    const diffMinutes = totalWorkedMinutes - totalScheduledMinutes;
    
    return formatDiffMinutes(diffMinutes);
  };

  return (
    <div>
      <Navigation />
      
      <div className="schedule-comparison-container">
        <h1 className="page-title">Comparaison des horaires et pointages</h1>
        
        {error && <AlertMessage type="error" message={error} />}
        
        <div className="filters-section">
          <div className="user-filter">
            <label htmlFor="user-select">Préparateur:</label>
            {users && users.length > 0 ? (
              <select 
                id="user-select" 
                value={selectedUser} 
                onChange={handleUserChange}
                className="filter-select"
              >
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <select 
                id="user-select" 
                disabled
                className="filter-select"
              >
                <option>Aucun préparateur disponible</option>
              </select>
            )}
          </div>
          
          {users && users.length === 0 && currentUser.role === 'admin' && (
            <div className="add-preparator-shortcut">
              <button 
                onClick={() => navigate('/admin')}
                className="btn btn-primary"
              >
                <i className="fas fa-plus-circle"></i> Ajouter un préparateur
              </button>
              <span className="helper-text">Aucun préparateur trouvé. Vous devez en créer un dans l'administration.</span>
            </div>
          )}
          
          <div className="date-navigation">
            <button 
              onClick={handlePreviousWeek}
              className="nav-button"
            >
              <i className="fas fa-chevron-left"></i> Semaine précédente
            </button>
            
            <div className="date-range">
              Du {formatDate(dateRange.startDate)} au {formatDate(dateRange.endDate)}
            </div>
            
            <button 
              onClick={handleNextWeek}
              className="nav-button"
            >
              Semaine suivante <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <p>Chargement des données...</p>
          </div>
        ) : (
          <>
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Date</th>
                    <th>Horaire prévu</th>
                    <th>Heure d'arrivée</th>
                    <th>Écart arrivée</th>
                    <th>Heure de départ</th>
                    <th>Écart départ</th>
                    <th>Temps travaillé</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map(day => (
                    <tr key={day.day} className={day.shouldWork ? '' : 'rest-day'}>
                      <td>{day.dayLabel}</td>
                      <td>{formatDate(day.date)}</td>
                      <td>
                        {day.scheduled ? (
                          day.scheduled.entryType === 'work' ? (
                            <span className="scheduled-time">
                              {day.scheduled.startTime} - {day.scheduled.endTime}
                            </span>
                          ) : (
                            <span className="rest-day-label">
                              <i className="fas fa-bed"></i> Repos
                            </span>
                          )
                        ) : (
                          <span className="not-scheduled">Non planifié</span>
                        )}
                      </td>
                      <td>
                        {day.timelogs.length > 0 ? (
                          <span>
                            {new Date(day.timelogs[0].startTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="no-timelog">-</span>
                        )}
                      </td>
                      <td className={`diff ${getDifferenceClass(day.startDiff)}`}>
                        {formatDiffMinutes(day.startDiff)}
                      </td>
                      <td>
                        {day.timelogs.length > 0 && 
                         day.timelogs.filter(log => log.status === 'completed').length > 0 ? (
                          <span>
                            {new Date(day.timelogs.filter(log => log.status === 'completed')
                                                  .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0].endTime)
                                                  .toLocaleTimeString('fr-FR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                          </span>
                        ) : (
                          <span className="no-timelog">-</span>
                        )}
                      </td>
                      <td className={`diff ${getDifferenceClass(day.endDiff)}`}>
                        {formatDiffMinutes(day.endDiff)}
                      </td>
                      <td>
                        {day.totalWorkedMinutes > 0 ? (
                          <span className="worked-time">
                            {formatMinutesToTime(day.totalWorkedMinutes)}
                          </span>
                        ) : (
                          <span className="no-timelog">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="7" className="total-label">Total:</td>
                    <td className="total-value">{calculateTotalWorkedTime()}</td>
                  </tr>
                  <tr>
                    <td colSpan="7" className="total-label">Temps prévu:</td>
                    <td className="total-value">{calculateTotalScheduledTime()}</td>
                  </tr>
                  <tr>
                    <td colSpan="7" className="total-label">Différence:</td>
                    <td className="total-value">{calculateTotalDifference()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="legend">
              <div className="legend-title">Légende:</div>
              <div className="legend-item">
                <span className="legend-color early"></span>
                <span>En avance (plus de 15 minutes)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color on-time"></span>
                <span>À l'heure (±5 minutes)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color slightly-late"></span>
                <span>Légèrement en retard (5-15 minutes)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color late"></span>
                <span>En retard (plus de 15 minutes)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color rest-day"></span>
                <span>Jour de repos</span>
              </div>
            </div>
            
            <div className="notes-section">
              <h2>Notes explicatives</h2>
              <ul>
                <li>Les données de pointage sont comparées aux horaires planifiés pour chaque jour.</li>
                <li>Le temps travaillé est calculé à partir des pointages effectués dans la journée.</li>
                <li>Un pointage est considéré comme "à l'heure" s'il est effectué dans une plage de 5 minutes avant ou après l'heure prévue.</li>
                <li>Si plusieurs pointages sont effectués dans une journée, le premier est utilisé pour l'heure d'arrivée et le dernier pour l'heure de départ.</li>
                <li>Les jours de repos sont indiqués sur fond gris.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleComparison;