// Toast Modal Component
import React from "react";
import closeIcon from "../../assets/icons/closeicon.png";

// Toast Modal Component
export default function ToastModal({
  isOpen,
  message,
  type = "error",
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-leftBar" />

      <div className="toast-content">
        <span className="toast-icon">✕</span>
        <span className="toast-message">{message}</span>
      </div>

      <button className="toast-closeBtn" onClick={onClose}>
        <img src={closeIcon} alt="close" />
      </button>
    </div>
  );
}