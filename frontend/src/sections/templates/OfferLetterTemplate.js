import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "../../styles/offer_letter_template.css";

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Calendar Icon
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="#347E45" strokeWidth="1.8" />
    <path d="M8 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M11.4 11.6L12.4 11v6" stroke="#347E45" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Interactive Date Picker Field Component (triggers native date picker on wrapper or icon click with border & placeholder)
const DatePickerField = ({ name, value, onChange, placeholder = "DD/MM/YYYY" }) => {
  const inputRef = useRef(null);
  const isEmpty = !value;

  const toDateInputValue = (val) => {
    if (!val) return "";
    if (val.includes("-")) return val;
    const parts = val.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return val;
  };

  const handleOpenCalendar = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        try {
          inputRef.current.showPicker();
        } catch (e) {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      className={`date-input-relative-wrapper ${isEmpty ? "is-empty" : ""}`}
      onClick={handleOpenCalendar}
    >
      <input
        ref={inputRef}
        type="date"
        name={name}
        value={toDateInputValue(value)}
        onChange={onChange}
        className={`offer-field-input date-input ${isEmpty ? "is-empty" : ""}`}
      />
      <span className="input-date-svg-icon" onClick={handleOpenCalendar}>
        <CalendarIcon />
      </span>
    </div>
  );
};

