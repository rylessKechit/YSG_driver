import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import Navigation from '../components/Navigation';
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
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
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
          <div className="user-form-container">
            <h3 className="form-title">
              {formMode === 'create' ? 'Créer un utilisateur' : 'Modifier un utilisateur'}
            </h3>
            
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Nom d'utilisateur *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    {formMode === 'create' ? 'Mot de passe *' : 'Mot de passe (laisser vide pour ne pas changer)'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    required={formMode === 'create'}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Rôle *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="driver">Chauffeur</option>
                    <option value="preparator">Préparateur</option>
                    <option value="team-leader">Chef d'équipe</option>
                    <option value="direction">Direction</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'En cours...' : formMode === 'create' ? 'Créer' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {loading && !showUserForm ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Nom complet</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.fullName}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span className={`role-badge ${
                        user.role === 'admin' ? 'admin-role' : 
                        user.role === 'driver' ? 'driver-role' : 
                        user.role === 'preparator' ? 'preparator-role' : 
                        user.role === 'team-leader' ? 'team-leader-role' : 
                        'direction-role'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 
                        user.role === 'driver' ? 'Chauffeur' : 
                        user.role === 'preparator' ? 'Préparateur' : 
                        user.role === 'team-leader' ? 'Chef d\'équipe' : 
                        'Direction'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="action-button edit-button"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        {user._id !== currentUser._id && (
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="action-button delete-button"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;