import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Gestion du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Fonction de navigation explicite
  const goTo = (path) => {
    console.log(`Navigation vers: ${path}`);
    setIsMenuOpen(false);
    navigate(path);
  };
  
  // Gestion de la déconnexion
  const handleLogout = () => {
    console.log('Tentative de déconnexion');
    logout()
      .then(() => {
        navigate('/login');
      })
      .catch(error => {
        console.error('Erreur de déconnexion:', error);
      });
  };
  
  // Déterminer la route correcte pour "Nouveau trajet" en fonction du rôle
  const getNewMovementPath = () => {
    // Pour les admins, utiliser le chemin d'admin pour la création
    if (currentUser && currentUser.role === 'admin') {
      return '/admin/movements/create';
    }
    // Pour les chauffeurs, utiliser le chemin standard
    return '/movement/new';
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          {/* Logo */}
          <div 
            className="nav-logo" 
            onClick={() => goTo('/dashboard')}
          >
            GestionChauffeurs
          </div>
          
          {/* Hamburger button (visible only on mobile) */}
          {isMobile && (
            <button 
              className="hamburger-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className={`hamburger-icon ${isMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          )}
          
          {/* Menu de navigation - version desktop ou mobile */}
          <ul className={`nav-links ${isMobile ? (isMenuOpen ? 'mobile open' : 'mobile closed') : 'desktop'}`}>
            <li className="nav-item">
              <div 
                className="nav-link"
                onClick={() => goTo('/dashboard')}
              >
                Tableau de bord
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className="nav-link"
                onClick={() => goTo('/timelog')}
              >
                Pointage
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className="nav-link"
                onClick={() => goTo(getNewMovementPath())}
              >
                Nouveau trajet
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className="nav-link"
                onClick={() => goTo('/movement/history')}
              >
                Historique
              </div>
            </li>
            
            <li className="nav-item">
              <div 
                className="nav-link"
                onClick={() => goTo('/profile')}
              >
                Profil
              </div>
            </li>
            
            {currentUser && currentUser.role === 'admin' && (
              <li className="nav-item">
                <div 
                  className="nav-link"
                  onClick={() => goTo('/admin')}
                >
                  Administration
                </div>
              </li>
            )}
            
            <li className="nav-item">
              <div 
                className="nav-link logout"
                onClick={handleLogout}
              >
                Déconnexion
              </div>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Overlay pour fermer le menu - s'assurer qu'il est derrière le menu mais devant le contenu */}
      {isMobile && isMenuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Navigation;