export default function OfferLetterTemplate() {
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // DB employees
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeSearchText, setEmployeeSearchText] = useState("");
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  // Auto-filled hidden fields from DB
  const [dbAddress, setDbAddress] = useState("");
  const [dbDepartment, setDbDepartment] = useState("");

  // 1. Hire Type: 'permanent' | 'contract'
  const [hireType, setHireType] = useState("permanent");

  // 2. Working Schedule mode (when permanent): 'full_time' | 'part_time'
  const [workSchedule, setWorkSchedule] = useState("full_time");

  // 3. Form Data
  const [formData, setFormData] = useState({
    // Employee Details
    fullName: "",
    employeeEmail: "",
    jobTitle: "",
    startDate: "",

    // Allowances
    paymentOption: true,
    baseSalary: "",
    incentives: "",

    // Administration
    reportingManager: "",
    reportingManagerEmail: "",
    signingDeadline: "",

    // Schedule details
    workingHours: "40 hrs/week",
    dailyFrom: "10:00 AM",
    dailyTo: "02:00 PM",

    // Contract details (when hireType === 'contract')
    endDate: "",
    contractDurationSelect: ""
  });

  // 4. Active Working Days state (default Mon-Fri active)
  const [workingDays, setWorkingDays] = useState({
    Mon: true,
    Tue: true,
    Wed: true,
    Thu: true,
    Fri: true,
    Sat: false,
    Sun: false
  });

  const handleSelectFullTime = () => {
    setWorkSchedule("full_time");
    setFormData((prev) => ({ ...prev, workingHours: "40 hrs/week" }));
    setWorkingDays({
      Mon: true,
      Tue: true,
      Wed: true,
      Thu: true,
      Fri: true,
      Sat: false,
      Sun: false
    });
  };

  const handleSelectPartTime = () => {
    setWorkSchedule("part_time");
    setFormData((prev) => ({ ...prev, workingHours: "20 hrs/week" }));
    setWorkingDays({
      Mon: false,
      Tue: false,
      Wed: false,
      Thu: false,
      Fri: false,
      Sat: true,
      Sun: true
    });
  };

  const handleDayClick = (day) => {
    setWorkingDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  /* ── fetch employees from DB ────────────────────────────── */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        try {
          const res = await axios.get(
            "http://localhost:5001/api/templates/offer-letter/all-employees",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success && Array.isArray(res.data.data)) {
            setEmployees(res.data.data);
            return;
          }
        } catch (authErr) {
          // Try debug fallback
          const dbg = await axios.get(
            "http://localhost:5001/api/templates/service-letter/debug/all-employees"
          );
          if (dbg.data.success && Array.isArray(dbg.data.data?.employees)) {
            setEmployees(dbg.data.data.employees);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load employees for offer letter:", err);
      }
    };
    fetchEmployees();
  }, []);

  /* ── auto-fill all fields when an employee is selected ─── */
  const handleEmployeeSelect = (emp) => {
    setSelectedEmployeeId(String(emp.userId));
    setEmployeeSearchText(emp.employeeName);
    setShowEmpDropdown(false);
    setDbAddress(emp.address || "");
    setDbDepartment(emp.department || "");

    let parsedStartDate = "";
    if (emp.joiningDate) {
      if (emp.joiningDate.includes("-")) {
        parsedStartDate = emp.joiningDate.split("T")[0];
      } else if (emp.joiningDate.includes("/")) {
        const [d, m, y] = emp.joiningDate.split("/");
        parsedStartDate = `${y}-${m}-${d}`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      fullName: emp.employeeName || prev.fullName,
      employeeEmail: emp.employeeEmail || emp.email || prev.employeeEmail,
      jobTitle: emp.position || emp.designation || prev.jobTitle,
      startDate: parsedStartDate || prev.startDate,
      reportingManager: emp.reportingManager || prev.reportingManager,
      reportingManagerEmail: emp.reportingManagerEmail || prev.reportingManagerEmail
    }));
    setValidationErrors({});
    setPdfUrl(null);
    setPreviewHtml("");
  };

  /* ── filtered employee dropdown ─────────────────────────── */
  const filteredEmployees = employees.filter((emp) =>
    emp.employeeName.toLowerCase().includes(employeeSearchText.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setPdfUrl(null);
    setPreviewHtml("");
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Helper to map UI form fields to backend expected fields
  const getSubmitData = () => {
    const activeDaysList = Object.keys(workingDays).filter((d) => workingDays[d]);
    const today = new Date().toISOString().split("T")[0];
    return {
      // employee_id lets backend merge any remaining fields automatically
      employee_id: selectedEmployeeId || undefined,

      // Backend expected field names — use real form/DB values
      employeeName: formData.fullName,
      employeeEmail: formData.employeeEmail,
      address: dbAddress || "",
      letterDate: today,
      position: formData.jobTitle,
      joiningDate: formData.startDate || today,
      endDate: formData.endDate || formData.signingDeadline || "",
      department: dbDepartment || "",
      reportingManager: formData.reportingManager,
      reportingManagerEmail: formData.reportingManagerEmail,
      salary: formData.baseSalary || "",

      // Additional UI fields
      hireType,
      workSchedule,
      paymentOption: formData.paymentOption,
      incentives: formData.incentives,
      workingHours: formData.workingHours,
      workingDaysList: activeDaysList.join(", "),
      dailyFrom: formData.dailyFrom,
      dailyTo: formData.dailyTo,
      contractDurationSelect: formData.contractDurationSelect
    };
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    if (!formData.jobTitle.trim()) errors.jobTitle = "Job Title is required";
    if (formData.employeeEmail && !EMAIL_PATTERN.test(formData.employeeEmail.trim())) {
      errors.employeeEmail = "Enter a valid Email";
    }
    if (
      formData.reportingManagerEmail &&
      !EMAIL_PATTERN.test(formData.reportingManagerEmail.trim())
    ) {
      errors.reportingManagerEmail = "Enter a valid Email";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generatePDF = async () => {
    if (!validateForm()) return null;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5001/api/templates/offer-letter/generate",
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
      alert("Failed to generate PDF. Please check all required fields.");
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
        "http://localhost:5001/api/templates/offer-letter/preview",
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
      alert("Failed to generate preview. Please check required fields.");
      return null;
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

  const handleOpenSuccess = async () => {
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
    const finalName = formData.fullName || "employee";
    const link = document.createElement("a");
    link.href = url;
    link.download = `offer-letter-${finalName.replace(/\s+/g, "-")}.pdf`;
    link.click();
  };

  const handleEmailLetter = async () => {
    if (!validateForm()) return;
    if (!formData.employeeEmail) {
      alert("Please enter the recipient's Email Address to send the offer letter.");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5001/api/templates/offer-letter/email",
        getSubmitData(),
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        }
      );
      alert(res.data?.message || `Offer letter email sent successfully to ${formData.employeeEmail}.`);
      setShowSuccessModal(false);
    } catch (error) {
      console.error("Email error:", error);
      const errMsg = error.response?.data?.message || error.message || "Failed to send offer letter email.";
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /* Icons */
  const ContractCardIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#005012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="#005012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 13H8" stroke="#005012" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 17H8" stroke="#005012" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 9H8" stroke="#005012" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const WorkCaseIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="#005012" strokeWidth="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#005012" strokeWidth="2" />
    </svg>
  );

  const TimeHalfIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#005012" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="#005012" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const ChevronIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <div className="offer-template-wrapper">
        {/* Page Header */}
        <div className="offer-page-header-title">
          <button className="offer-back-circle-btn" onClick={() => window.history.back()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="offer-main-title">Offer Letter</h2>
            <p className="offer-main-subtitle">Create and manage employee service letters</p>
          </div>
        </div>

        <form className="offer-template-form" onSubmit={(e) => e.preventDefault()}>
          {/* ======================================================== */}
          {/* SECTION 1: Hire Type                                    */}
          {/* ======================================================== */}
          <div className="offer-form-section">
            <div className="section-header-bar">
              <span className="green-accent-line"></span>
              <h3 className="section-header-title">Hire Type</h3>
            </div>

            <div className="two-cards-grid">
              {/* Permanent Card */}
              <div
                className={`hire-type-card ${hireType === "permanent" ? "selected" : ""}`}
                onClick={() => setHireType("permanent")}
              >
                <div className="card-icon-box">
                  <ContractCardIcon />
                </div>
                <div className="card-text-content">
                  <h4 className="card-title-text">Permanent</h4>
                  <p className="card-subtitle-text">Regular employee with no fixed end date</p>
                </div>
              </div>

              {/* Contract Card */}
              <div
                className={`hire-type-card ${hireType === "contract" ? "selected" : ""}`}
                onClick={() => setHireType("contract")}
              >
                <div className="card-icon-box">
                  <ContractCardIcon />
                </div>
                <div className="card-text-content">
                  <h4 className="card-title-text">Contract</h4>
                  <p className="card-subtitle-text">Fixed Term Role</p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: Employee Details                             */}
          {/* ======================================================== */}
          <div className="offer-form-section">
            <div className="section-header-bar">
              <span className="green-accent-line"></span>
              <h3 className="section-header-title">Employee Details</h3>
            </div>

            <div className="two-column-inputs-grid">
              {/* Employee Selector — spans both columns */}
              <div className="offer-field-group" style={{ gridColumn: "1 / -1", position: "relative" }}>
                <label className="offer-field-label">
                  Select Employee
                  <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 400, marginLeft: 8 }}>
                    (auto-fills details from database)
                  </span>
                </label>
                <input
                  type="text"
                  value={employeeSearchText}
                  onChange={(e) => {
                    setEmployeeSearchText(e.target.value);
                    setShowEmpDropdown(true);
                    if (selectedEmployeeId) setSelectedEmployeeId("");
                  }}
                  onFocus={() => setShowEmpDropdown(true)}
                  onBlur={() => setTimeout(() => setShowEmpDropdown(false), 200)}
                  placeholder={employees.length > 0 ? `Search from ${employees.length} employees…` : "Loading employees…"}
                  className="offer-field-input"
                  style={{ paddingRight: "36px" }}
                  autoComplete="off"
                />
                <span style={{ position: "absolute", right: "12px", top: "38px", pointerEvents: "none", color: "#9ca3af" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                {showEmpDropdown && filteredEmployees.length > 0 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "#fff", border: "1.5px solid #d1fae5", borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(52,126,69,0.12)", zIndex: 9999,
                    maxHeight: "220px", overflowY: "auto"
                  }}>
                    {filteredEmployees.map((emp) => (
                      <div
                        key={emp.userId}
                        onMouseDown={() => handleEmployeeSelect(emp)}
                        style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #f0fdf4" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>{emp.employeeName}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {emp.position || "—"} &middot; {emp.department || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showEmpDropdown && employeeSearchText && filteredEmployees.length === 0 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: "10px",
                    padding: "14px 16px", color: "#9ca3af", fontSize: "13px", zIndex: 9999
                  }}>
                    No employees found matching "{employeeSearchText}"
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div className="offer-field-group">
                <label className="offer-field-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Jordan Strelling"
                  className={`offer-field-input ${validationErrors.fullName ? "error" : ""}`}
                />
                {validationErrors.fullName && <span className="error-msg">{validationErrors.fullName}</span>}
              </div>

              {/* Email */}
              <div className="offer-field-group">
                <label className="offer-field-label">Email</label>
                <input
                  type="email"
                  name="employeeEmail"
                  value={formData.employeeEmail}
                  onChange={handleInputChange}
                  placeholder="e.g. abc.example@gmail.com"
                  className={`offer-field-input ${validationErrors.employeeEmail ? "error" : ""}`}
                />
                {validationErrors.employeeEmail && <span className="error-msg">{validationErrors.employeeEmail}</span>}
              </div>

              {/* Job Title */}
              <div className="offer-field-group">
                <label className="offer-field-label">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Project Manager"
                  className={`offer-field-input ${validationErrors.jobTitle ? "error" : ""}`}
                />
                {validationErrors.jobTitle && <span className="error-msg">{validationErrors.jobTitle}</span>}
              </div>

              {/* Start Date */}
              <div className="offer-field-group">
                <label className="offer-field-label">Start Date</label>
                <DatePickerField
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: Allowances                                   */}
          {/* ======================================================== */}
          <div className="offer-form-section">
            <div className="section-header-bar flex-space-between">
              <div className="header-bar-left">
                <span className="green-accent-line"></span>
                <h3 className="section-header-title">Allowances</h3>
              </div>
              {/* Payment Option Toggle */}
              <div className="payment-toggle-container">
                <span className="toggle-label-text">Payment Option</span>
                <div
                  className={`custom-toggle-switch ${formData.paymentOption ? "active" : ""}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, paymentOption: !prev.paymentOption }))
                  }
                >
                  <div className="toggle-switch-circle"></div>
                </div>
              </div>
            </div>

            <div className="two-column-inputs-grid">
              {/* Base Salary (Monthly) */}
              <div className="offer-field-group">
                <label className="offer-field-label">Base Salary (Monthly)</label>
                <input
                  type="text"
                  name="baseSalary"
                  value={formData.baseSalary}
                  onChange={handleInputChange}
                  placeholder="e.g. Rs.50, 000.00"
                  className="offer-field-input"
                />
              </div>

              {/* Incentives */}
              <div className="offer-field-group">
                <label className="offer-field-label">Incentives</label>
                <input
                  type="text"
                  name="incentives"
                  value={formData.incentives}
                  onChange={handleInputChange}
                  placeholder="Standard option (0.05%)"
                  className="offer-field-input"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: Administration                                */}
          {/* ======================================================== */}
          <div className="offer-form-section">
            <div className="section-header-bar">
              <span className="green-accent-line"></span>
              <h3 className="section-header-title">Administration</h3>
            </div>

            <div className="two-column-inputs-grid">
              {/* Reporting Manager */}
              <div className="offer-field-group">
                <label className="offer-field-label">Reporting Manager</label>
                <input
                  type="text"
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleInputChange}
                  placeholder="e.g. Chief Executive Officer"
                  className="offer-field-input"
                />
              </div>

              {/* Email */}
              <div className="offer-field-group">
                <label className="offer-field-label">Email</label>
                <input
                  type="email"
                  name="reportingManagerEmail"
                  value={formData.reportingManagerEmail}
                  onChange={handleInputChange}
                  placeholder="e.g. abc.example@gmail.com"
                  className={`offer-field-input ${validationErrors.reportingManagerEmail ? "error" : ""}`}
                />
                {validationErrors.reportingManagerEmail && <span className="error-msg">{validationErrors.reportingManagerEmail}</span>}
              </div>

              {/* Signing Deadline */}
              <div className="offer-field-group">
                <label className="offer-field-label">Signing Deadline</label>
                <DatePickerField
                  name="signingDeadline"
                  value={formData.signingDeadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 5: Dynamic Section based on Hire Type           */}
          {/* ======================================================== */}
          {hireType === "permanent" ? (
            <div className="offer-form-section">
              <div className="section-header-bar">
                <span className="green-accent-line"></span>
                <h3 className="section-header-title">Working Schedule</h3>
              </div>

              <div className="two-cards-grid">
                {/* Full Time Card */}
                <div
                  className={`hire-type-card ${workSchedule === "full_time" ? "selected" : ""}`}
                  onClick={handleSelectFullTime}
                >
                  <div className="card-icon-box">
                    <WorkCaseIcon />
                  </div>
                  <div className="card-text-content">
                    <h4 className="card-title-text">Full Time</h4>
                    <p className="card-subtitle-text">Standard working hours</p>
                  </div>
                </div>

                {/* Part Time Card */}
                <div
                  className={`hire-type-card ${workSchedule === "part_time" ? "selected" : ""}`}
                  onClick={handleSelectPartTime}
                >
                  <div className="card-icon-box">
                    <TimeHalfIcon />
                  </div>
                  <div className="card-text-content">
                    <h4 className="card-title-text">Part Time</h4>
                    <p className="card-subtitle-text">Limited weekly hours</p>
                  </div>
                </div>
              </div>

              {/* Schedule Fields */}
              <div className="two-column-inputs-grid margin-top-20">
                {/* Working Hours */}
                <div className="offer-field-group">
                  <label className="offer-field-label">Working Hours</label>
                  <input
                    type="text"
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleInputChange}
                    placeholder="e.g. 40 hrs/week"
                    className="offer-field-input"
                  />
                </div>

                {/* Working Days Pills */}
                <div className="offer-field-group">
                  <label className="offer-field-label">Working Days</label>
                  <div className="working-days-pills-row">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div
                        key={day}
                        className={`day-pill-button ${workingDays[day] ? "active" : ""}`}
                        onClick={() => handleDayClick(day)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Daily Working Hours for Part Time */}
              {workSchedule === "part_time" && (
                <div className="daily-working-hours-container margin-top-20">
                  <label className="offer-field-label">Daily Working Hours</label>
                  <div className="two-column-inputs-grid">
                    <div className="offer-field-group">
                      <label className="sub-field-label">From</label>
                      <input
                        type="text"
                        name="dailyFrom"
                        value={formData.dailyFrom}
                        onChange={handleInputChange}
                        placeholder="e.g. 10:00 AM"
                        className="offer-field-input"
                      />
                    </div>
                    <div className="offer-field-group">
                      <label className="sub-field-label">To</label>
                      <input
                        type="text"
                        name="dailyTo"
                        value={formData.dailyTo}
                        onChange={handleInputChange}
                        placeholder="e.g. 02:00 PM"
                        className="offer-field-input"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Contract Terms Section (when hireType === 'contract') */
            <div className="offer-form-section">
              <div className="section-header-bar">
                <span className="green-accent-line"></span>
                <h3 className="section-header-title">Contract Terms</h3>
              </div>

              <div className="two-column-inputs-grid">
                {/* End Date */}
                <div className="offer-field-group">
                  <label className="offer-field-label">End Date</label>
                  <DatePickerField
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Contract Duration */}
                <div className="offer-field-group">
                  <label className="offer-field-label">Contract Duration</label>
                  <div className="custom-select-relative-wrapper">
                    <select
                      name="contractDurationSelect"
                      value={formData.contractDurationSelect}
                      onChange={handleInputChange}
                      className="offer-field-input offer-select-element"
                    >
                      <option value="">Select the contract duration</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                    </select>
                    <span className="select-arrow-svg-icon"><ChevronIcon /></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="offer-footer-action-buttons">
            <button
              type="button"
              className="btn-action-preview"
              onClick={handlePreview}
              disabled={loading}
            >
              {loading ? "Generating…" : "Preview"}
            </button>
            <button
              type="submit"
              className="btn-action-save"
              onClick={handleOpenSuccess}
              disabled={loading}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* PDF Preview Modal - Figma Design */}
      {showPreview &&
        ReactDOM.createPortal(
          <div className="figma-ol-preview-backdrop" onClick={handleClosePreview}>
            <div className="figma-ol-preview-stack" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="figma-ol-close-btn" onClick={handleClosePreview}>
                ✕
              </button>

              {/* A4 Document Paper */}
              <div className="figma-ol-doc-paper">
                {previewHtml ? (
                  <iframe srcDoc={previewHtml} title="Offer Letter Preview" className="figma-ol-iframe" scrolling="no" />
                ) : (
                  <div className="offer-preview-loading">{loading ? "Generating PDF…" : "Preparing preview…"}</div>
                )}
              </div>

              {/* Action Buttons: Download & Mail */}
              <div className="figma-ol-action-buttons-row">
                <button
                  type="button"
                  className="figma-ol-icon-btn"
                  onClick={handleConfirmDownload}
                  disabled={loading || !pdfUrl}
                  title="Download Offer Letter PDF"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="figma-ol-icon-btn"
                  onClick={handleEmailLetter}
                  disabled={loading}
                  title={formData.employeeEmail ? `Send Offer Letter to ${formData.employeeEmail}` : "Send Offer Letter to Email"}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Success Modal */}
      {showSuccessModal &&
        ReactDOM.createPortal(
          <div className="ol-success-backdrop" onClick={() => setShowSuccessModal(false)}>
            <div className="ol-success-modal" onClick={(e) => e.stopPropagation()} role="dialog">
              <button type="button" className="ol-success-close" onClick={() => setShowSuccessModal(false)}>
                ✕
              </button>
              <h3 className="ol-success-title">Offer letter has been generated successfully.</h3>
              <p className="ol-success-subtitle">You can download it now or Send your email for a copy.</p>
              <div className="ol-success-actions">
                <button type="button" className="ol-success-btn" onClick={handleConfirmDownload} disabled={loading}>
                  {loading ? "Generating…" : "Download"}
                </button>
                <button type="button" className="ol-success-btn" onClick={handleEmailLetter} disabled={loading}>
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
