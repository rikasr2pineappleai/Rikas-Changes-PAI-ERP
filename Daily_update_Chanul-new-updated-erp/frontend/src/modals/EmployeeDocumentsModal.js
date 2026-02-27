import React from "react";
import "../styles/EmployeeDocumentsModal.css";

const EmployeeDocumentsModal = ({ isOpen, onClose, documents, employeeName }) => {
  if (!isOpen) return null;

  const getDocumentType = (type) => {
    const types = {
      nic: "NIC",
      birth: "Birth Certificate",
      ol: "O/L Certificate",
      al: "A/L Certificate",
    };
    return types[type] || type;
  };

  const handleViewDocument = (doc) => {
    const apiBaseUrl = "http://localhost:5001/api";
    const baseUrl = apiBaseUrl.replace("/api", "");
    const filePath = doc.file_path.startsWith("uploads/")
      ? `${baseUrl}/${doc.file_path}`
      : `${baseUrl}/uploads/${doc.file_path}`;
    window.open(filePath, "_blank");
  };

  return (
    <div className="emp-docs-modal-overlay" onClick={onClose}>
      <div className="emp-docs-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="emp-docs-modal-header">
          <h3>Uploaded Documents - {employeeName}</h3>
          <button className="emp-docs-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="emp-docs-modal-body">
          {!documents || documents.length === 0 ? (
            <p className="emp-docs-no-data">No documents uploaded for this employee.</p>
          ) : (
            <div className="emp-docs-list">
              {documents.map((doc) => (
                <div key={doc.id} className="emp-docs-item">
                  <div className="emp-docs-item-info">
                    <span className="emp-docs-item-type">{getDocumentType(doc.document_type)}</span>
                    <span className="emp-docs-item-date">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="emp-docs-item-btn"
                    onClick={() => handleViewDocument(doc)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDocumentsModal;