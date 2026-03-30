import React from 'react';
import '../../components/Buttons/ViewmoreButton.css';
import vmicon from "../../assets/icons/vmicon.png";

const VMButton = ({ children, onClick, label = "Veiw more" }) => {
  return (
    <button
      type="button"
      className="vm-button"
      onClick={onClick}
      aria-label={label}
    >
      {children}
      <img src={vmicon} alt="vm icon" className="vm-icon" />
      <span className="vm-btn-text">{label}</span>
  
    </button>
  );
};

export default VMButton;