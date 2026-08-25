import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "../../styles/service_letter_template.css";

const SERVICE_NAME_PATTERN =
  /^\p{L}[\p{L}\p{M}.]*(?: \p{L}[\p{L}\p{M}.]*)*$/u;

const validateServiceNameField = (value) => {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) return "Name is required";
  if (trimmedValue.length > 50) return "Name cannot exceed 50 characters";
  if (!SERVICE_NAME_PATTERN.test(trimmedValue)) {
    return "Name contains invalid characters. Use letters, periods, and single spaces only";
  }
  return "";
};

const REASON_OPTIONS = [
  "Applying for a New Job",
  "Employment Verification",
  "Visa / Immigration",
  "Higher Education",
  "Bank Loan Application",
  "Government Documentation",
  "Insurance Purpose",
  "Personal Record",
  "Other"
];

const COMPANY_DOCUMENTS_COL1 = [
  "Folder Structure Document",
  "API Document",
  "Figma",
  "Design Document",
  "Project Release Plan Document",
  "Test Plan Document",
  "Test Case Document",
  "Defect Tracker Sheet",
  "BRD Document",
  "Field Validation Document"
];

const COMPANY_DOCUMENTS_COL2 = [
  "Use Case Document",
  "PM Scrum Sheet",
  "Hosting Details Document"
];

const COMPANY_DOCUMENTS = [...COMPANY_DOCUMENTS_COL1, ...COMPANY_DOCUMENTS_COL2];

