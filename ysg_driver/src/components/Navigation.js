import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };
  
  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/dashboard" className="nav-logo">
            GestionChauffeurs
          </Link>
          
          <ul className="nav-links">
            <li className="nav-item">
              <Link to="/dashboard" className={isActive('/dashboard')}>
                Tableau de bord
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/timelog" className={isActive('/timelog')}>
                Pointage
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/movement/new" className={isActive('/movement/new')}>
                Nouveau trajet
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/movement/history" className={isActive('/movement/history')}>
                Historique
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/profile" className={isActive('/profile')}>
                Profil
              </Link>
            </li>
            {currentUser && currentUser.role === 'admin' && (
              <li className="nav-item">
                <Link to="/admin" className={isActive('/admin')}>
                  Administration
                </Link>
              </li>
            )}
            <li className="nav-item">
              <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;