import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/offer_letter_template.css";

export default function OfferLetterTemplate() {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    employeeName: "",
    address: "",
    letterDate: "",
    position: "",
    joiningDate: "",
    endDate: "",
    department: "",
    reportingManager: "",
    reportingManagerEmail: "",
    salary: "",
    responsibilities: ""
  });

  const toDateInputValue = (value) => {
    if (!value) {
      return "";
    }
    if (value.includes("-")) {
      return value;
    }
    const parts = value.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return value;
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        setEmployeesError("");
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5001/api/templates/offer-letter/all-employees',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setEmployees(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployeesError('Failed to load employees');
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    setSelectedEmployeeId(selectedId);
    setPdfUrl(null);
    setValidationErrors(prev => ({ ...prev, employeeName: "" }));

    if (!selectedId) {
      setFormData(prev => ({
        ...prev,
        employeeName: "",
        address: "",
        position: "",
        joiningDate: "",
        department: "",
        reportingManager: "",
        reportingManagerEmail: ""
      }));
      return;
    }

    const selectedEmployee = employees.find(emp => String(emp.userId) === String(selectedId));
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employeeName: selectedEmployee.employeeName || "",
        address: selectedEmployee.address || "",
        position: selectedEmployee.position || "",
        joiningDate: toDateInputValue(selectedEmployee.joiningDate || ""),
        department: selectedEmployee.department || "",
        reportingManager: selectedEmployee.reportingManager || "",
        reportingManagerEmail: selectedEmployee.reportingManagerEmail || ""
      }));
      setValidationErrors(prev => ({
        ...prev,
        employeeName: "",
        address: "",
        position: "",
        joiningDate: "",
        department: "",
        reportingManager: "",
        reportingManagerEmail: ""
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setPdfUrl(null);
    setValidationErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      { name: "employeeName", message: "Name is required" },
      { name: "address", message: "Address is required" },
      { name: "letterDate", message: "Date is required" },
      { name: "position", message: "Role is required" },
      { name: "salary", message: "Salary is required" },
      { name: "joiningDate", message: "Date of Joining is required" },
      { name: "department", message: "Department is required" },
      { name: "reportingManager", message: "Reporting Manager is required" },
      { name: "reportingManagerEmail", message: "Reporting Manager Email is required" }
    ];

    requiredFields.forEach(({ name, message }) => {
      if (!String(formData[name] || "").trim()) {
        errors[name] = message;
      }
    });

    if (
      formData.reportingManagerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reportingManagerEmail)
    ) {
      errors.reportingManagerEmail = "Enter a valid Reporting Manager Email";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generatePDF = async () => {
    if (!validateForm()) {
      return null;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5001/api/templates/offer-letter/generate',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      return url;
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (error.response?.data instanceof Blob) {
        const errorText = await error.response.data.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.errors) {
            setValidationErrors(errorData.errors);
          }
          alert(errorData.message || 'Failed to generate PDF. Please check all required fields.');
        } catch {
          alert('Failed to generate PDF. Please check all required fields.');
        }
      } else {
        alert(error.response?.data?.message || 'Failed to generate PDF. Please check all required fields.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    const url = await generatePDF();
    if (url) {
      setShowPreview(true);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleDownloadPdf = async () => {
    let url = pdfUrl;
    if (!url) {
      url = await generatePDF();
    }
    
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `offer-letter-${formData.employeeName || 'document'}.pdf`;
      link.click();
    }
  };

  

  return (
    <>
      <div className="offer-template-wrapper">
        {/* ---------- Header ---------- */}
        <div className="offer-template-header">
          <h3 className="offer-template-title">Offer Letter</h3>
        </div>

        {/* ---------- Form ---------- */}
        <form className="offer-template-form" onSubmit={(e) => e.preventDefault()}>
          <div className="offer-grid">
            <div className="offer-group">
              <label>Name</label>
              <select
                name="employeeName"
                value={selectedEmployeeId}
                onChange={handleEmployeeSelect}
                disabled={employeesLoading}
                className={validationErrors.employeeName ? "offer-field-error" : ""}
              >
                <option value="">
                  {employeesLoading ? 'Loading employees...' : 'Select employee'}
                </option>
                {employees.map((employee) => (
                  <option key={employee.userId} value={employee.userId}>
                    {employee.employeeName}
                  </option>
                ))}
              </select>
              {employeesError && (
                <span className="offer-input-error">{employeesError}</span>
              )}
              {validationErrors.employeeName && (
                <span className="offer-input-error">{validationErrors.employeeName}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g., Inuvil, Jaffna" 
                className={validationErrors.address ? "offer-field-error" : ""}
              />
              {validationErrors.address && (
                <span className="offer-input-error">{validationErrors.address}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Date</label>
              <input 
                type="date" 
                name="letterDate"
                value={toDateInputValue(formData.letterDate)}
                onChange={handleInputChange}
                className={validationErrors.letterDate ? "offer-field-error" : ""}
              />
              {validationErrors.letterDate && (
                <span className="offer-input-error">{validationErrors.letterDate}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Role</label>
              <input 
                type="text" 
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="e.g., Software Engineer" 
                className={validationErrors.position ? "offer-field-error" : ""}
              />
              {validationErrors.position && (
                <span className="offer-input-error">{validationErrors.position}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Salary</label>
              <input 
                type="text" 
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                placeholder="e.g., LKR 100,000" 
                className={validationErrors.salary ? "offer-field-error" : ""}
              />
              {validationErrors.salary && (
                <span className="offer-input-error">{validationErrors.salary}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Date of Joining</label>
              <input 
                type="date" 
                name="joiningDate"
                value={toDateInputValue(formData.joiningDate)}
                onChange={handleInputChange}
                className={validationErrors.joiningDate ? "offer-field-error" : ""}
              />
              {validationErrors.joiningDate && (
                <span className="offer-input-error">{validationErrors.joiningDate}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Department</label>
              <input 
                type="text" 
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., IT Department" 
                className={validationErrors.department ? "offer-field-error" : ""}
              />
              {validationErrors.department && (
                <span className="offer-input-error">{validationErrors.department}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Reporting Manager</label>
              <input 
                type="text" 
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleInputChange}
                placeholder="e.g., John Doe" 
                className={validationErrors.reportingManager ? "offer-field-error" : ""}
              />
              {validationErrors.reportingManager && (
                <span className="offer-input-error">{validationErrors.reportingManager}</span>
              )}
            </div>

            <div className="offer-group">
              <label>Reporting Manager Email</label>
              <input 
                type="email" 
                name="reportingManagerEmail"
                value={formData.reportingManagerEmail}
                onChange={handleInputChange}
                placeholder="e.g., example@pineappleai.com" 
                className={validationErrors.reportingManagerEmail ? "offer-field-error" : ""}
              />
              {validationErrors.reportingManagerEmail && (
                <span className="offer-input-error">{validationErrors.reportingManagerEmail}</span>
              )}
            </div>
          </div>

          {/* ---------- Button Row ---------- */}
          <div className="offer-buttons">
            <button type="button" className="cancel-btn">Cancel</button>
            <button
              type="button"
              className="preview-btn"
              onClick={handlePreview}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Preview'}
            </button>
          </div>
        </form>

        {/* ---------- Bottom Actions ---------- */}
        <div className="offer-actions">
          <button 
            type="button" 
            className="download-btn"
            onClick={handleDownloadPdf}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Download'}
          </button>
          <button type="button" className="email-btn">Email</button>
          <button type="submit" className="save-btn">Save</button>
        </div>
      </div>

      {/* ================================================= */}
      {/* PDF PREVIEW MODAL                                 */}
      {/* ================================================= */}
      {showPreview && (
        <div className="pdf-modal-backdrop" onClick={handleClosePreview}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button className="pdf-close-btn" onClick={handleClosePreview}>
              ✕
            </button>

            {/* PDF Preview */}
            <div className="pdf-content">
              {pdfUrl ? (
                <iframe 
                  src={pdfUrl} 
                  title="Offer Letter Preview"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                />
              ) : (
                <p>Loading PDF...</p>
              )}
            </div>

            {/* Bottom-left Download */}
            <div className="pdf-modal-footer">
              <button
                className="pdf-download-btn"
                onClick={handleDownloadPdf}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
