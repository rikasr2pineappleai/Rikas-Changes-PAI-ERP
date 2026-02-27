import React from 'react';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete {itemName}?</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

