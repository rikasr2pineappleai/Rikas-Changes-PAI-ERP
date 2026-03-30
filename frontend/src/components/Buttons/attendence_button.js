import React from "react";
import '../Buttons/attendenceButton.css';
import atticon from '../../assets/icons/attendenceicon.png';

const AttendanceButton = ({ children, onClick, label = "Attendance", disabled = false }) => {
  return (
    <button
      type="button"
      className="attendance-button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
    >
      <img src={atticon} alt="" className="attendance-icon" />
      <span className="attendance-text">{label}</span>
      {children}
    </button>
  );
};

export default AttendanceButton;
