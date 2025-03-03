// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';

// Pages communes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TimeLog from './pages/TimeLog';
import Profile from './pages/Profile';

// Pages Chauffeur
import MovementHistory from './pages/MovementHistory';
import MovementDetail from './pages/MovementDetail';

// Pages Admin
import AdminPanel from './pages/AdminPanel';
import AdminMovementCreate from './pages/AdminMovementCreate';

// Pages nouvelles (à créer)
import PreparationList from './pages/PreparationList';
import PreparationDetail from './pages/PreparationDetail';
import PreparationCreate from './pages/PreparationCreate';
import Reports from './pages/Reports';

import ScheduleManager from './pages/ScheduleManager';

// Composant de route protégée
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
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
  
  // Si des rôles sont requis, vérifier que l'utilisateur a l'un d'entre eux
  if (requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
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
        
        {/* Route par défaut */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes communes */}
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
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes Chauffeur */}
        <Route 
          path="/movement/history" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'driver', 'team-leader']}>
              <MovementHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/movement/:id" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'driver', 'team-leader']}>
              <MovementDetail />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes Préparateur */}
        <Route 
          path="/preparations" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'preparator', 'driver', 'team-leader']}>
              <PreparationList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/preparations/:id" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'preparator', 'driver', 'team-leader']}>
              <PreparationDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/preparations/create" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'preparator', 'driver', 'team-leader']}>
              <PreparationCreate />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes Admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/movements/create" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'team-leader']}>
              <AdminMovementCreate />
            </ProtectedRoute>
          } 
        />
        
        {/* Routes Rapports (Admin et Direction) */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'direction']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedules" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'direction']}>
              <ScheduleManager />
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