// src/components/movement/PhotoAccordionItem.js
import React from 'react';

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
  return (
    <div className="photo-accordion-item">
      <div 
        className={`photo-accordion-header ${completed ? 'completed' : ''}`} 
        onClick={onToggle}
      >
        <div className="photo-section-title">
          <span className="status-icon">
            {completed ? <i className="fas fa-check-circle"></i> : <i className="fas fa-circle"></i>}
          </span>
          <span>{label}</span>
        </div>
        <div className="photo-section-actions">
          {completed ? (
            <span className="photo-status-text">Complété</span>
          ) : (
            <span className="photo-status-text">À photographier</span>
          )}
          <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
        </div>
      </div>
      
      {expanded && (
        <div className="photo-accordion-content">
          {completed ? (
            <div className="completed-photo">
              <img 
                src={photoUrl} 
                alt={label} 
                className="preview-image"
                onClick={() => window.open(photoUrl, '_blank')}
              />
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
              <div className="file-upload-wrapper">
                <input 
                  type="file" 
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => onSelectPhoto(e.target.files[0])}
                  className="photo-input" 
                />
                {selectedFile && (
                  <div className="photo-preview-wrapper">
                    <img 
                      src={URL.createObjectURL(selectedFile)} 
                      alt="Prévisualisation" 
                      className="preview-image"
                    />
                  </div>
                )}
                <button 
                  className="btn btn-primary upload-photo-btn"
                  disabled={!selectedFile || uploadingPhoto}
                  onClick={onUploadPhoto}
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