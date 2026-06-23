import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "../../styles/offer_letter_template.css";

export default function OfferLetterTemplate() {
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);
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
    responsibilities: "",
  });

  const toDateInputValue = (value) => {
    if (!value) return "";
    if (value.includes("-")) return value;
    const parts = value.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return value;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setPdfUrl(null);
    setPreviewHtml("");
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const clearForm = () => {
    setFormData({
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
      responsibilities: "",
    });
    setValidationErrors({});
    setPdfUrl(null);
    setPreviewHtml("");
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = [
      { name: "employeeName", message: "Name is required" },
      { name: "address", message: "Address is required" },
      { name: "letterDate", message: "Date is required" },
      { name: "position", message: "Role is required" },
      { name: "joiningDate", message: "Date of Joining is required" },
      { name: "endDate", message: "Date of Ending is required" },
      { name: "department", message: "Department is required" },
      { name: "reportingManager", message: "Reporting Manager is required" },
      {
        name: "reportingManagerEmail",
        message: "Reporting Manager Email is required",
      },
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
    if (!validateForm()) return null;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5001/api/templates/offer-letter/generate",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      return url;
    } catch (error) {
      console.error("Error generating PDF:", error);
      if (error.response?.data instanceof Blob) {
        const errorText = await error.response.data.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.errors) setValidationErrors(errorData.errors);
          alert(
            errorData.message ||
              "Failed to generate PDF. Please check all required fields."
          );
        } catch {
          alert("Failed to generate PDF. Please check all required fields.");
        }
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to generate PDF. Please check all required fields."
        );
      }
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
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "text",
        }
      );

      setPreviewHtml(response.data);
      return response.data;
    } catch (error) {
      console.error("Error generating preview:", error);
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      }
      alert(
        error.response?.data?.message ||
          "Failed to generate preview. Please check all required fields."
      );
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

  /* Clicking the green download-icon button in the PREVIEW modal does NOT
     actually save the PDF. It closes the preview and opens the success
     modal ("Offer letter has been generated successfully") which has the
     real Download and Email buttons. */
  const handleOpenSuccess = async () => {
    if (!pdfUrl) {
      const url = await generatePDF();
      if (!url) return; // generation failed — keep modals closed
    }
    setShowPreview(false);
    setShowSuccessModal(true);
  };

  /* Triggered by the Download button INSIDE the success modal */
  const handleConfirmDownload = async () => {
    let url = pdfUrl || (await generatePDF());
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = `offer-letter-${formData.employeeName || "document"}.pdf`;
    link.click();
  };

  /* Triggered by the Email button INSIDE the success modal.
     Opens Gmail's web compose window with ceo@pineappleai.cloud pre-filled. */
  const handleEmailLetter = () => {
    const to = "ceo@pineappleai.cloud";
    const subject = encodeURIComponent("Offer Letter");
    const body = encodeURIComponent(
      `Hi,\n\nPlease find the offer letter for ${formData.employeeName || "the candidate"} attached.\n\nRegards,\nPineappleAI HR`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  /* ── icons ───────────────────────────────────────────────── */
  const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2.5"
        stroke="#347E45"
        strokeWidth="1.8"
      />
      <path d="M8 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3v4" stroke="#347E45" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M11.4 11.6L12.4 11v6"
        stroke="#347E45"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChevronIcon = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="#6B7280"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <>
      <div className="offer-template-wrapper">
        {/* Header */}
        <div className="offer-template-header">
          <h3 className="offer-template-title">Offer Letter</h3>
        </div>

        {/* Form */}
        <form
          className="offer-template-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="offer-grid">
            {/* Row 1: Name | Address | Date */}
            <div className="offer-group">
              <label>Name</label>
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
                placeholder="e.g., Sanjeevan"
                className={`offer-input${
                  validationErrors.employeeName ? " offer-field-error" : ""
                }`}
              />
              {validationErrors.employeeName && (
                <span className="offer-input-error">
                  {validationErrors.employeeName}
                </span>
              )}
            </div>

            <div className="offer-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g., inuvil, Jaffna"
                className={`offer-input${
                  validationErrors.address ? " offer-field-error" : ""
                }`}
              />
              {validationErrors.address && (
                <span className="offer-input-error">
                  {validationErrors.address}
                </span>
              )}
            </div>

            <div className="offer-group">
              <label>Date</label>
              <div
                className={`offer-date-wrapper${
                  !formData.letterDate ? " is-empty" : ""
                }`}
              >
                <input
                  type="date"
                  name="letterDate"
                  value={toDateInputValue(formData.letterDate)}
                  onChange={handleInputChange}
                  placeholder="DD/MM/YYYY"
                  className={`offer-date-input${
                    !formData.letterDate ? " is-empty" : " has-value"
                  }${validationErrors.letterDate ? " offer-field-error" : ""}`}
                />
                <span className="offer-date-icon">
                  <CalendarIcon />
                </span>
              </div>
              {validationErrors.letterDate && (
                <span className="offer-input-error">
                  {validationErrors.letterDate}
                </span>
              )}
            </div>

            {/* Row 2: Role | Date of Joining | Date of Ending */}
            <div className="offer-group">
              <label>Role</label>
              <div className="offer-select-wrapper">
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className={`offer-select${
                    validationErrors.position ? " offer-field-error" : ""
                  }`}
                >
                  <option value="">Select Role</option>
                  <option>Associate</option>
                  <option>Manager</option>
                  <option>Intern</option>
                  <option>Software Engineer</option>
                  <option>QA Engineer</option>
                  <option>Project Manager</option>
                  <option>Designer</option>
                  <option>HR Specialist</option>
                  <option>UI/UX Engineer</option>
                </select>
                <span className="offer-select-arrow">
                  <ChevronIcon />
                </span>
              </div>
              {validationErrors.position && (
                <span className="offer-input-error">
                  {validationErrors.position}
                </span>
              )}
            </div>

            <div className="offer-group">
              <label>Date of Joining</label>
              <div
                className={`offer-date-wrapper${
                  !formData.joiningDate ? " is-empty" : ""
                }`}
              >
                <input
                  type="date"
                  name="joiningDate"
                  value={toDateInputValue(formData.joiningDate)}
                  onChange={handleInputChange}
                  placeholder="DD/MM/YYYY"
                  className={`offer-date-input${
                    !formData.joiningDate ? " is-empty" : " has-value"
                  }${validationErrors.joiningDate ? " offer-field-error" : ""}`}
                />
                <span className="offer-date-icon">
                  <CalendarIcon />
                </span>
              </div>
              {validationErrors.joiningDate && (
                <span className="offer-input-error">
                  {validationErrors.joiningDate}
                </span>
              )}
            </div>

            <div className="offer-group">
              <label>Date of Ending</label>
              <div
                className={`offer-date-wrapper${
                  !formData.endDate ? " is-empty" : ""
                }`}
              >
                <input
                  type="date"
                  name="endDate"
                  value={toDateInputValue(formData.endDate)}
                  onChange={handleInputChange}
                  placeholder="DD/MM/YYYY"
                  className={`offer-date-input${
                    !formData.endDate ? " is-empty" : " has-value"
                  }${validationErrors.endDate ? " offer-field-error" : ""}`}
                />
                <span className="offer-date-icon">
                  <CalendarIcon />
                </span>
              </div>
              {validationErrors.endDate && (
                <span className="offer-input-error">
                  {validationErrors.endDate}
                </span>
              )}
            </div>

            {/* Row 3: Department | Reporting Manager | Reporting Manager Email */}
            <div className="offer-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., IT Department"
                className={`offer-input${
                  validationErrors.department ? " offer-field-error" : ""
                }`}
              />
              {validationErrors.department && (
                <span className="offer-input-error">
                  {validationErrors.department}
                </span>
              )}
            </div>

            <div className="offer-group">
              <label>Reporting Manager</label>
              <input
                type="text"
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleInputChange}
                placeholder="e.g., Sanjeevan"
                className={`offer-input${
                  validationErrors.reportingManager ? " offer-field-error" : ""
                }`}
              />
              {validationErrors.reportingManager && (
                <span className="offer-input-error">
                  {validationErrors.reportingManager}
                </span>
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
                className={`offer-input${
                  validationErrors.reportingManagerEmail
                    ? " offer-field-error"
                    : ""
                }`}
              />
              {validationErrors.reportingManagerEmail && (
                <span className="offer-input-error">
                  {validationErrors.reportingManagerEmail}
                </span>
              )}
            </div>
          </div>

          {/* Button row: Clear | Preview (right-aligned) */}
          <div className="offer-buttons">
            <button
              type="button"
              className="offer-clear-btn"
              onClick={clearForm}
            >
              Clear
            </button>
            <button
              type="button"
              className="offer-preview-btn"
              onClick={handlePreview}
              disabled={loading}
            >
              {loading ? "Generating..." : "Preview"}
            </button>
          </div>
        </form>

        {/* Save (outside the card, right-aligned) */}
        <div className="offer-actions">
          <button type="submit" className="save-btn">
            Save
          </button>
        </div>
      </div>

      {/* PDF Preview Modal — clean view (no browser PDF chrome) */}
      {showPreview && (
        <div className="pdf-modal-backdrop offer-preview-backdrop" onClick={handleClosePreview}>
          <div
            className="offer-preview-stack"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="offer-preview-close"
              onClick={handleClosePreview}
              aria-label="Close preview"
            >
              ✕
            </button>
            <div className="offer-preview-doc">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  title="Offer Letter Preview"
                  className="offer-preview-iframe"
                  scrolling="no"
                />
              ) : (
                <div className="offer-preview-loading">Loading PDF…</div>
              )}
            </div>

            <div className="offer-preview-action-row">
              <button
                type="button"
                className="offer-download-icon-btn"
                onClick={handleOpenSuccess}
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
        </div>
      )}

      {/* Success modal — opens after clicking the download-icon button */}
      {showSuccessModal &&
        ReactDOM.createPortal(
          <div
            className="ol-success-backdrop"
            onClick={() => setShowSuccessModal(false)}
          >
            <div
              className="ol-success-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ol-success-title"
            >
              <button
                type="button"
                className="ol-success-close"
                onClick={() => setShowSuccessModal(false)}
                aria-label="Close"
              >
                ✕
              </button>

              <h3 id="ol-success-title" className="ol-success-title">
                Offer letter has been generated successfully.
              </h3>
              <p className="ol-success-subtitle">
                You can download it now or Send your email for a copy.
              </p>

              <div className="ol-success-actions">
                <button
                  type="button"
                  className="ol-success-btn"
                  onClick={handleConfirmDownload}
                  disabled={loading}
                >
                  {loading ? "Generating…" : "Download"}
                </button>
                <button
                  type="button"
                  className="ol-success-btn"
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
