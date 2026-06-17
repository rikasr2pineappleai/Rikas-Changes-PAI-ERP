import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "../../styles/service_letter_template.css";

export default function ServiceLetterTemplate() {
  const [showPreview, setShowPreview]         = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pdfUrl, setPdfUrl]                   = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [employees, setEmployees]             = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError]   = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [searchQuery, setSearchQuery]         = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [dragIndex, setDragIndex]             = useState(null);
  const dragOverIndex                          = useRef(null);

  const [formData, setFormData] = useState({
    employeeName: "",
    position:     "",
    department:   "",
    letterDate:   "",
    joiningDate:  "",
    endDate:      "",
    responsibilities: "",
  });

  const [keyContributions, setKeyContributions] = useState([
    "Designing user-friendly and responsive interfaces for Android platform.",
    "Collaborated with cross-functional teams to deliver high-quality products.",
    "Optimized application performance and reduced load time by 30%.",
  ]);

  /* ── helpers ───────────────────────────────────────────── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setPdfUrl(null);
    setValidationErrors(prev => ({ ...prev, [name]: "" }));
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    if (value.includes("-")) return value;
    const parts = value.split("/");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value;
  };

  /* ── fetch employees ────────────────────────────────────── */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        setEmployeesError(null);
        const token = localStorage.getItem("token");
        try {
          const res = await axios.get(
            "http://localhost:5001/api/templates/service-letter/all-employees",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data.success) {
            setEmployees(res.data.data.employees);
          } else {
            setEmployeesError(res.data.message || "Failed to load employees");
          }
        } catch {
          const dbg = await axios.get(
            "http://localhost:5001/api/templates/service-letter/debug/all-employees"
          );
          if (dbg.data.success) {
            setEmployees(dbg.data.data.employees);
          } else {
            setEmployeesError(dbg.data.message || "Failed to load employees");
          }
        }
      } catch (error) {
        setEmployeesError(error.response?.data?.message || error.message || "Failed to load employees");
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
      setFormData(prev => ({ ...prev, employeeName: "", position: "" }));
      return;
    }
    const emp = employees.find(e => e.userId === parseInt(selectedId));
    if (emp) {
      setFormData(prev => ({
        employeeName: emp.employeeName || "",
        position:     emp.designation  || "",
        department:   emp.department   || prev.department,
        letterDate:   prev.letterDate,
        joiningDate:  emp.joiningDate  || "",
        endDate:      emp.endDate      || "",
        responsibilities: prev.responsibilities,
      }));
    }
  };

  /* ── modal scroll lock ──────────────────────────────────── */
  useEffect(() => {
    document.body.classList.toggle("modal-open", showPreview);
    return () => document.body.classList.remove("modal-open");
  }, [showPreview]);

  /* ── sync responsibilities string ──────────────────────── */
  useEffect(() => {
    const str = keyContributions.filter(c => c.trim()).join("\n");
    setFormData(prev => ({ ...prev, responsibilities: str }));
    setPdfUrl(null);
    setValidationErrors(prev => ({ ...prev, responsibilities: "" }));
  }, [keyContributions]);

  /* ── validation ─────────────────────────────────────────── */
  const validateForm = () => {
    const errors = {};
    [
      { name: "employeeName",   message: "Name is required" },
      { name: "position",       message: "Designation is required" },
      { name: "department",     message: "Role is required" },
      { name: "letterDate",     message: "Date is required" },
      { name: "joiningDate",    message: "Date of Joining is required" },
      { name: "endDate",        message: "Date of Ending is required" },
      { name: "responsibilities", message: "Responsibilities are required" },
    ].forEach(({ name, message }) => {
      if (!String(formData[name] || "").trim()) errors[name] = message;
    });
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
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          responseType: "blob",
        }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url  = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      return url;
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const data = JSON.parse(text);
          if (data.errors) setValidationErrors(data.errors);
          alert(data.message || "Failed to generate PDF.");
        } catch { alert("Failed to generate PDF."); }
      } else {
        alert(error.response?.data?.message || "Failed to generate PDF.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  /* Clicking the green arrow (pdf-download-btn) in the preview modal does
     NOT actually download the file yet — it closes the preview modal and
     opens the success/Email modal. The real download is triggered by the
     Download button inside the success modal. */
  const handleDownload = async () => {
    // Pre-warm the PDF blob so the actual download is instant when the user
    // clicks Download inside the success modal. Failures here surface as
    // validation/alerts via generatePDF.
    if (!pdfUrl) {
      const url = await generatePDF();
      if (!url) return; // generation failed (e.g. validation) — keep modals closed
    }
    // Close the preview modal first so only the success modal is on screen
    setShowPreview(false);
    setShowSuccessModal(true);
  };

  /* Triggered by the Download button INSIDE the success modal. */
  const handleConfirmDownload = async () => {
    let url = pdfUrl || (await generatePDF());
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `service-letter-${formData.employeeName || "document"}.pdf`;
    link.click();
  };

  const handleEmailLetter = () => {
    // Opens Gmail's web compose window with ceo@pineappleai.cloud pre-filled
    // as the recipient. Attachment flow can be hooked up later via backend.
    const to = "ceo@pineappleai.cloud";
    const subject = encodeURIComponent("Service Letter");
    const body = encodeURIComponent(
      `Hi,\n\nPlease find the service letter for ${formData.employeeName || "the employee"} attached.\n\nRegards,\nPineappleAI HR`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const handlePreview = async () => {
    // Preview shows the SAME PDF the user will download, so the modal renders
    // the backend-generated PDF in an iframe. This guarantees what you see
    // matches what you get.
    if (!validateForm()) return;
    setShowPreview(true);
    if (!pdfUrl) {
      await generatePDF();
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (pdfUrl) { window.URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
  };

  /* ── contributions ──────────────────────────────────────── */
  const addContribution    = ()           => setKeyContributions(prev => [...prev, ""]);
  const updateContribution = (i, value)   => {
    const updated = [...keyContributions]; updated[i] = value; setKeyContributions(updated);
  };
  const deleteContribution = (i)          => setKeyContributions(keyContributions.filter((_, idx) => idx !== i));

  /* ── drag & drop ────────────────────────────────────────── */
  const handleDragStart = (i)    => setDragIndex(i);
  const handleDragEnter = (i)    => { dragOverIndex.current = i; };
  const handleDragEnd   = ()     => {
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
      <circle cx="5.5" cy="3.5"  r="1.2" fill="#347E45"/>
      <circle cx="5.5" cy="8"    r="1.2" fill="#347E45"/>
      <circle cx="5.5" cy="12.5" r="1.2" fill="#347E45"/>
      <circle cx="10.5" cy="3.5"  r="1.2" fill="#347E45"/>
      <circle cx="10.5" cy="8"    r="1.2" fill="#347E45"/>
      <circle cx="10.5" cy="12.5" r="1.2" fill="#347E45"/>
    </svg>
  );

  /* Trash icon — matches uploaded Figma asset: bold, dark red, with the
     small handle on top of the lid and two inner bars. */
  const TrashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {/* Lid top handle */}
      <path
        d="M9.5 4.5h5a1 1 0 0 1 1 1V7h-7V5.5a1 1 0 0 1 1-1Z"
        stroke="#C8102E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lid bar */}
      <path
        d="M4 7h16"
        stroke="#C8102E"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Bin body */}
      <path
        d="M6 7l1.1 12.2A2 2 0 0 0 9.1 21h5.8a2 2 0 0 0 2-1.8L18 7"
        stroke="#C8102E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Two inner bars */}
      <path d="M10.5 11v6" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 11v6" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  /* Calendar icon — matches the uploaded Figma asset:
     stroked calendar with two binder notches on top and a small "1" inside */
  const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {/* Main body */}
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        stroke="#347E45"
        strokeWidth="1.8"
      />
      {/* Top binder notches */}
      <path d="M8 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
      {/* The "1" digit inside */}
      <path
        d="M11.4 11.6L12.4 11v6"
        stroke="#347E45"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
            stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ChevronIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  /* ── preview modal — clean PDF view (no browser PDF chrome) ─────── */
  const renderPreviewModal = () => {
    if (!showPreview) return null;

    return ReactDOM.createPortal(
      <div
        className="pdf-modal-backdrop sl-preview-backdrop"
        onClick={handleClosePreview}
      >
        <div
          className="sl-preview-stack"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="sl-preview-close"
            onClick={handleClosePreview}
            aria-label="Close preview"
          >
            ✕
          </button>

          <div className="sl-preview-doc">
            {pdfUrl ? (
              <iframe
                // Keep the PDF fitted to the preview width with native vertical scrolling.
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&view=FitH&zoom=page-width`}
                title="Service Letter Preview"
                className="sl-preview-iframe"
                scrolling="auto"
              />
            ) : (
              <div className="sl-preview-loading">
                {loading ? "Generating PDF…" : "Preparing preview…"}
              </div>
            )}
          </div>

          <div className="sl-preview-action-row">
            <button
              type="button"
              className="sl-download-icon-btn"
              onClick={handleDownload}
              disabled={loading || !pdfUrl}
              title="Download PDF"
              aria-label="Download PDF"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path d="M12 3v12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 10l5 5 5-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <>
      <div className={`service-template-wrapper ${showPreview ? "blurred" : ""}`}>

        {/* Card Header */}
        <div className="service-card-header">
          <span className="service-card-title">Service Letter</span>
          <div className="service-search-wrapper">
            <SearchIcon />
            <input
              className="service-search-input"
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <form className="service-template-form" onSubmit={e => e.preventDefault()}>

          {/* ── 3-column grid ── */}
          <div className="service-grid">

            {/* Name — plain text input, no dropdown */}
            <div className="service-group">
              <label>Name</label>
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
                placeholder="e.g., S.Praveen"
                className={`service-input${validationErrors.employeeName ? " service-field-error" : ""}`}
              />
              {validationErrors.employeeName && <div className="offer-input-error">{validationErrors.employeeName}</div>}
            </div>

            {/* Designation */}
            <div className="service-group">
              <label>Designation</label>
              <div className="service-select-wrapper">
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`service-select${validationErrors.position ? " service-field-error" : ""}`}
                >
                  <option value="">Designation</option>
                  <option>Software Engineer</option>
                  <option>QA Engineer</option>
                  <option>Project Manager</option>
                  <option>Designer</option>
                  <option>HR Specialist</option>
                  <option>UI/UX Engineer</option>
                </select>
                <span className="service-select-arrow"><ChevronIcon /></span>
              </div>
              {validationErrors.position && <div className="offer-input-error">{validationErrors.position}</div>}
            </div>

            {/* Role */}
            <div className="service-group">
              <label>Role</label>
              <div className="service-select-wrapper">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`service-select${validationErrors.department ? " service-field-error" : ""}`}
                >
                  <option value="">Role</option>
                  <option>Associate</option>
                  <option>Manager</option>
                  <option>Intern</option>
                </select>
                <span className="service-select-arrow"><ChevronIcon /></span>
              </div>
              {validationErrors.department && <div className="offer-input-error">{validationErrors.department}</div>}
            </div>

            {/* Date */}
            <div className="service-group">
              <label>Date</label>
              <div className="service-date-wrapper">
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

            {/* Date of Ending */}
            <div className="service-group">
              <label>Date of Ending</label>
              <div className="service-date-wrapper">
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

            {/* Date of Joining */}
            <div className="service-group">
              <label>Date of Joining</label>
              <div className="service-date-wrapper">
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

          </div>{/* /service-grid */}

          {/* ── Responsibilities ── */}
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
                onDragOver={e => e.preventDefault()}
              >
                <span className="drag-handle-icon"><DragHandleIcon /></span>
                <input
                  type="text"
                  value={item}
                  placeholder="Describe Performance..."
                  onChange={e => updateContribution(index, e.target.value)}
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

          {/* ── Add Achievement ── */}
          <button type="button" className="add-achievment-btn" onClick={addContribution}>
            <span className="add-achievment-circle">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="#347E45" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="add-achievment-text">ADD ACHIEVEMENT</span>
          </button>

          {/* ── Footer Buttons ── */}
          <div className="service-buttons">
            <button type="button" className="preview-btn" onClick={handlePreview} disabled={loading}>
              {loading ? "Generating…" : "Preview"}
            </button>
            <button type="submit" className="save-btn">Save</button>
          </div>

        </form>
      </div>

      {renderPreviewModal()}

      {/* Success modal — shown after a successful Download click */}
      {showSuccessModal &&
        ReactDOM.createPortal(
          <div
            className="sl-success-backdrop"
            onClick={() => setShowSuccessModal(false)}
          >
            <div
              className="sl-success-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sl-success-title"
            >
              <button
                type="button"
                className="sl-success-close"
                onClick={() => setShowSuccessModal(false)}
                aria-label="Close"
              >
                ✕
              </button>

              <h3 id="sl-success-title" className="sl-success-title">
                Service letter has been generated successfully.
              </h3>
              <p className="sl-success-subtitle">
                You can download it now or Send your email for a copy.
              </p>

              <div className="sl-success-actions">
                <button
                  type="button"
                  className="sl-success-btn"
                  onClick={handleConfirmDownload}
                  disabled={loading}
                >
                  {loading ? "Generating…" : "Download"}
                </button>
                <button
                  type="button"
                  className="sl-success-btn"
                  onClick={handleEmailLetter}
                >
                  Email
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
