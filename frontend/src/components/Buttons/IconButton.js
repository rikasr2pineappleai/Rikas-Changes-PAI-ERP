import React from 'react';
import './IconButton.css';

const IconButton = ({ icon, onClick, title }) => {
  return (
    <button className="icon-button" onClick={onClick} title={title}>
      {icon}
    </button>
  );
};

export default IconButton;

