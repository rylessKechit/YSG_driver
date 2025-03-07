// ysg_driver/src/pages/WhatsAppSetup.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import axios from 'axios';
import { API_URL } from '../config';

const WhatsAppSetup = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/admin/whatsapp-status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setStatus(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la vérification du statut WhatsApp:', err);
        setError('Erreur lors de la vérification du statut WhatsApp');
        setLoading(false);
      }
    };
    
    checkStatus();
    
    // Vérifier le statut toutes les 10 secondes
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <Navigation />
      
      <div className="whatsapp-setup-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1 className="page-title">Configuration WhatsApp</h1>
        
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '20px' }}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading-spinner" style={{ textAlign: 'center', padding: '40px' }}>
            Chargement...
          </div>
        ) : (
          <div className="status-card" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>Statut de la connexion WhatsApp</h2>
            
            <div className="status-info" style={{ margin: '20px 0' }}>
              <p><strong>État:</strong> {status?.isReady ? 'Connecté' : 'Déconnecté'}</p>
              <p><strong>Message:</strong> {status?.message}</p>
            </div>
            
            {!status?.isReady && status?.qrCodeExists && (
              <div className="qr-code-container" style={{ textAlign: 'center', margin: '20px 0' }}>
                <h3>Scannez ce QR code avec WhatsApp sur votre téléphone</h3>
                <img 
                  src={`${API_URL}/api/admin/whatsapp-qr?${new Date().getTime()}`} 
                  alt="WhatsApp QR Code" 
                  style={{ maxWidth: '300px', margin: '20px auto', display: 'block' }}
                />
                <p>
                  <strong>Instruction :</strong> Ouvrez WhatsApp sur votre téléphone &gt; Menu &gt; WhatsApp Web &gt; Scannez le QR code ci-dessus
                </p>
              </div>
            )}
            
            {status?.isReady && (
              <div className="success-message" style={{ backgroundColor: '#d1fae5', padding: '15px', borderRadius: '8px', color: '#047857' }}>
                <h3>WhatsApp est connecté !</h3>
                <p>Vous pouvez maintenant envoyer des notifications aux chauffeurs.</p>
              </div>
            )}
          </div>
        )}
        
        <div className="info-card" style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3>Information importante</h3>
          <p>Cette solution utilise une méthode non-officielle pour se connecter à WhatsApp. Elle est destinée uniquement à des fins de test et de développement.</p>
          <p>Pour un environnement de production, nous vous recommandons d'utiliser l'API WhatsApp Business officielle.</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSetup;