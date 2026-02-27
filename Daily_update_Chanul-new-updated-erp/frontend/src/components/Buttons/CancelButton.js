import React from 'react';
import './CancelButton.css';

const CancelButton = ({ children, onClick }) => {
  return (
    <button className="cancel-button" onClick={onClick}>
      {children}
    </button>
  );
};

export default CancelButton;

