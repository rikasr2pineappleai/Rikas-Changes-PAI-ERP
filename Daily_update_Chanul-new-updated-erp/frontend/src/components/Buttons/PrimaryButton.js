import React from 'react';
import './PrimaryButton.css';

const PrimaryButton = ({ children, onClick, disabled, type = 'button' }) => {
  return (
    <button
      type={type}
      className="primary-button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;

