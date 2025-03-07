// src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import Navigation from '../components/Navigation';
import AlertMessage from '../components/ui/AlertMessage';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import UserForm from '../components/admin/UserForm';
import UsersTable from '../components/admin/UsersTable';
import AdminTools from '../components/admin/AdminTools';

import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' ou 'edit'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'driver'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Rediriger si l'utilisateur n'est pas administrateur
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Charger la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        setError('Erreur lors du chargement des utilisateurs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'driver'
    });
    setShowUserForm(false);
    setSelectedUser(null);
    setFormMode('create');
  };

  // Ouvrir le formulaire pour créer un utilisateur
  const handleCreateUser = () => {
    resetForm();
    setShowUserForm(true);
    setFormMode('create');
  };

  // Ouvrir le formulaire pour modifier un utilisateur
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      // Le mot de passe n'est pas inclus pour la modification
      password: '',
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    });
    setShowUserForm(true);
    setFormMode('edit');
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (formMode === 'create') {
        // Créer un nouvel utilisateur
        await userService.createUser(formData);
        setSuccess('Utilisateur créé avec succès');
      } else {
        // Modifier un utilisateur existant
        const dataToUpdate = { ...formData };
        // Ne pas envoyer le mot de passe s'il est vide
        if (!dataToUpdate.password) {
          delete dataToUpdate.password;
        }
        await userService.updateUser(selectedUser._id, dataToUpdate);
        setSuccess('Utilisateur mis à jour avec succès');
      }
      
      // Recharger la liste des utilisateurs
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
      
      // Réinitialiser le formulaire
      resetForm();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'opération');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await userService.deleteUser(userId);
      
      // Mettre à jour la liste des utilisateurs
      setUsers(users.filter(user => user._id !== userId));
      setSuccess('Utilisateur supprimé avec succès');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation />
      
      <div className="admin-container">
        <h1 className="page-title">Panneau d'administration</h1>
        
        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}
        
        <div className="admin-header">
          <h2 className="section-title">Gestion des utilisateurs</h2>
          <button 
            onClick={handleCreateUser}
            className="btn btn-primary"
          >
            Ajouter un utilisateur
          </button>
        </div>
        
        {showUserForm && (
          <UserForm 
            formData={formData}
            formMode={formMode}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            loading={loading}
          />
        )}
        
        {loading && !showUserForm ? (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        ) : (
          <UsersTable 
            users={users}
            currentUser={currentUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            loading={loading}
          />
        )}
      </div>
      
      <AdminTools />
    </div>
  );
};

export default AdminPanel;