export default function ServiceLetterTemplate() {
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [dragIndex, setDragIndex] = useState(null);
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const dragOverIndex = useRef(null);

  // Section 1: Request Details
  const [requestDetails, setRequestDetails] = useState({
    employeeName: "",
    employeeId: "",
    requestedOn: "",
    reason: "",
    additionalDetails: ""
  });

  // Section 2: Documents Return Confirmation (default Figma and Design Document checked as in design)
  const [returnedDocs, setReturnedDocs] = useState({
    "Figma": true,
    "Design Document": true
  });

  // Section 3: Create Service Letter
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeEmail: "",
    position: "",
    department: "",
    letterDate: "",
    joiningDate: "",
    endDate: "",
    responsibilities: ""
  });

  const [keyContributions, setKeyContributions] = useState([
    "Designing user-friendly and responsive interfaces for Android platform.",
    "Designing user-friendly and responsive interfaces for Android platform.",
    "Designing user-friendly and responsive interfaces for Android platform."
  ]);

  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);

  /* ── helpers ───────────────────────────────────────────── */
  const normalizeName = (value) =>
    String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

  const findEmployeeByName = (name) => {
    const normalizedName = normalizeName(name);
    if (!normalizedName) return null;
    return employees.find((emp) => normalizeName(emp.employeeName) === normalizedName) || null;
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    if (value.includes("-")) return value;
    const parts = value.split("/");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
  };

  // Full DB employee selection auto-fill
  const handleEmployeeSelect = (emp) => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedEmployeeId(String(emp.userId));
    setShowEmpDropdown(false);

    // Auto-fill Section 1
    setRequestDetails((prev) => ({
      ...prev,
      employeeName: emp.employeeName,
      employeeId: emp.empId || (emp.userId ? `EMP-${String(emp.userId).padStart(3, "0")}` : prev.employeeId),
      requestedOn: prev.requestedOn || today
    }));

    // Auto-fill Section 3
    setFormData((prev) => ({
      ...prev,
      employeeName: emp.employeeName,
      employeeEmail: emp.employeeEmail || emp.email || prev.employeeEmail,
      position: emp.position || emp.designation || prev.position,
      department: emp.department || prev.department,
      letterDate: prev.letterDate || today,
      joiningDate: emp.joiningDate ? toDateInputValue(emp.joiningDate) : prev.joiningDate,
      endDate: emp.endDate ? toDateInputValue(emp.endDate) : prev.endDate
    }));

    setValidationErrors((prev) => ({
      ...prev,
      employeeName: "",
      position: "",
      department: "",
      joiningDate: "",
      endDate: ""
    }));
    setPdfUrl(null);
    setPreviewHtml("");
  };

  // Sync employeeName between section 1 and section 3
  const handleRequestDetailsChange = (e) => {
    const { name, value } = e.target;
    if (name === "employeeName") {
      const matchedEmployee = findEmployeeByName(value);
      setSelectedEmployeeId(matchedEmployee ? String(matchedEmployee.userId) : "");
      setShowEmpDropdown(true);
      setRequestDetails((prev) => ({ ...prev, employeeName: value }));
      setFormData((prev) => ({
        ...prev,
        employeeName: value,
        employeeEmail: matchedEmployee?.email || matchedEmployee?.employeeEmail || prev.employeeEmail,
        position: matchedEmployee?.designation || matchedEmployee?.position || prev.position,
        department: matchedEmployee?.department || prev.department,
        joiningDate: matchedEmployee?.joiningDate ? toDateInputValue(matchedEmployee.joiningDate) : prev.joiningDate,
        endDate: matchedEmployee?.endDate ? toDateInputValue(matchedEmployee.endDate) : prev.endDate
      }));
      setValidationErrors((prev) => ({ ...prev, employeeName: validateServiceNameField(value) }));
    } else {
      setRequestDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDocCheckboxChange = (docName) => {
    setReturnedDocs((prev) => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "employeeName") {
      const matchedEmployee = findEmployeeByName(value);
      setSelectedEmployeeId(matchedEmployee ? String(matchedEmployee.userId) : "");
      setShowEmpDropdown(true);
      setFormData((prev) => ({
        ...prev,
        employeeName: value,
        employeeEmail: matchedEmployee?.email || matchedEmployee?.employeeEmail || "",
        position: matchedEmployee?.designation || matchedEmployee?.position || prev.position,
        department: matchedEmployee?.department || prev.department,
        joiningDate: matchedEmployee?.joiningDate ? toDateInputValue(matchedEmployee.joiningDate) : prev.joiningDate,
        endDate: matchedEmployee?.endDate ? toDateInputValue(matchedEmployee.endDate) : prev.endDate
      }));
      setRequestDetails((prev) => ({
        ...prev,
        employeeName: value,
        employeeId: matchedEmployee?.empId || prev.employeeId
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setPdfUrl(null);
    setPreviewHtml("");
    const fieldError = name === "employeeName" && value.trim()
      ? validateServiceNameField(value)
      : "";
    setValidationErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleInputBlur = (e) => {
    const { name, value } = e.target;
    if (name !== "employeeName") return;
    setValidationErrors((prev) => ({
      ...prev,
      employeeName: validateServiceNameField(value)
    }));
  };

  const getSubmitData = () => {
    const finalName = formData.employeeName || requestDetails.employeeName || "";
    return {
      ...formData,
      employeeName: finalName,
      requestDetails: {
        ...requestDetails,
        employeeName: finalName
      },
      returnedDocs,
      employee_id: selectedEmployeeId || undefined
    };
  };

  /* ── fetch employees ────────────────────────────────────── */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        try {
          const res = await axios.get(
            "http://localhost:5001/api/templates/service-letter/all-employees",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success) {
            setEmployees(res.data.data.employees);
          }
        } catch {
          const dbg = await axios.get(
            "http://localhost:5001/api/templates/service-letter/debug/all-employees"
          );
          if (dbg.data.success) {
            setEmployees(dbg.data.data.employees);
          }
        }
      } catch (error) {
        console.error("Failed to load employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  /* ── sync responsibilities string ──────────────────────── */
  useEffect(() => {
    const str = keyContributions.filter((c) => c.trim()).join("\n");
    setFormData((prev) => ({ ...prev, responsibilities: str }));
    setPdfUrl(null);
    setPreviewHtml("");
    setValidationErrors((prev) => ({ ...prev, responsibilities: "" }));
  }, [keyContributions]);

  /* ── validation ─────────────────────────────────────────── */
  const validateForm = () => {
    const errors = {};
    const finalName = formData.employeeName || requestDetails.employeeName || "";

    [
      { val: finalName, name: "employeeName", message: "Name is required" },
      { val: formData.position, name: "position", message: "Designation is required" },
      { val: formData.department, name: "department", message: "Role is required" },
      { val: formData.letterDate, name: "letterDate", message: "Date is required" },
      { val: formData.joiningDate, name: "joiningDate", message: "Date of Joining is required" },
      { val: formData.endDate, name: "endDate", message: "Date of Ending is required" },
      { val: formData.responsibilities, name: "responsibilities", message: "Responsibilities are required" }
    ].forEach(({ val, name, message }) => {
      if (!String(val || "").trim()) errors[name] = message;
    });

    const employeeNameError = validateServiceNameField(finalName);
    if (employeeNameError) errors.employeeName = employeeNameError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ── PDF generation ─────────────────────────────────────── */
  const generatePDF = async () => {
    if (!validateForm()) return null;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5001/api/templates/service-letter/generate",
        getSubmitData(),
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          responseType: "blob"
        }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      return url;
    } catch (error) {
      console.error("Generate PDF error:", error);
      alert("Failed to generate PDF. Please ensure all mandatory fields are filled.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewHTML = async () => {
    if (!validateForm()) return null;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5001/api/templates/service-letter/preview",
        getSubmitData(),
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          responseType: "text"
        }
      );
      setPreviewHtml(response.data);
      return response.data;
    } catch (error) {
      console.error("Preview HTML error:", error);
      alert("Failed to generate preview. Please ensure all mandatory fields are filled.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) {
      const url = await generatePDF();
      if (!url) return;
    }
    setShowPreview(false);
    setShowSuccessModal(true);
  };

  const handleConfirmDownload = async () => {
    let url = pdfUrl || (await generatePDF());
    if (!url) return;
    const finalName = formData.employeeName || requestDetails.employeeName || "employee";
    const link = document.createElement("a");
    link.href = url;
    link.download = `service-letter-${finalName.replace(/\s+/g, "-")}.pdf`;
    link.click();
  };

  const handleEmailLetter = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const submitData = getSubmitData();

      // Ensure employeeEmail is attached
      if (!submitData.employeeEmail && selectedEmployeeId) {
        const emp = employees.find((e) => String(e.userId) === String(selectedEmployeeId));
        if (emp && emp.employeeEmail) {
          submitData.employeeEmail = emp.employeeEmail;
        }
      }

      const res = await axios.post(
        "http://localhost:5001/api/templates/service-letter/email",
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      alert(res.data?.message || "Service letter email sent successfully.");
      setShowSuccessModal(false);
    } catch (error) {
      console.error("Email error:", error);
      const errMsg = error.response?.data?.message || error.message || "Failed to send service letter email.";
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    const html = await generatePreviewHTML();
    if (!html) return;
    const url = await generatePDF();
    if (url) setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPreviewHtml("");
  };

  /* ── contributions ──────────────────────────────────────── */
  const addContribution = () => setKeyContributions((prev) => [...prev, ""]);
  const updateContribution = (i, value) => {
    const updated = [...keyContributions];
    updated[i] = value;
    setKeyContributions(updated);
  };
  const deleteContribution = (i) =>
    setKeyContributions(keyContributions.filter((_, idx) => idx !== i));

  /* ── drag & drop ────────────────────────────────────────── */
  const handleDragStart = (i) => setDragIndex(i);
  const handleDragEnter = (i) => {
    dragOverIndex.current = i;
  };
  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex.current !== null && dragIndex !== dragOverIndex.current) {
      const arr = [...keyContributions];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(dragOverIndex.current, 0, moved);
      setKeyContributions(arr);
    }
    setDragIndex(null);
    dragOverIndex.current = null;
  };

  /* ── inline SVG icons ───────────────────────────────────── */
  const DragHandleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="5.5" cy="3.5" r="1.2" fill="#347E45" />
      <circle cx="5.5" cy="8" r="1.2" fill="#347E45" />
      <circle cx="5.5" cy="12.5" r="1.2" fill="#347E45" />
      <circle cx="10.5" cy="3.5" r="1.2" fill="#347E45" />
      <circle cx="10.5" cy="8" r="1.2" fill="#347E45" />
      <circle cx="10.5" cy="12.5" r="1.2" fill="#347E45" />
    </svg>
  );

  const TrashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9.5 4.5h5a1 1 0 0 1 1 1V7h-7V5.5a1 1 0 0 1 1-1Z" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 7h16" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7l1.1 12.2A2 2 0 0 0 9.1 21h5.8a2 2 0 0 0 2-1.8L18 7" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 11v6" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 11v6" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="#347E45" strokeWidth="1.8" />
      <path d="M8 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.4 11.6L12.4 11v6" stroke="#347E45" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ChevronIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const currentEmployeeName = formData.employeeName || requestDetails.employeeName || "";

  return (
    <>
      <div className={`service-template-wrapper ${showPreview ? "blurred" : ""}`}>
        {/* Header */}
        <div className="service-page-header-title">
          <button className="service-back-circle-btn" onClick={() => window.history.back()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="service-main-title">Service Letter</h2>
            <p className="service-main-subtitle">Create and manage employee service letters</p>
          </div>
        </div>

        <form className="service-template-form" onSubmit={(e) => e.preventDefault()}>
          {/* ======================================================== */}
          {/* SECTION 1: Request Details (Internal Use Only)           */}
          {/* ======================================================== */}
          <div className="form-section-card">
            <h3 className="section-title">
              1. Request Details (Internal Use Only) <span className="required-star">*</span>
            </h3>

            <div className="two-column-grid">
              {/* Left Column */}
              <div className="column-fields">
                <div className="service-group" style={{ position: "relative" }}>
                  <label>
                    Employee Name
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 400, marginLeft: 8 }}>
                      (auto-fills details from database)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={currentEmployeeName}
                    onChange={handleRequestDetailsChange}
                    onFocus={() => setShowEmpDropdown(true)}
                    onBlur={() => setTimeout(() => setShowEmpDropdown(false), 200)}
                    placeholder="Search or enter Employee Name"
                    className={`service-input${validationErrors.employeeName ? " service-field-error" : ""}`}
                    autoComplete="off"
                  />
                  {validationErrors.employeeName && <div className="offer-input-error">{validationErrors.employeeName}</div>}

                  {showEmpDropdown && employees.length > 0 && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: "#fff", border: "1.5px solid #d1fae5", borderRadius: "10px",
                      boxShadow: "0 8px 24px rgba(52,126,69,0.15)", zIndex: 9999,
                      maxHeight: "220px", overflowY: "auto"
                    }}>
                      {employees
                        .filter(emp => !currentEmployeeName || emp.employeeName.toLowerCase().includes(currentEmployeeName.toLowerCase()))
                        .map((emp) => (
                          <div
                            key={emp.userId}
                            onMouseDown={() => handleEmployeeSelect(emp)}
                            style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0fdf4" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <div style={{ fontWeight: 600, fontSize: "13px", color: "#1e293b" }}>{emp.employeeName}</div>
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>
                              {emp.position || emp.designation || "—"} &middot; {emp.department || "—"} {emp.empId ? `(${emp.empId})` : ""}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="service-group">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={requestDetails.employeeId}
                    onChange={handleRequestDetailsChange}
                    placeholder="Enter Employee ID"
                    className="service-input"
                  />
                </div>

                <div className="service-group">
                  <label>Requested On</label>
                  <input
                    type="text"
                    name="requestedOn"
                    value={requestDetails.requestedOn}
                    onChange={handleRequestDetailsChange}
                    placeholder="Enter Requested Date"
                    className="service-input"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="column-fields">
                <div className="service-group position-relative">
                  <label>Reason for requesting service letter</label>
                  <div
                    className="custom-dropdown-box"
                    onClick={() => setIsReasonDropdownOpen((prev) => !prev)}
                  >
                    <span className={requestDetails.reason ? "selected-value" : "placeholder-value"}>
                      {requestDetails.reason || "Select the reason for the service letter"}
                    </span>
                    <ChevronIcon />
                  </div>

                  {/* Dropdown Menu with #BBF7D0 selected background */}
                  {isReasonDropdownOpen && (
                    <div className="reason-dropdown-menu">
                      {REASON_OPTIONS.map((opt) => (
                        <div
                          key={opt}
                          className={`reason-dropdown-item ${
                            requestDetails.reason === opt ? "selected-item" : ""
                          }`}
                          onClick={() => {
                            setRequestDetails((prev) => ({ ...prev, reason: opt }));
                            setIsReasonDropdownOpen(false);
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="service-group">
                  <label>Additional Details (if any)</label>
                  <input
                    type="text"
                    name="additionalDetails"
                    value={requestDetails.additionalDetails}
                    onChange={handleRequestDetailsChange}
                    placeholder="Please provide additional details"
                    className="service-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: Documents return confirmation (Internal Use Only) */}
          {/* ======================================================== */}
          <div className="form-section-card">
            <h3 className="section-title">
              2. Documents return confirmation (Internal Use Only) <span className="required-star">*</span>
            </h3>
            <p className="section-subtitle">Confirm the return of Company Documents</p>

            <div className="docs-checkbox-grid">
              {COMPANY_DOCUMENTS.map((docName) => {
                const isChecked = !!returnedDocs[docName];
                return (
                  <div
                    key={docName}
                    className={`custom-checkbox-item ${isChecked ? "is-checked" : ""}`}
                    onClick={() => handleDocCheckboxChange(docName)}
                  >
                    <div className="checkbox-box-square">
                      {isChecked && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M2.5 7L5.5 10L11.5 3.5"
                            stroke="#ffffff"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="checkbox-item-text">{docName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: Create Service Letter                        */}
          {/* ======================================================== */}
          <div className="form-section-card">
            <h3 className="section-title">
              3. Create Service Letter <span className="required-star">*</span>
            </h3>

            {/* 3-column grid */}
            <div className="service-grid">
              {/* Name */}
              <div className="service-group">
                <label>Name</label>
                <input
                  type="text"
                  name="employeeName"
                  value={currentEmployeeName}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="e.g. Sanjeevan"
                  className={`service-input${validationErrors.employeeName ? " service-field-error" : ""}`}
                />
                {validationErrors.employeeName && <div className="offer-input-error">{validationErrors.employeeName}</div>}
              </div>

              {/* Designation */}
              <div className="service-group">
                <label>Designation</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="e.g. Full Stack Engineer"
                  className={`service-input${validationErrors.position ? " service-field-error" : ""}`}
                />
                {validationErrors.position && <div className="offer-input-error">{validationErrors.position}</div>}
              </div>

              {/* Role (Department) */}
              <div className="service-group">
                <label>Role</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g. Technology"
                  className={`service-input${validationErrors.department ? " service-field-error" : ""}`}
                />
                {validationErrors.department && <div className="offer-input-error">{validationErrors.department}</div>}
              </div>

              {/* Date */}
              <div className="service-group">
                <label>Date</label>
                <div
                  className="service-date-wrapper"
                  onClick={(e) => {
                    const inp = e.currentTarget.querySelector('input[type="date"]');
                    if (inp && typeof inp.showPicker === 'function') { try { inp.showPicker(); } catch (err) {} }
                  }}
                >
                  <input
                    type="date"
                    name="letterDate"
                    value={toDateInputValue(formData.letterDate)}
                    onChange={handleInputChange}
                    className={`service-date-input${validationErrors.letterDate ? " service-field-error" : ""}`}
                  />
                  <span className="service-date-icon"><CalendarIcon /></span>
                </div>
                {validationErrors.letterDate && <div className="offer-input-error">{validationErrors.letterDate}</div>}
              </div>

              {/* Date of Joining */}
              <div className="service-group">
                <label>Date of Joining</label>
                <div
                  className="service-date-wrapper"
                  onClick={(e) => {
                    const inp = e.currentTarget.querySelector('input[type="date"]');
                    if (inp && typeof inp.showPicker === 'function') { try { inp.showPicker(); } catch (err) {} }
                  }}
                >
                  <input
                    type="date"
                    name="joiningDate"
                    value={toDateInputValue(formData.joiningDate)}
                    onChange={handleInputChange}
                    className={`service-date-input${validationErrors.joiningDate ? " service-field-error" : ""}`}
                  />
                  <span className="service-date-icon"><CalendarIcon /></span>
                </div>
                {validationErrors.joiningDate && <div className="offer-input-error">{validationErrors.joiningDate}</div>}
              </div>

              {/* Date of Ending */}
              <div className="service-group">
                <label>Date of Ending</label>
                <div
                  className="service-date-wrapper"
                  onClick={(e) => {
                    const inp = e.currentTarget.querySelector('input[type="date"]');
                    if (inp && typeof inp.showPicker === 'function') { try { inp.showPicker(); } catch (err) {} }
                  }}
                >
                  <input
                    type="date"
                    name="endDate"
                    value={toDateInputValue(formData.endDate)}
                    onChange={handleInputChange}
                    className={`service-date-input${validationErrors.endDate ? " service-field-error" : ""}`}
                  />
                  <span className="service-date-icon"><CalendarIcon /></span>
                </div>
                {validationErrors.endDate && <div className="offer-input-error">{validationErrors.endDate}</div>}
              </div>
            </div>

            {/* Responsibilities */}
            <div className="service-key-contributions">
              <span className="resp-label">Responsibilities</span>
              {keyContributions.map((item, index) => (
                <div
                  key={index}
                  className={`key-contribution-item${dragIndex === index ? " dragging" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <span className="drag-handle-icon"><DragHandleIcon /></span>
                  <input
                    type="text"
                    value={item}
                    placeholder="Describe Performance..."
                    onChange={(e) => updateContribution(index, e.target.value)}
                    className={validationErrors.responsibilities ? "service-field-error" : ""}
                  />
                  <button type="button" className="delete-icon-btn" onClick={() => deleteContribution(index)}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            {validationErrors.responsibilities && (
              <div className="offer-input-error" style={{ marginTop: 4 }}>
                {validationErrors.responsibilities}
              </div>
            )}

            {/* Add Achievement */}
            <button type="button" className="add-achievment-btn" onClick={addContribution}>
              <span className="add-achievment-circle">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1V11M1 6H11" stroke="#347E45" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="add-achievment-text">ADD ACHIEVEMENT</span>
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="service-buttons">
            <button type="button" className="preview-btn" onClick={handlePreview} disabled={loading}>
              {loading ? "Generating…" : "Preview"}
            </button>
            <button type="submit" className="save-btn" onClick={handleDownload} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal - Figma Design */}
      {showPreview &&
        ReactDOM.createPortal(
          <div className="figma-preview-backdrop" onClick={handleClosePreview}>
            <div className="figma-preview-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="figma-preview-grid">
                
                {/* LEFT COLUMN: Request Summary & Document Confirmation */}
                <div className="figma-preview-left-col">
                  
                  {/* Card 1: Request Summary */}
                  <div className="figma-summary-card">
                    <h3 className="figma-card-title">1. Request Summary (Internal Use Only)</h3>
                    <div className="figma-summary-rows">
                      <div className="figma-summary-row">
                        <span className="figma-row-label">Employee Name</span>
                        <span className="figma-row-colon">:</span>
                        <span className="figma-row-value">{currentEmployeeName || "—"}</span>
                      </div>
                      <div className="figma-summary-row">
                        <span className="figma-row-label">Employee ID</span>
                        <span className="figma-row-colon">:</span>
                        <span className="figma-row-value">{requestDetails.employeeId || "—"}</span>
                      </div>
                      <div className="figma-summary-row">
                        <span className="figma-row-label">Requested On</span>
                        <span className="figma-row-colon">:</span>
                        <span className="figma-row-value">{requestDetails.requestedOn || "—"}</span>
                      </div>
                      <div className="figma-summary-row">
                        <span className="figma-row-label">Reason of the letter</span>
                        <span className="figma-row-colon">:</span>
                        <span className="figma-row-value">{requestDetails.reason || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Documents Return Confirmation */}
                  <div className="figma-docs-card">
                    <h3 className="figma-card-title">2. Documents return confirmation (Internal Use Only)</h3>
                    <div className="figma-docs-two-col-grid">
                      <div className="figma-docs-col">
                        {COMPANY_DOCUMENTS_COL1.map((docName) => {
                          const isChecked = !!returnedDocs[docName];
                          return (
                            <div
                              key={docName}
                              className={`figma-checkbox-row ${isChecked ? "is-checked" : ""}`}
                              onClick={() => handleDocCheckboxChange(docName)}
                            >
                              <div className="figma-checkbox-box">
                                {isChecked && (
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M2.5 7L5.5 10L11.5 3.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="figma-checkbox-label">{docName}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="figma-docs-col">
                        {COMPANY_DOCUMENTS_COL2.map((docName) => {
                          const isChecked = !!returnedDocs[docName];
                          return (
                            <div
                              key={docName}
                              className={`figma-checkbox-row ${isChecked ? "is-checked" : ""}`}
                              onClick={() => handleDocCheckboxChange(docName)}
                            >
                              <div className="figma-checkbox-box">
                                {isChecked && (
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M2.5 7L5.5 10L11.5 3.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="figma-checkbox-label">{docName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Notice Box */}
                  <div className="figma-notice-box">
                    <div className="figma-notice-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#3B82F6" />
                        <path d="M7.5 12L10.5 15L16.5 9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="figma-notice-text">
                      The information on this page is for internal use only and will not be included in the service letter
                    </span>
                  </div>

                </div>

                {/* RIGHT COLUMN: Live Service Letter Preview */}
                <div className="figma-preview-right-col">
                  <div className="figma-right-header">
                    <h3 className="figma-preview-heading">Service Letter Preview</h3>
                  </div>

                  {/* A4 Paper container */}
                  <div className="figma-paper-container">
                    {previewHtml ? (
                      <iframe srcDoc={previewHtml} title="Service Letter Preview" className="figma-preview-iframe" scrolling="no" />
                    ) : (
                      <div className="sl-preview-loading">{loading ? "Generating PDF…" : "Preparing preview…"}</div>
                    )}
                  </div>

                  {/* Action Buttons under Paper */}
                  <div className="figma-paper-action-buttons">
                    <button
                      type="button"
                      className="figma-action-icon-btn"
                      onClick={handleDownload}
                      title="Download Service Letter"
                      disabled={loading || !pdfUrl}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="figma-action-icon-btn"
                      onClick={handleEmailLetter}
                      title="Email Service Letter"
                      disabled={loading}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Footer Actions */}
              <div className="figma-preview-footer">
                <button type="button" className="figma-close-modal-btn" onClick={handleClosePreview}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Success Modal */}
      {showSuccessModal &&
        ReactDOM.createPortal(
          <div className="sl-success-backdrop" onClick={() => setShowSuccessModal(false)}>
            <div className="sl-success-modal" onClick={(e) => e.stopPropagation()} role="dialog">
              <button type="button" className="sl-success-close" onClick={() => setShowSuccessModal(false)}>
                ✕
              </button>
              <h3 className="sl-success-title">Service letter has been generated successfully.</h3>
              <p className="sl-success-subtitle">You can download it now or Send your email for a copy.</p>
              <div className="sl-success-actions">
                <button type="button" className="sl-success-btn" onClick={handleConfirmDownload} disabled={loading}>
                  {loading ? "Generating…" : "Download"}
                </button>
                <button type="button" className="sl-success-btn" onClick={handleEmailLetter} disabled={loading}>
                  {loading ? "Sending..." : "Email"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
