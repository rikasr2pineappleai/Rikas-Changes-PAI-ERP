
import React from "react";
import '../Buttons/Submit_button.css';

const SubmitButton = ({ children, onClick, label = "Submit" }) => {
  return (
    <button
      type="submit"
      className="submit-button"
      onClick={onClick}
      aria-label={label}
    >
      {children}
      <span className="submit-btn-text">{label}</span>
    </button>
  );
};

export default SubmitButton;
