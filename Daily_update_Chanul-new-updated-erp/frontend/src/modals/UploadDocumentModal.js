import React, { useState } from 'react';
import './UploadDocumentModal.css';

const UploadDocumentModal = ({ isOpen, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Upload Document</h3>
        <div className="upload-area">
          <input type="file" onChange={handleFileChange} />
          {selectedFile && <p>Selected: {selectedFile.name}</p>}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-upload" onClick={handleUpload} disabled={!selectedFile}>
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;

