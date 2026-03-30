import React from "react";
import '../Buttons/rulesandregulations.css';
import atticon from '../../assets/icons/rulesandregulationsicon.png';

const AttendanceButton = ({ children, onClick, label = "rules and regulations", disabled = false }) => {
  return (
    <button
      type="button"
      className="rules-and-regulations-button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      <img src={atticon} alt="" className="rules-and-regulations-icon" />
      <span className="rules-and-regulations-text">{label}</span>
      {children}
    </button>
  );
};

export default AttendanceButton;
