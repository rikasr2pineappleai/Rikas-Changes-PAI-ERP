import React from 'react';
import { useNavigate } from "react-router-dom";
import './ActionButton.css';

import plusicon from "../../assets/icons/+icon.png"; // ensure correct path

const ActionButton = ({ children, onClick, label = "New Employee" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();   // optional custom click
    } else {
      navigate("/employees/new"); // default behavior
    }
  };

  return (
    <button
      type="button"
      className="Action_btn"
      onClick={handleClick}
      aria-label={label}
    >
      <img src={plusicon} alt="plus icon" className="plus-icon" />
      <span className="action-btn-text">{label}</span>
      {children}
    </button>
  );
};

export default ActionButton;

