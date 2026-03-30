import React from 'react';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <p className="modal-message">Are you sure you want to delete {itemName}?</p>
        <div className="modal-actions">
          <button className="btn-yes" onClick={onConfirm}>Yes</button>
          <button className="btn-no" onClick={onClose}>No</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;