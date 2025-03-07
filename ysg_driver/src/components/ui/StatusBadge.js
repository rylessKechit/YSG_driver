// src/components/ui/StatusBadge.js
import React from 'react';

const statusMap = {
  pending: { 
    label: 'En attente', 
    className: 'status-pending',
    icon: 'fa-hourglass-start'
  },
  assigned: { 
    label: 'Assigné', 
    className: 'status-assigned',
    icon: 'fa-user-check'
  },
  preparing: { 
    label: 'En préparation', 
    className: 'status-preparing',
    icon: 'fa-tools'
  },
  'in-progress': { 
    label: 'En cours', 
    className: 'status-in-progress',
    icon: 'fa-spinner'
  },
  completed: { 
    label: 'Terminé', 
    className: 'status-completed',
    icon: 'fa-check-circle'
  },
  cancelled: { 
    label: 'Annulé', 
    className: 'status-cancelled',
    icon: 'fa-times-circle'
  }
};

const StatusBadge = ({ status, customLabel, showIcon = true }) => {
  const statusInfo = statusMap[status] || { 
    label: 'Inconnu', 
    className: '',
    icon: 'fa-question-circle'
  };
  
  return (
    <span className={`status-badge ${statusInfo.className}`}>
      {showIcon && <i className={`fas ${statusInfo.icon}`}></i>}
      <span>{customLabel || statusInfo.label}</span>
    </span>
  );
};

export default StatusBadge;