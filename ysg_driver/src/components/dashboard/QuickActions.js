// src/components/dashboard/QuickActions.js
import React from 'react';
import { Link } from 'react-router-dom';

const QuickActions = ({ currentUser }) => {
  // Fonction pour rendre les actions selon le rôle
  const renderActionsByRole = () => {
    switch (currentUser.role) {
      case 'admin':
        return (
          <>
            <Link to="/admin/movements/create" className="action-card">
              <div className="action-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <span className="action-title">Créer un mouvement</span>
            </Link>
            <Link to="/movement/history" className="action-card">
              <div className="action-icon">
                <i className="fas fa-history"></i>
              </div>
              <span className="action-title">Historique des mouvements</span>
            </Link>
            <Link to="/preparations" className="action-card">
              <div className="action-icon">
                <i className="fas fa-tools"></i>
              </div>
              <span className="action-title">Historique des préparations</span>
            </Link>
            <Link to="/reports" className="action-card">
              <div className="action-icon">
                <i className="fas fa-file-excel"></i>
              </div>
              <span className="action-title">Rapports</span>
            </Link>
            <Link to="/schedules" className="action-card">
              <div className="action-icon">
                <i className="fas fa-calendar-week"></i>
              </div>
              <span className="action-title">Planning préparateurs</span>
            </Link>
            <Link to="/schedule-comparison" className="action-card">
              <div className="action-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <span className="action-title">Comparaison pointages</span>
            </Link>
            <Link to="/admin" className="action-card">
              <div className="action-icon">
                <i className="fas fa-user-shield"></i>
              </div>
              <span className="action-title">Administration</span>
            </Link>
          </>
        );
      case 'team-leader':
        return (
          <>
            <Link to="/admin/movements/create" className="action-card">
              <div className="action-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <span className="action-title">Créer un mouvement</span>
            </Link>
            <Link to="/preparations/create" className="action-card">
              <div className="action-icon">
                <i className="fas fa-tools"></i>
              </div>
              <span className="action-title">Créer une préparation</span>
            </Link>
            <Link to="/movement/history" className="action-card">
              <div className="action-icon">
                <i className="fas fa-history"></i>
              </div>
              <span className="action-title">Historique</span>
            </Link>
            <Link to="/profile" className="action-card">
              <div className="action-icon">
                <i className="fas fa-user"></i>
              </div>
              <span className="action-title">Mon profil</span>
            </Link>
          </>
        );
      case 'preparator':
        return (
          <>
            <Link to="/preparations/create" className="action-card">
              <div className="action-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <span className="action-title">Créer une préparation</span>
            </Link>
            <Link to="/preparations" className="action-card">
              <div className="action-icon">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <span className="action-title">Historique des préparations</span>
            </Link>
            <Link to="/profile" className="action-card">
              <div className="action-icon">
                <i className="fas fa-user"></i>
              </div>
              <span className="action-title">Mon profil</span>
            </Link>
          </>
        );
      case 'direction':
        return (
          <>
            <Link to="/reports" className="action-card">
              <div className="action-icon">
                <i className="fas fa-file-excel"></i>
              </div>
              <span className="action-title">Rapports</span>
            </Link>
            <Link to="/schedules" className="action-card">
              <div className="action-icon">
                <i className="fas fa-calendar-week"></i>
              </div>
              <span className="action-title">Planning préparateurs</span>
            </Link>
            <Link to="/schedule-comparison" className="action-card">
              <div className="action-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <span className="action-title">Comparaison pointages</span>
            </Link>
            <Link to="/profile" className="action-card">
              <div className="action-icon">
                <i className="fas fa-user"></i>
              </div>
              <span className="action-title">Mon profil</span>
            </Link>
          </>
        );
      // Chauffeur (default)
      default:
        return (
          <>
            <Link to="/preparations/create" className="action-card">
              <div className="action-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <span className="action-title">Créer une préparation</span>
            </Link>
            <Link to="/movement/history" className="action-card">
              <div className="action-icon">
                <i className="fas fa-history"></i>
              </div>
              <span className="action-title">Historique</span>
            </Link>
            <Link to="/profile" className="action-card">
              <div className="action-icon">
                <i className="fas fa-user"></i>
              </div>
              <span className="action-title">Mon profil</span>
            </Link>
          </>
        );
    }
  };

  return (
    <div className="quick-actions">
      <h2 className="section-title">
        <i className="fas fa-bolt"></i> Actions rapides
      </h2>
      
      <div className="actions-grid">
        {renderActionsByRole()}
      </div>
    </div>
  );
};

export default QuickActions;