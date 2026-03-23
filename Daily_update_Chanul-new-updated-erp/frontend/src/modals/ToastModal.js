import React, { useEffect } from 'react';
import './ToastModal.css';

const ToastModal = ({ message, type = 'info', isOpen, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div className={`toast-modal ${type}`}>
      <div className="toast-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default ToastModal;