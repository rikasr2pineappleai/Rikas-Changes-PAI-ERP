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
      <span>{message}</span>
    </div>
  );
};

export default ToastModal;

