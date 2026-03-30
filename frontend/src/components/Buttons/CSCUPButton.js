
import React from 'react';
import '../../components/Buttons/CSUPButton.css';

const CSUPButton = ({ children, onClick, label = "" }) => {
  return (
    <button
      type="button"
      className="csup-button"
      onClick={onClick}
      aria-label={label}
    >
      {children}
      <span className="csup-btn-text">{label}</span>
    </button>
  );
};

export default CSUPButton;