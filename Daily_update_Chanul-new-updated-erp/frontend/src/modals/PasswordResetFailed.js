import React, { useEffect } from 'react';
import './PasswordResetFailed.css';
import circleRedIcon from '../assets/icons/circle_red.png';

const PasswordResetFailed = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="password-reset-failed-overlay">
      <div className="password-reset-failed-modal" role="alert" aria-live="polite">
        {/* Close Button */}
        <button
          type="button"
          className="password-failed-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="#1E293B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Icon Frame - Red Circle with X */}
        <div className="password-failed-icon-frame">
          <img src={circleRedIcon} alt="Failed" className="password-failed-circle-icon" />
        </div>

        {/* Title */}
        <h2 className="password-failed-title">
          Password Reset<br />Failed
        </h2>
      </div>
    </div>
  );
};

export default PasswordResetFailed;

