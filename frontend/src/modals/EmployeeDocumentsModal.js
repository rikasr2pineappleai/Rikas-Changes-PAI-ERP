import React from "react";
import "../styles/EmployeeDocumentsModal.css";

const EmployeeDocumentsModal = ({ isOpen, onClose, documents, employeeName }) => {
  if (!isOpen) return null;

  // Filter documents to show only the LATEST of each type
  const getLatestDocuments = () => {
    if (!documents || documents.length === 0) return [];
    
    // Group documents by type
    const groupedDocs = {};
    documents.forEach(doc => {
      const docType = doc.document_type || doc.type;
      if (!groupedDocs[docType]) {
        groupedDocs[docType] = [];
      }
      groupedDocs[docType].push(doc);
    });
    
    // For each type, get the latest document (highest ID)
    const latestDocs = [];
    Object.values(groupedDocs).forEach(typeDocs => {
      const latest = typeDocs.reduce((max, current) => 
        current.id > max.id ? current : max
      );
      latestDocs.push(latest);
    });
    
    console.log('📄 Filtering documents - Total:', documents.length, '→ Latest only:', latestDocs.length);
    return latestDocs;
  };

  const latestDocuments = getLatestDocuments();

  const getDocumentType = (type) => {
    if (!type || type.trim() === '') {
      return 'Document';
    }
    const normalizedType = type.toLowerCase().trim();
    const types = {
      nic: "NIC",
      birth: "Birth Certificate",
      birth_certificate: "Birth Certificate",
      birthcertificate: "Birth Certificate",
      edu: "Educational Certificate",
      educational_certificate: "Educational Certificate",
      educationalcertificate: "Educational Certificate",
      transcript: "Transcript",
      ol: "O/L Certificate",
      al: "A/L Certificate",
    };
    // Return the mapped type or capitalize the first letter of each word in the type
    return types[normalizedType] || type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleViewDocument = (doc) => {
    const baseUrl = "http://localhost:5001";
    // Ensure file_path starts with uploads/
    let filePath = doc.file_path;
    if (!filePath.startsWith("uploads/")) {
      filePath = "uploads/" + filePath;
    }
    const fullUrl = `${baseUrl}/${filePath}`;
    console.log("Opening document:", fullUrl);
    window.open(fullUrl, "_blank");
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
          {!latestDocuments || latestDocuments.length === 0 ? (
            <p className="emp-docs-no-data">No documents uploaded for this employee.</p>
          ) : (
            <div className="emp-docs-list">
              {latestDocuments.map((doc) => {
                const docType = getDocumentType(doc.document_type);
                const fileName = doc.file_path ? doc.file_path.split('/').pop() : 'unknown.pdf';
                console.log(`Rendering document:`, JSON.stringify({ 
                  id: doc.id, 
                  document_type: doc.document_type, 
                  file_path: doc.file_path,
                  display_name: docType,
                  file_name: fileName
                }, null, 2));
                return (
                  <div key={doc.id} className="emp-docs-item">
                    <div className="emp-docs-item-info">
                      <span className="emp-docs-item-type">{docType}</span>
                      <span className="emp-docs-item-filename">{fileName}</span>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDocumentsModal;