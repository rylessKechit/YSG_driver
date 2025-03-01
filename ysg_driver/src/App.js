// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TimeLog from './pages/TimeLog';
import MovementHistory from './pages/MovementHistory';
import MovementDetail from './pages/MovementDetail';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import AdminMovementCreate from './pages/AdminMovementCreate';

// Composant de route protégée
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Chargement...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Composant principal de l'application
const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        
        {/* Routes protégées */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/timelog" 
          element={
            <ProtectedRoute>
              <TimeLog />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/movement/history" 
          element={
            <ProtectedRoute>
              <MovementHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/movement/:id" 
          element={
            <ProtectedRoute>
              <MovementDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/movements/create" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminMovementCreate />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

// Application avec Provider d'authentification
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;