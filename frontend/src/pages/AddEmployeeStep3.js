import React, { useRef, useState, useEffect } from "react";
import "../styles/add_employee_step3.css";
import { useNavigate } from "react-router-dom";
import employeeAPI from "../integration/employeeAPI"; // Import the employee API
import { useEmployeeForm, actionTypes } from "../context/EmployeeFormContext";
import { clearEmployeeFormData } from "../utils/employeeFormUtils";

// Local icons (place these PNGs in src/assets/icons/)
import backIcon from "../assets/icons/back.png";
import uploadIcon from "../assets/icons/upload.png";
import calendarIcon from "../assets/icons/calender.png";
import dropdownIcon from "../assets/icons/dropdown.png";
import successIcon from "../assets/icons/success.png";
import closeIcon from "../assets/icons/Close.png";
import infoIcon from "../assets/icons/inicon.png"; // Added info icon

const DESIGNATION_OPTIONS = [
  "UI/UX Engineer",
  "QA Engineer",
  "Full Stack Engineer",
  "Back end Developer",
  "Mobile App Developer",
  "React Developer",
];

const MANAGEMENT_ROLE_OPTIONS = [
  "CMO",
  "PM",
  "Senior",
  "Team Leader",
  "Associate",
  "Intern",
];

export default function AddEmployeeStep3() {
  const navigate = useNavigate();
  const joinDateRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const {
    step3Data = {
      nic: null,
      birthCertificate: null,
      educationCertificate: null,
      transcript: null,
      joinDate: "",
      designation: "",
      role: "",
      managementRole: "",
      reportingManager: "",
    },
    dispatch,
  } = useEmployeeForm();

  // Initialize form data with step3Data values
  const [formData, setFormData] = useState(() => ({
    nic: null,
    birthCertificate: null,
    educationCertificate: null,
    transcript: null,
    joinDate: "",
    designation: "",
    role: "",
    managementRole: "",
    reportingManager: "",
    // Merge with step3Data if available
    ...(step3Data || {}),
  }));

  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [reportingManagerLoading, setReportingManagerLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Fetch all employees for reporting manager dropdown - only runs once
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setReportingManagerLoading(true);
        const response = await employeeAPI.getAllEmployees(1, 100); // Fetch first 100 employees
        if (response.success) {
          // Filter out terminated employees and map to the format we need
          const activeEmployees = response.data.employees.filter(
            (emp) => emp.status !== "terminated"
          );
          setEmployees(activeEmployees);
        } else {
          console.error("Failed to fetch employees:", response.message);
          setEmployees([]);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        // Check if it's a network error
        if (
          error.message &&
          (error.message.includes("Network error") ||
            error.message.includes("Unable to connect"))
        ) {
          console.warn(
            "Could not fetch employees list due to network issues. Form will continue to work but reporting manager selection may be limited."
          );
        }
        setEmployees([]);
      } finally {
        setReportingManagerLoading(false);
      }
    };

    fetchEmployees();
  }, []); // Empty dependency array - only run once

  // Update form data when step3Data changes
  useEffect(() => {
    if (step3Data) {
      setFormData((prev) => {
        let hasChanges = false;

        // Compare each field individually
        for (const key in step3Data) {
          if (step3Data.hasOwnProperty(key)) {
            if (typeof step3Data[key] === "object" && step3Data[key] !== null) {
              // For objects (like file objects), compare by reference
              if (prev[key] !== step3Data[key]) {
                hasChanges = true;
                break;
              }
            } else {
              // For primitive values, compare directly
              if (prev[key] !== step3Data[key]) {
                hasChanges = true;
                break;
              }
            }
          }
        }

        if (hasChanges) {
          return { ...prev, ...step3Data };
        }
        return prev; // Return previous state if no changes
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step3Data?.joinDate,
    step3Data?.designation,
    step3Data?.role,
    step3Data?.managementRole,
    step3Data?.reportingManager,
    step3Data?.nic,
    step3Data?.birthCertificate,
    step3Data?.educationCertificate,
    step3Data?.transcript,
  ]);

  const handleFile = (e) => {
    const { name, files } = e.target;
    const file = files && files[0] ? files[0] : null;
    
    if (file) {
      // Validate file type - only allow PDF and image files
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      
      // Check if it's an image or PDF
      const isImage = validImageTypes.includes(file.type);
      const isPDF = file.type === "application/pdf";
      
      if (!isImage && !isPDF) {
        alert("Unsupported file type. Please upload a PDF or image file only.");
        e.target.value = ""; // Clear the input to prevent the invalid file from being stored
        return;
      }
    }
    
    // Validate file size (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (file && file.size > MAX_FILE_SIZE) {
      alert("File size exceeds limit. Maximum file size is 10MB.");
      e.target.value = ""; // Clear the file input
      setErrors((prev) => ({ 
        ...prev, 
        [name]: "File size exceeds limit (10MB maximum)" 
      }));
      return;
    }
    
    setFormData((p) => ({ ...p, [name]: file }));

    // Update the context with the changed data
    dispatch({
      type: actionTypes.SET_STEP3_DATA,
      payload: { [name]: file },
    });

    // Clear error when user selects a file
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));

    // Update the context with the changed data
    dispatch({
      type: actionTypes.SET_STEP3_DATA,
      payload: { [name]: value },
    });

    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const err = {};
    if (!formData.nic) err.nic = "Upload NIC document";
    if (!formData.birthCertificate)
      err.birthCertificate = "Upload Birth Certificate";
    if (!formData.educationCertificate)
      err.educationCertificate = "Upload Educational Certificate";
    // Transcript is optional (not required for non-graduates or current students)
    if (!formData.joinDate) err.joinDate = "Select Date of Joining";
    if (!formData.designation) err.designation = "Select Designation";
    if (!formData.role) err.role = "Select Role";
    if (!formData.managementRole) err.managementRole = "Select Management Role";
    if (!formData.reportingManager)
      err.reportingManager = "Select Reporting Manager";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const uploadDocument = async (employeeId, file, documentType) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("document", file);
    formData.append("document_type", documentType);

    try {
      const response = await employeeAPI.uploadEmployeeDocument(
        employeeId,
        formData
      );
      if (!response.success) {
        throw new Error(response.message || `Failed to upload ${documentType}`);
      }
      return response;
    } catch (error) {
      // Check if this is an authentication error
      if (
        error.message &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("log in again"))
      ) {
        // Don't re-throw authentication errors here, let the main handler deal with them
        throw new Error("Session expired. Please log in again.");
      }
      throw error;
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      alert("Please fill all mandatory fields correctly.");
      return;
    }

    // Check if user is still authenticated before starting the process
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      window.location.href = "/login";
      return;
    }

    const employeeId = sessionStorage.getItem("newEmployeeId");
    if (!employeeId) {
      alert("Employee ID not found. Please start the process again.");
      navigate("/employees/new");
      return;
    }

    setLoading(true);
    try {
      // Update context with the latest data before saving
      dispatch({
        type: actionTypes.SET_STEP3_DATA,
        payload: { ...formData },
      });

      // Upload all documents
      await uploadDocument(employeeId, formData.nic, "nic");
      await uploadDocument(
        employeeId,
        formData.birthCertificate,
        "birth_certificate"
      );
      await uploadDocument(
        employeeId,
        formData.educationCertificate,
        "educational_certificate"
      );
      // Transcript is optional - only upload if provided
      if (formData.transcript) {
        await uploadDocument(employeeId, formData.transcript, "transcript");
      }

      // Set work information - send data as validated by the UI
      const workInfoData = {
        joined_date: formData.joinDate, // This should be properly validated in UI
        designation: formData.designation.trim(), // This should be properly validated in UI
        role: formData.role,
        department_id: null, // No department field in form, setting to null
        management_role: formData.managementRole
          ? formData.managementRole.trim()
          : null,
        report_to: formData.reportingManager
          ? parseInt(formData.reportingManager)
          : null,
      };

      console.log("Sending work info data:", workInfoData);
      console.log("Form data managementRole:", formData.managementRole);

      const workResponse = await employeeAPI.setEmployeeWorkInfo(
        employeeId,
        workInfoData
      );

      if (workResponse.success) {
        // Success → show popup → then go to Employees list
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);

          // Clear the stored form data since employee creation is complete
          clearEmployeeFormData();

          navigate("/employees");
        }, 2000);
      } else {
        alert(workResponse.message || "Failed to save work information");
      }
    } catch (error) {
      console.error("Error saving employee data:", error);

      // Check if this is an authentication error that would cause logout
      if (
        error.message &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("log in again"))
      ) {
        alert("Session expired. Please log in again.");
        // Redirect to login page
        window.location.href = "/login";
        return; // Exit early to prevent further processing
      }

      // Check if it's a validation error from the backend
      if (error.response) {
        console.log("Error response:", error.response); // Log for debugging
        alert(
          `Server error: ${
            error.response.data.message ||
            error.response.data.error ||
            "Failed to save work information"
          }`
        );
      } else {
        alert(
          "An error occurred while saving employee data: " +
            (error.message || "Unknown error")
        );
      }
    } finally {
      setLoading(false);

      // Clear the employee ID from session storage after successful save
      sessionStorage.removeItem("newEmployeeId");
    }
  };

  return (
    <div className="add-employee-step3">
      {/* ===== Header ===== */}
      <div className="employee-header">
        <div
          className="header-left"
          onClick={() => {
            // Update context with the latest data before navigating back
            dispatch({
              type: actionTypes.SET_STEP3_DATA,
              payload: { ...formData },
            });
            navigate("/employees/step2");
          }}
        >
          <img src={backIcon} alt="Back" className="back-icon" />
          <h2>New Employee</h2>
        </div>

        <div className="pagination">
          <div className="circle done">1</div>
          <div className="line active"></div>
          <div className="circle done">2</div>
          <div className="line active"></div>
          <div className="circle active">3</div>
        </div>
      </div>

      {/* ===== Document Upload ===== */}
      <div className="info-box">
        <div className="info-header">
          <h3>Document Upload</h3>
        </div>
        <hr />

        <div className="upload-grid">
          {/* NIC */}
          <div className="upload-col">
            <div className="nic-header-row">
              <label className="upload-title">NIC</label>
              <div className="mandatory-row">
                <img src={infoIcon} alt="info" className="info-icon" />
                <div className="mandatory-pill">
                  Both sides of NIC required.
                </div>
              </div>
            </div>

            <label className="upload-field">
              <img src={uploadIcon} alt="upload" />
              <span>
                {formData.nic ? formData.nic.name : "Upload NIC document"}
              </span>
              <input
                type="file"
                name="nic"
                accept=".pdf"
                onChange={handleFile}
                hidden
              />
            </label>

            <small className="pdf-note">* Upload PDF only</small>
            {errors.nic && <small className="error">{errors.nic}</small>}
          </div>

          {/* Birth Certificate */}
          <div className="upload-col">
            <div className="nic-header-row">
              <label className="upload-title">Birth Certificate</label>
              <div className="mandatory-row">
                <img src={infoIcon} alt="info" className="info-icon" />
                <div className="mandatory-pill">
                  Both sides of Birth Certificate required.
                </div>
              </div>
            </div>

            <label className="upload-field">
              <img src={uploadIcon} alt="upload" />
              <span>
                {formData.birthCertificate
                  ? formData.birthCertificate.name
                  : "Upload Birth Certificate"}
              </span>
              <input
                type="file"
                name="birthCertificate"
                accept=".pdf"
                onChange={handleFile}
                hidden
              />
            </label>

            <small className="pdf-note">* Upload PDF only</small>
            {errors.birthCertificate && (
              <small className="error">{errors.birthCertificate}</small>
            )}
          </div>

          {/* Educational Certificate */}
          <div className="upload-col">
            <label className="upload-title">Educational Certificate</label>

            <label className="upload-field">
              <img src={uploadIcon} alt="upload" />
              <span>
                {formData.educationCertificate
                  ? formData.educationCertificate.name
                  : "Upload Educational Certificate"}
              </span>
              <input
                type="file"
                name="educationCertificate"
                accept=".pdf"
                onChange={handleFile}
                hidden
              />
            </label>

            <small className="pdf-note">* Upload PDF only</small>
            {errors.educationCertificate && (
              <small className="error">{errors.educationCertificate}</small>
            )}
          </div>

          {/* Transcript */}
          <div className="upload-col">
            <label className="upload-title">
              Transcript
              <span style={{ fontSize: "14px", color: "#979494", fontWeight: "normal", marginLeft: "6px" }}>
                (Optional)
              </span>
            </label>

            <label className="upload-field">
              <img src={uploadIcon} alt="upload" />
              <span>
                {formData.transcript
                  ? formData.transcript.name
                  : "Upload Transcript (Optional)"}
              </span>
              <input
                type="file"
                name="transcript"
                accept=".pdf"
                onChange={handleFile}
                hidden
              />
            </label>

            <small className="pdf-note" style={{ color: "#979494" }}>* Optional - Upload PDF only if available</small>
            {errors.transcript && (
              <small className="error">{errors.transcript}</small>
            )}
          </div>
        </div>
      </div>

      {/* ===== Work Information ===== */}
      <div className="info-box">
        <div className="info-header">
          <h3>Work Information</h3>
        </div>
        <hr />

        <div className="work-grid">
          {/* Date of Joining */}
          <div className="form-group">
            <label>Date of Joining</label>
            <div className="input-icon">
              <input
                ref={joinDateRef}
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
              />
              <img
                src={calendarIcon}
                alt="calendar"
                className="calendar-icon"
                onClick={() =>
                  joinDateRef.current && joinDateRef.current.showPicker()
                }
              />
            </div>
            {errors.joinDate && (
              <small className="error">{errors.joinDate}</small>
            )}
          </div>

          {/* Designation */}
          <div className="form-group">
            <label>Designation</label>
            <div className="select-box">
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
              >
                <option value="">Select Designation</option>
                {DESIGNATION_OPTIONS.map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
              <img
                src={dropdownIcon}
                alt="dropdown"
                className="dropdown-icon"
              />
            </div>
            {errors.designation && (
              <small className="error">{errors.designation}</small>
            )}
          </div>

          {/* Role */}
          <div className="form-group">
            <label>Role</label>
            <div className="select-box">
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
              <img
                src={dropdownIcon}
                alt="dropdown"
                className="dropdown-icon"
              />
            </div>
            {errors.role && <small className="error">{errors.role}</small>}
          </div>

          {/* Management Role */}
          <div className="form-group">
            <label>Management Role</label>
            <div className="select-box">
              <select
                name="managementRole"
                value={formData.managementRole}
                onChange={handleChange}
              >
                <option value="">Select Management Role</option>
                {MANAGEMENT_ROLE_OPTIONS.map((managementRole) => (
                  <option key={managementRole} value={managementRole}>
                    {managementRole}
                  </option>
                ))}
              </select>
              <img
                src={dropdownIcon}
                alt="dropdown"
                className="dropdown-icon"
              />
            </div>
            {errors.managementRole && (
              <small className="error">{errors.managementRole}</small>
            )}
          </div>

          {/* Reporting Manager */}
          <div className="form-group">
            <label>Reporting Manager</label>
            <div className="select-box">
              <select
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleChange}
                disabled={reportingManagerLoading}
              >
                <option value="">Select Reporting Manager</option>
                {reportingManagerLoading ? (
                  <option value="">Loading employees...</option>
                ) : (
                  employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name} (ID:{" "}
                      {employee.emp_id || employee.id})
                    </option>
                  ))
                )}
              </select>
              <img
                src={dropdownIcon}
                alt="dropdown"
                className="dropdown-icon"
              />
            </div>
            {errors.reportingManager && (
              <small className="error">{errors.reportingManager}</small>
            )}
          </div>
        </div>

        <div className="button-row">
          <button
            className="cancel-btn"
            onClick={() => navigate("/employees")}
            disabled={loading}
          >
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* ===== Success Popup ===== */}
      {showPopup && (
        <div className="success-popup">
          <div className="left-bar"></div>
          <img src={successIcon} alt="success" className="success-icon" />
          <span>Employee record submitted successfully.</span>
          <img
            src={closeIcon}
            alt="close"
            className="close-popup"
            onClick={() => setShowPopup(false)}
          />
        </div>
      )}
    </div>
  );
}
