// src/components/movement/NotesSection.js
import React from 'react';

const NotesSection = ({ 
  notes, 
  onChange, 
  readOnly = false, 
  placeholder = "Ajouter des notes concernant ce mouvement..." 
}) => {
  return (
    <div className="detail-section notes-section">
      <h2 className="section-title">Notes</h2>
      {!readOnly ? (
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          className="notes-textarea"
          placeholder={placeholder}
          rows="4"
        ></textarea>
      ) : (
        <div className="notes-content">
          {notes ? notes : 'Aucune note disponible'}
        </div>
      )}
    </div>
  );
};

export default NotesSection;