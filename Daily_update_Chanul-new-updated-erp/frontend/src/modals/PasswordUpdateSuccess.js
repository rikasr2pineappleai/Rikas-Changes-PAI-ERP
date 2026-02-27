import React from 'react';
import './PasswordUpdateSuccess.css';
import checkIcon from '../assets/icons/check.png';
import circleIcon from '../assets/icons/circle.png';

const PasswordUpdateSuccess = ({ isOpen, onClose, onBackToLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="password-update-success-overlay">
      <div className="password-update-success-modal" role="alert" aria-live="polite">
        {/* Close Button */}
        <button 
          type="button" 
          className="password-success-close-btn" 
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="#1E293B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Icon Frame - Circle with Check */}
        <div className="password-success-icon-frame">
          <img src={circleIcon} alt="Circle" className="password-success-circle-icon" />
          <img src={checkIcon} alt="Check" className="password-success-check-icon" />
        </div>

        {/* Title */}
        <h2 className="password-success-title">
          Password Updated Successfully
        </h2>

        {/* Back to Login Button */}
        <button 
          type="button" 
          className="password-success-button"
          onClick={onBackToLogin}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default PasswordUpdateSuccess;

