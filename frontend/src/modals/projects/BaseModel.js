// Base Modal Component
import React from 'react';
import closeIcon from '../../assets/icons/closeicon.png';

// Base Modal Component
export default function BaseModal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div className="prj-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="prj-modalHeader">
          <div className="prj-modalTitle">{title}</div>
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close"><img src={closeIcon} alt="close" /></button>
        </div>
        <div className="prj-modalBody">{children}</div>
      </div>
    </div>
  );
}