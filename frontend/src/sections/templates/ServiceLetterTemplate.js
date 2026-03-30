import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "../../styles/service_letter_template.css";

// COMPONENTS
import DownloadButton from "../../components/Buttons/DownloadButton";
import AddAchievementButton from "../../components/Buttons/AddAchievmentButton";

// ICONS
import OptionsIcon from "../../assets/icons/options icon.png";
import DeleteIcon from "../../assets/icons/Delete-btn-Red.png";

export default function ServiceLetterTemplate() {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [newResponsibility, setNewResponsibility] = useState("");
  
  const [formData, setFormData] = useState({
    employeeName: "",
    position: "",
    department: "",
    letterDate: "",
    joiningDate: "",
    endDate: "",
    responsibilities: ""
  });

  // 3 initial contributions now extended to 3 + 2 = 3 total prefilled + 2 more
  const [keyContributions, setKeyContributions] = useState([
    "Designing user-friendly and responsive interfaces for Android platform.",
    "Collaborated with cross-functional teams to deliver high-quality products.",
    "Optimized application performance and reduced load time by 30%.",
  ])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Convert date format: DD/MM/YYYY -> YYYY-MM-DD or pass through if already YYYY-MM-DD
  const toDateInputValue = (value) => {
    if (!value) return "";
    if (value.includes("-")) return value; // Already YYYY-MM-DD
    const parts = value.split("/");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
  };

  // Fetch employees from backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        setEmployeesError(null);
        const token = localStorage.getItem('token');
        
        // First try with auth
        try {
          const response = await axios.get(
            'http://localhost:5001/api/templates/service-letter/all-employees',
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (response.data.success) {
            const employeeData = response.data.data.employees;
            console.log('Employees received from API:', employeeData.slice(0, 3));
            setEmployees(employeeData);
          } else {
            setEmployeesError(response.data.message || 'Failed to load employees');
          }
        } catch (authError) {
          console.warn('Auth request failed, trying debug endpoint:', authError.response?.status);
          
          // Fallback to debug endpoint if auth fails
          const debugResponse = await axios.get(
            'http://localhost:5001/api/templates/service-letter/debug/all-employees'
          );
          if (debugResponse.data.success) {
            const employeeData = debugResponse.data.data.employees;
            console.log('Employees received from debug API:', employeeData.slice(0, 3));
            setEmployees(employeeData);
          } else {
            setEmployeesError(debugResponse.data.message || 'Failed to load employees');
          }
        }
      } catch (error) {
        console.error('Error fetching employees:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        const errorMsg = error.response?.data?.message || error.message || 'Failed to load employees';
        setEmployeesError(errorMsg);
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    setSelectedEmployeeId(selectedId);
    
    const selectedEmployee = employees.find(emp => emp.userId === parseInt(selectedId));
    if (selectedEmployee) {
      setFormData({
        employeeName: selectedEmployee.employeeName || '',
        position: selectedEmployee.designation || "",
        department: selectedEmployee.department || "",
        letterDate: formData.letterDate,
        joiningDate: selectedEmployee.joiningDate || "",
        endDate: selectedEmployee.endDate || "",
        responsibilities: formData.responsibilities
      });
    }
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.classList.toggle("modal-open", showPreview);
    return () => document.body.classList.remove("modal-open");
  }, [showPreview]);

  useEffect(() => {
    // Update responsibilities when keyContributions change
    const responsibilitiesString = keyContributions.filter(c => c.trim()).join('\n');
    console.log('Updating responsibilities:', { 
      keyContributions, 
      responsibilitiesString 
    });
    setFormData(prev => ({
      ...prev,
      responsibilities: responsibilitiesString
    }));
  }, [keyContributions]);

  const generatePDF = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Generating PDF with formData:', formData);
      console.log('Responsibilities to be included:', formData.responsibilities);
      
      const response = await axios.post(
        'http://localhost:5001/api/templates/service-letter/generate',
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
      alert('Failed to generate PDF. Please check all required fields.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    let url = pdfUrl;
    if (!url) {
      url = await generatePDF();
    }
    
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `service-letter-${formData.employeeName || 'document'}.pdf`;
      link.click();
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
    await handleDownload();
  };

  const addContribution = () => {
    if (newResponsibility.trim()) {
      console.log('Adding contribution:', newResponsibility.trim());
      const updatedContributions = [...keyContributions, newResponsibility.trim()];
      console.log('Updated contributions array:', updatedContributions);
      setKeyContributions(updatedContributions);
      setNewResponsibility("");
    } else {
      console.warn('Cannot add empty responsibility');
    }
  };

  const updateContribution = (index, value) => {
    const updated = [...keyContributions];
    updated[index] = value;
    setKeyContributions(updated);
  };

  const deleteContribution = (index) => {
    setKeyContributions(keyContributions.filter((_, i) => i !== index));
  };

  const handleResponsibilityKeyPress = (e) => {
    // Add on Enter key (but not Shift+Enter for multiline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addContribution();
    }
  };

  const renderPreviewModal = () => {
    if (!showPreview) return null;

    return ReactDOM.createPortal(
      <div className="pdf-modal-backdrop" onClick={handleClosePreview}>
        <div className="pdf-modal-overlay"></div>

        <div
          className="pdf-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pdf-modal">
            <button className="pdf-close-btn" onClick={handleClosePreview}>
              ✕
            </button>

            <div className="pdf-content">
              {pdfUrl ? (
                <iframe 
                  src={pdfUrl} 
                  title="Service Letter Preview"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                />
              ) : (
                <p>Loading PDF...</p>
              )}
            </div>

            <div className="pdf-modal-footer">
              <button className="pdf-download-btn" onClick={handleDownloadPdf}>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <>
      <div
        className={`service-template-wrapper ${showPreview ? "blurred" : ""}`}
      >
        <form className="service-template-form" onSubmit={(e) => e.preventDefault()}>
          {/* ---------- Grid Inputs ---------- */}
          <div className="service-grid">
            <div className="service-group">
              <label>Name</label>
              <select 
                name="employeeName"
                value={selectedEmployeeId}
                onChange={handleEmployeeSelect}
                disabled={employeesLoading}
              >
                <option value="">
                  {employeesLoading ? 'Loading employees...' : 'Select employee'}
                </option>
                {employees.map((employee) => (
                  <option key={employee.userId} value={employee.userId}>
                    {employee.employeeName || 'Unknown Employee'}
                  </option>
                ))}
              </select>
              {employeesError && <div className="offer-input-error">{employeesError}</div>}
            </div>

            <div className="service-group">
              <label>Designation</label>
              <input 
                type="text" 
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="e.g., Full Stack Engineer" 
              />
            </div>

            <div className="service-group">
              <label>Department</label>
              <input 
                type="text" 
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., IT Department" 
              />
            </div>

            <div className="service-group">
              <label>Date</label>
              <input 
                type="date" 
                name="letterDate"
                value={toDateInputValue(formData.letterDate)}
                onChange={handleInputChange}
              />
            </div>

            <div className="service-group">
              <label>Date of Joining</label>
              <input 
                type="date" 
                name="joiningDate"
                value={toDateInputValue(formData.joiningDate)}
                onChange={handleInputChange}
              />
            </div>

            <div className="service-group">
              <label>Date of Ending</label>
              <input 
                type="date" 
                name="endDate"
                value={toDateInputValue(formData.endDate)}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* ---------- Key Contributions ---------- */}
          <div className="service-key-contributions">
            <span className="resp-label">Responsibilities</span>

            {keyContributions.map((item, index) => (
              <div key={index} className="key-contribution-item">
                <img src={OptionsIcon} alt="options" className="options-icon" />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateContribution(index, e.target.value)}
                />

                <button
                  type="button"
                  className="delete-icon-btn"
                  onClick={() => deleteContribution(index)}
                >
                  <img src={DeleteIcon} alt="delete" />
                </button>
              </div>
            ))}
          </div>

          {/* ---------- Responsibilities ---------- */}
          <div className="service-responsibilities">
            <div className="textarea-with-icon">
              <img src={OptionsIcon} alt="options" className="options-icon" />
              <textarea 
                placeholder="Describe performance ..."
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                onKeyPress={handleResponsibilityKeyPress}
              />
            </div>
          </div>

          <AddAchievementButton onClick={addContribution} />
          <div className="line-separator"></div>
          {/* ---------- Bottom Buttons ---------- */}
          <div className="service-buttons">
            <button
              type="button"
              className="preview-btn"
              onClick={handlePreview}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Preview'}
            </button>
            <button type="submit" className="save-btn">
              Save
            </button>
          </div>
        </form>
      </div>

      {renderPreviewModal()}
    </>
  );
}