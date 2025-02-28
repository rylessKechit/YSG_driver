import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

// Création du contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Vérification du token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Fonction de connexion
  const login = async (username, password) => {
    try {
      setError(null);
      const { token, user } = await authService.login(username, password);
      localStorage.setItem('token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
      throw err;
    }
  };
  
  // Fonction d'inscription
  const register = async (userData) => {
    try {
      setError(null);
      const { token, user } = await authService.register(userData);
      localStorage.setItem('token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur d\'inscription');
      throw err;
    }
  };
  
  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      setCurrentUser(null);
    }
  };
  
  // Valeurs exposées par le contexte
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};