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
  
  // Rendu des liens de navigation selon le rôle de l'utilisateur
  const renderNavLinks = () => {
    const commonLinks = [
      {
        name: 'Tableau de bord',
        path: '/dashboard',
        visible: true
      },
      {
        name: 'Pointage',
        path: '/timelog',
        // Masquer l'option de pointage pour les rôles admin et direction
        visible: currentUser?.role !== 'direction' && currentUser?.role !== 'admin'
      },
      {
        name: 'Profil',
        path: '/profile',
        visible: true
      }
    ];
    
    const roleSpecificLinks = {
      admin: [
        {
          name: 'Nouveau mouvement',
          path: '/admin/movements/create',
          visible: true
        },
        {
          name: 'Mouvements',
          path: '/movement/history',
          visible: true
        },
        {
          name: 'Préparations',
          path: '/preparations',
          visible: true
        },
        {
          name: 'Rapports',
          path: '/reports',
          visible: true
        },
        {
          name: 'Administration',
          path: '/admin',
          visible: true
        }
      ],
      'team-leader': [
        {
          name: 'Nouveau mouvement',
          path: '/admin/movements/create',
          visible: true
        },
        {
          name: 'Mouvements',
          path: '/movement/history',
          visible: true
        },
        {
          name: 'Préparations',
          path: '/preparations',
          visible: true
        },
        {
          name: 'Nouvelle préparation',
          path: '/preparations/create',
          visible: true
        }
      ],
      driver: [
        {
          name: 'Mouvements',
          path: '/movement/history',
          visible: true
        },
        {
          name: 'Nouvelle préparation',
          path: '/preparations/create',
          visible: true
        }
      ],
      preparator: [
        {
          name: 'Préparations',
          path: '/preparations',
          visible: true
        },
        {
          name: 'Nouvelle préparation',
          path: '/preparations/create',
          visible: true
        }
      ],
      direction: [
        {
          name: 'Rapports',
          path: '/reports',
          visible: true
        }
      ]
    };
    
    // Combiner les liens communs et spécifiques au rôle
    const links = [
      ...commonLinks,
      ...(roleSpecificLinks[currentUser?.role] || [])
    ];
    
    // Filtrer les liens visibles
    return links.filter(link => link.visible);
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
            {renderNavLinks().map((link, index) => (
              <li key={index} className="nav-item">
                <div 
                  className="nav-link"
                  onClick={() => goTo(link.path)}
                >
                  {link.name}
                </div>
              </li>
            ))}
            
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