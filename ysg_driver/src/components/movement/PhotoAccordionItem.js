// src/components/movement/PhotoAccordionItem.js
import React, { useState, useEffect } from 'react';

const PhotoAccordionItem = ({
  type,
  label,
  instruction,
  completed,
  expanded,
  photoUrl,
  selectedFile,
  onToggle,
  onSelectPhoto,
  onUploadPhoto,
  onResetStatus,
  uploadingPhoto
}) => {
  // État local pour l'URL de prévisualisation
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Effet pour gérer l'URL de prévisualisation
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile, type]);

  // Fonction pour gérer le changement de fichier
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onSelectPhoto(e.target.files[0]);
    }
  };

  // Styles inline pour garantir l'affichage
  const styles = {
    previewContainer: {
      margin: '15px 0',
      textAlign: 'center',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '8px',
      backgroundColor: '#f9fafb'
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    uploaderContainer: {
      marginTop: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    fileInput: {
      display: 'block',
      width: '100%',
      padding: '8px',
      border: '1px dashed #d1d5db',
      borderRadius: '4px',
      backgroundColor: '#f9fafb'
    },
    uploadButton: { marginTop: '10px' },
    completedSection: {
      borderLeft: '4px solid #10b981',
      backgroundColor: '#ecfdf5'
    }
  };

  return (
    <div 
      className="photo-accordion-item" 
      style={completed ? { ...styles.completedSection, borderRadius: '8px', overflow: 'hidden' } : {}}
    >
      <div 
        className={`photo-accordion-header ${completed ? 'completed' : ''}`} 
        onClick={onToggle}
        style={completed ? { backgroundColor: '#d1fae5' } : {}}
      >
        <div className="photo-section-title">
          <span className="status-icon">
            {completed ? 
              <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i> : 
              <i className="fas fa-circle" style={{ color: '#6b7280' }}></i>
            }
          </span>
          <span>{label}</span>
        </div>
        <div className="photo-section-actions">
          {completed ? 
            <span className="photo-status-text" style={{ color: '#10b981', fontWeight: '500' }}>Complété</span> : 
            <span className="photo-status-text">À photographier</span>
          }
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
        </div>
      </div>
      
      {expanded && (
        <div className="photo-accordion-content">
          {completed ? (
            <div className="completed-photo">
              <div style={styles.previewContainer}>
                {photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt={label} 
                    className="preview-image"
                    style={styles.previewImage}
                    onClick={() => window.open(photoUrl, '_blank')}
                  />
                ) : (
                  <div style={styles.previewContainer}>
                    <p>Aucune image disponible</p>
                  </div>
                )}
              </div>
              <button 
                className="btn btn-secondary photo-replace-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onResetStatus();
                }}
              >
                Remplacer la photo
              </button>
            </div>
          ) : (
            <div className="photo-upload-container">
              <p className="photo-instruction">{instruction}</p>
              <div className="file-upload-wrapper" style={styles.uploaderContainer}>
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="photo-input"
                  style={styles.fileInput}
                />
                
                {selectedFile && (
                  <div className="photo-preview-container" style={styles.previewContainer}>
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Prévisualisation" 
                        className="preview-image"
                        style={styles.previewImage}
                      />
                    ) : (
                      <div style={{color: '#6b7280', padding: '20px'}}>
                        Fichier sélectionné : {selectedFile.name} ({Math.round(selectedFile.size/1024)} Ko)
                      </div>
                    )}
                  </div>
                )}
                
                <button 
                  className="btn btn-primary upload-photo-btn"
                  disabled={!selectedFile || uploadingPhoto}
                  onClick={onUploadPhoto}
                  style={styles.uploadButton}
                >
                  {uploadingPhoto ? 'Chargement...' : 'Valider la photo'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoAccordionItem;