// src/pages/ScheduleManager.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import scheduleService from '../services/scheduleService';
import Navigation from '../components/Navigation';
import '../styles/ScheduleManager.css';

const ScheduleManager = () => {
  const [preparators, setPreparators] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    day: 'monday',
    entryType: 'work',
    startTime: '09:00',
    endTime: '17:00',
    tasks: '',
    location: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const days = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' }
  ];

  // Vérifier les permissions
  useEffect(() => {
    if (currentUser && 
        currentUser.role !== 'admin' && 
        currentUser.role !== 'direction') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger les préparateurs
        const preparatorsData = await scheduleService.getPreparators();
        setPreparators(preparatorsData);
        
        // Charger tous les plannings
        const schedulesData = await scheduleService.getAllSchedules();
        setScheduleData(schedulesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (entry) => {
    setFormData({
      userId: entry.userId._id,
      day: entry.day,
      entryType: entry.entryType || 'work', // Fallback au cas où c'est une entrée ancienne
      startTime: entry.startTime || '09:00',
      endTime: entry.endTime || '17:00',
      tasks: entry.tasks || '',
      location: entry.location || ''
    });
    setCurrentEntryId(entry._id);
    setEditMode(true);
  };
  
  // Annuler l'édition
  const handleCancel = () => {
    setFormData({
      userId: '',
      day: 'monday',
      entryType: 'work',
      startTime: '09:00',
      endTime: '17:00',
      tasks: '',
      location: ''
    });
    setCurrentEntryId(null);
    setEditMode(false);
  };

  // Supprimer une entrée
  const handleDelete = async (entryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await scheduleService.deleteScheduleEntry(entryId);
      
      // Recharger les données
      const updatedSchedules = await scheduleService.getAllSchedules();
      setScheduleData(updatedSchedules);
      
      setSuccess('Entrée supprimée avec succès');
      setTimeout(() => setSuccess(null), 3000);
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression de l\'entrée');
      setLoading(false);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.day || !formData.startTime || !formData.endTime) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await scheduleService.saveScheduleEntry(formData);
      
      // Recharger les données
      const updatedSchedules = await scheduleService.getAllSchedules();
      setScheduleData(updatedSchedules);
      
      setSuccess(editMode ? 'Planning mis à jour avec succès' : 'Planning créé avec succès');
      setTimeout(() => setSuccess(null), 3000);
      
      // Réinitialiser le formulaire
      handleCancel();
      
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde du planning');
      setLoading(false);
    }
  };

  // Obtenir l'entrée de planning pour un jour et un préparateur spécifiques
  const getScheduleEntry = (preparatorId, day) => {
    const preparator = scheduleData.find(p => p.info._id === preparatorId);
    if (!preparator) return null;
    
    return preparator.schedule[day];
  };

  // Formater l'heure
  const formatTime = (timeString) => {
    return timeString || 'N/A';
  };

  // Afficher le nom du jour
  const getDayName = (dayValue) => {
    const day = days.find(d => d.value === dayValue);
    return day ? day.label : dayValue;
  };

  return (
    <div>
      <Navigation />
      
      <div className="schedule-manager-container">
        <h1 className="page-title">Gestion du planning des préparateurs</h1>
        
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <div className="alert-icon">✓</div>
            <div className="alert-content">{success}</div>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement en cours...</p>
          </div>
        ) : (
          <div className="schedule-content">
            <div className="schedule-form-card">
              <h2 className="form-title">
                {editMode ? 'Modifier une entrée' : 'Ajouter une nouvelle entrée'}
              </h2>
              
              <form onSubmit={handleSubmit} className="schedule-form">
                <div className="form-row">
                    <div className="form-group">
                    <label htmlFor="userId" className="form-label">Préparateur *</label>
                    <select
                        id="userId"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className="form-select"
                        required
                    >
                        <option value="">Sélectionner un préparateur</option>
                        {preparators.map(preparator => (
                        <option key={preparator._id} value={preparator._id}>
                            {preparator.fullName}
                        </option>
                        ))}
                    </select>
                    </div>
                    
                    <div className="form-group">
                    <label htmlFor="day" className="form-label">Jour *</label>
                    <select
                        id="day"
                        name="day"
                        value={formData.day}
                        onChange={handleChange}
                        className="form-select"
                        required
                    >
                        {days.map(day => (
                        <option key={day.value} value={day.value}>
                            {day.label}
                        </option>
                        ))}
                    </select>
                    </div>
                </div>

                {/* Ajout du sélecteur de type d'entrée */}
                <div className="form-row">
                    <div className="form-group">
                    <label htmlFor="entryType" className="form-label">Type de journée *</label>
                    <select
                        id="entryType"
                        name="entryType"
                        value={formData.entryType}
                        onChange={handleChange}
                        className="form-select"
                        required
                    >
                        <option value="work">Jour de travail</option>
                        <option value="rest">Jour de repos</option>
                    </select>
                    </div>
                </div>
                
                {/* Afficher les champs d'horaires uniquement si c'est un jour de travail */}
                {formData.entryType === 'work' && (
                    <>
                    <div className="form-row">
                        <div className="form-group">
                        <label htmlFor="startTime" className="form-label">Heure de début *</label>
                        <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            className="form-input"
                            required={formData.entryType === 'work'}
                        />
                        </div>
                        
                        <div className="form-group">
                        <label htmlFor="endTime" className="form-label">Heure de fin *</label>
                        <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            className="form-input"
                            required={formData.entryType === 'work'}
                        />
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                        <label htmlFor="location" className="form-label">Lieu</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Ex: Atelier nord"
                        />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="tasks" className="form-label">Tâches</label>
                        <textarea
                        id="tasks"
                        name="tasks"
                        value={formData.tasks}
                        onChange={handleChange}
                        className="form-textarea"
                        placeholder="Description des tâches à effectuer..."
                        rows="3"
                        ></textarea>
                    </div>
                    </>
                )}
                
                {/* Assurez-vous que cette partie reste TOUJOURS visible, 
                    quelle que soit la valeur de formData.entryType */}
                <div className="form-actions">
                    {editMode && (
                    <button 
                        type="button" 
                        onClick={handleCancel}
                        className="btn btn-secondary"
                    >
                        Annuler
                    </button>
                    )}
                    <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                    >
                    {loading ? 'Enregistrement...' : (editMode ? 'Mettre à jour' : 'Ajouter')}
                    </button>
                </div>
                </form>
            </div>
            
            <div className="schedule-table-card">
              <h2 className="table-title">Planning hebdomadaire</h2>
              
              <div className="schedule-table-responsive">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Préparateur</th>
                      {days.map(day => (
                        <th key={day.value}>{day.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.map(preparator => (
                      <tr key={preparator.info._id}>
                        <td className="preparator-name">{preparator.info.fullName}</td>
                        {days.map(day => {
                          const entry = preparator.schedule[day.value];
                          return (
                            <td key={day.value} className="schedule-cell">
                              {entry ? (
                                <div className={`schedule-entry ${entry.entryType === 'rest' ? 'rest-day' : ''}`}>
                                    {entry.entryType === 'work' ? (
                                    <>
                                        <div className="entry-time">
                                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                        </div>
                                        {entry.location && (
                                        <div className="entry-location">{entry.location}</div>
                                        )}
                                    </>
                                    ) : (
                                    <div className="rest-day-label">
                                        <i className="fas fa-bed"></i> Jour de repos
                                    </div>
                                    )}
                                    <div className="entry-actions">
                                    <button 
                                        onClick={() => handleEdit(entry)}
                                        className="action-btn edit-btn"
                                        title="Modifier"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(entry._id)}
                                        className="action-btn delete-btn"
                                        title="Supprimer"
                                    >
                                        🗑️
                                    </button>
                                    </div>
                                </div>
                                ) : (
                                <div className="empty-cell">
                                    <button 
                                    onClick={() => {
                                        setFormData(prev => ({
                                        ...prev,
                                        userId: preparator.info._id,
                                        day: day.value
                                        }));
                                    }}
                                    className="add-btn"
                                    title="Ajouter"
                                    >
                                    +
                                    </button>
                                </div>
                                )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;