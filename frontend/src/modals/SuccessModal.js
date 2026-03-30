import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, message = 'Leave request was submitted successfully.' }) => {
  if (!isOpen) return null;

  return (
    <div className="success-modal" role="alert" aria-live="polite">
      <div className="accent" aria-hidden="true"></div>
      <svg className="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="#347E45" strokeWidth="2" />
        <path d="M7 12l3 3 7-7" stroke="#347E45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="message">{message}</div>
      <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
        <svg className="close-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4l10 10M14 4L4 14" stroke="#347E45" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

export default SuccessModal;
