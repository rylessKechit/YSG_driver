// src/pages/ScheduleManager.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import scheduleService from '../services/scheduleService';
import Navigation from '../components/Navigation';
import ScheduleForm from '../components/schedule/ScheduleForm';
import ScheduleTable from '../components/schedule/ScheduleTable';
import AlertMessage from '../components/ui/AlertMessage';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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

  // Gérer l'édition d'une entrée
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

  // Initialiser le formulaire pour ajouter une nouvelle entrée
  const handleAddEntry = (preparatorId, day) => {
    setFormData(prev => ({
      ...prev,
      userId: preparatorId,
      day: day
    }));
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
    
    if (!formData.userId || !formData.day) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Si nous sommes en mode édition, inclure l'ID dans les données
      const dataToSubmit = editMode 
        ? { ...formData, _id: currentEntryId }
        : formData;
      
      await scheduleService.saveScheduleEntry(dataToSubmit);
      
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

  return (
    <div>
      <Navigation />
      
      <div className="schedule-manager-container">
        <h1 className="page-title">Gestion du planning des préparateurs</h1>
        
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}
        
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <p>Chargement en cours...</p>
          </div>
        ) : (
          <div className="schedule-content">
            <ScheduleForm 
              formData={formData}
              editMode={editMode}
              preparators={preparators}
              days={days}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
            
            <ScheduleTable 
              scheduleData={scheduleData}
              days={days}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddEntry={handleAddEntry}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;