import React from 'react';
import './ErrorModal.css';

const ErrorModal = ({ isOpen, onClose, message = 'An error occurred.' }) => {
  if (!isOpen) return null;

  return (
    <div className="error-modal" role="alert" aria-live="assertive">
      <div className="accent" aria-hidden="true"></div>
      <svg className="x-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="#F45B69" strokeWidth="2" />
        <path d="M8 8L16 16" stroke="#F45B69" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 8L8 16" stroke="#F45B69" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="message">{message}</div>
      <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
        <svg className="close-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4l10 10M14 4L4 14" stroke="#F45B69" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

export default ErrorModal;

