import React, { useState, useRef, useEffect } from "react";
import "../../../../styles/CompulsoryLeave.css";

import hcloseicon from "../../../../assets/icons/closeicon.png"; // close icon
import hselecticon from "../../../../assets/icons/selicon.png"; // icon in Leave category input
import hcalendericon from "../../../../assets/icons/calender.png"; // calendar icon in Date input
import hinicon from "../../../../assets/icons/inicon.png"; // information icon in Upload Document (Optional) label
import huploadicon from "../../../../assets/icons/upload.png"; // upload icon in Upload Document (Optional) input
import hSubmitbtn from "../../../../components/Buttons/Submit_button"; // reusable submit button

// ensure component name is capitalized when used in JSX
const SubmitButton = hSubmitbtn;

export default function CompulsoryLeave({
  onClose = () => {},
  onSubmit = () => {},
  onRefresh = null,
}) {
  // Date states & refs
  const [dateISO, setDateISO] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [dateError, setDateError] = useState("");
  const hiddenDateRef = useRef(null);
  const visibleDateRef = useRef(null);
  const composingRef = useRef(false);

  // Reason state & validation
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const reasonInputRef = useRef(null);

  // Upload state (optional)
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");

  // keep display text in sync when the ISO date changes
  useEffect(() => {
    if (dateISO) {
      setDisplayDate(formatIsoToDisplay(dateISO));
    } else {
      setDisplayDate("");
    }
  }, [dateISO]);

  /* ------------------------
     Date helper utilities
     ------------------------ */
  function formatIsoToDisplay(iso) {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${m.padStart(2, "0")}/${d.padStart(2, "0")}/${y}`;
    }
    const dt = new Date(iso);
    if (!isNaN(dt)) {
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const yyyy = dt.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    return "";
  }

  function parseDisplayToIso(text) {
    if (!text) return null;
    // match YYYY-MM-DD
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      if (isValidDateParts(y, m, d)) return `${y}-${m}-${d}`;
      return null;
    }
    // match MM/DD/YYYY or M/D/YYYY
    const mmddMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddMatch) {
      let mm = mmddMatch[1].padStart(2, "0");
      let dd = mmddMatch[2].padStart(2, "0");
      const yyyy = mmddMatch[3];
      if (isValidDateParts(yyyy, mm, dd)) return `${yyyy}-${mm}-${dd}`;
      return null;
    }
    // fallback: try Date parse
    const dt = new Date(text);
    if (!isNaN(dt)) {
      const yyyy = String(dt.getFullYear());
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }

  function isValidDateParts(y, m, d) {
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
      return false;
    if (month < 1 || month > 12) return false;
    const mdays = new Date(year, month, 0).getDate();
    if (day < 1 || day > mdays) return false;
    return true;
  }

  /* ------------------------
     Date input restrictions & handlers
     ------------------------ */

  // handle composition (IME)
  function onCompositionStart() {
    composingRef.current = true;
  }
  function onCompositionEnd(e) {
    composingRef.current = false;
    // after composition ends, sanitize full value
    handleSanitizeAndSet(e.target.value || "");
  }

  // sanitize a string to only digits and slashes and limit length to 10 (MM/DD/YYYY)
  function sanitizeDateInput(input) {
    if (!input) return "";
    const sanitized = input.replace(/[^0-9/]/g, "");
    return sanitized.slice(0, 10);
  }

  function handleSanitizeAndSet(value) {
    const cleaned = sanitizeDateInput(value);
    setDisplayDate(cleaned);
    if (cleaned) setDateError("");
  }

  function handleVisibleDateChange(e) {
    if (composingRef.current) {
      setDisplayDate(e.target.value);
      return;
    }
    handleSanitizeAndSet(e.target.value);
  }

  function handleDateKeyDown(e) {
    const ALLOWED_CONTROL_KEYS = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "Tab",
    ];
    if (ALLOWED_CONTROL_KEYS.includes(e.key)) return;
    // allow numeric keys and slash
    if (e.key.length === 1 && !/[0-9/]/.test(e.key)) {
      e.preventDefault();
    }
    // enforce max length when typing numeric/slash
    const cur =
      visibleDateRef.current && visibleDateRef.current.value
        ? visibleDateRef.current.value
        : "";
    const selectionLength =
      (visibleDateRef.current &&
        visibleDateRef.current.selectionEnd -
          visibleDateRef.current.selectionStart) ||
      0;
    if (
      cur.length - selectionLength >= 10 &&
      e.key.length === 1 &&
      /[0-9/]/.test(e.key)
    ) {
      e.preventDefault();
    }
  }

  function handleDatePaste(e) {
    e.preventDefault();
    const text =
      (e.clipboardData || window.clipboardData).getData("text") || "";
    const sanitized = sanitizeDateInput(text);
    const limited = sanitized.slice(0, 10);
    setDisplayDate(limited);
    if (limited) setDateError("");
  }

  // when visible input loses focus: attempt to parse to ISO
  function onVisibleDateBlur() {
    const text = (displayDate || "").trim();
    if (!text) {
      setDateISO("");
      setDateError("Date is required.");
      return;
    }
    const parsed = parseDisplayToIso(text);
    if (parsed) {
      setDateISO(parsed);
      if (hiddenDateRef.current) hiddenDateRef.current.value = parsed;
      setDisplayDate(formatIsoToDisplay(parsed)); // normalizes to MM/DD/YYYY
      setDateError("");
    } else {
      // invalid -> do not set "required" message (silent per requirement)
      setDateISO("");
      // keep typed text visible
    }
  }

  function openDatePicker() {
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === "function") {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
      }
    }
  }

  /* ------------------------
     Reason validation
     ------------------------ */
  function handleReasonChange(e) {
    const v = e.target.value;
    // keep a reasonable max length (for example 300) but preserve requirement
    const limited = v.slice(0, 300);
    setReason(limited);
    if (limited) setReasonError("");
  }

  /* ------------------------
     File upload (optional)
     ------------------------ */
  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFileName("");
      return;
    }
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("Please upload only PDF files.");
      setFileName("");
      e.target.value = "";
      return;
    }
    setFileError("");
    setFileName(f.name);
  }

  /* ------------------------
     Submit handler
     ------------------------ */
  function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = (displayDate || "").trim();
    if (!trimmed) {
      setDateError("Date is required.");
      if (visibleDateRef.current) visibleDateRef.current.focus();
      return;
    }
    // parse
    const parsed = parseDisplayToIso(trimmed);
    if (!parsed) {
      // silently block submit (per requirement)
      return;
    }
    if (!reason || !reason.trim()) {
      setReasonError("Reason is required.");
      setDateISO(parsed);
      setDateError("");
      if (reasonInputRef.current) reasonInputRef.current.focus();
      return;
    }
    // set ISO and clear errors
    setDateISO(parsed);
    setDateError("");
    setReasonError("");

    // Prepare payload
    const payload = {
      dateISO: parsed,
      reason: reason.trim(),
      fileName: fileName || null,
    };

    // call external onSubmit if provided, and also local onSubmit
    try {
      onSubmit(payload, onRefresh);
    } catch (err) {
      // swallow errors here — the parent component should handle
      // continue
    }
  }

  /* ------------------------
     JSX UI
     ------------------------ */
  return (
    <div className="c-overlay" role="dialog" aria-modal="true">
      <div className="c-modal">
        <button
          type="button"
          className="c-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="c-close-wrapper">
            <img src={hcloseicon} alt="Close" className="c-close-icon" />
          </span>
        </button>

        <div className="c-content">
          <h2 className="c-title">Compulsory Leave</h2>

          {/* Leave Type */}
          <label className="c-label">Leave Type</label>
          <div className="c-input c-select">
            <input
              type="text"
              readOnly
              value="Compulsory"
              aria-readonly="true"
              style={{
                border: 0,
                outline: "none",
                width: "100%",
                background: "transparent",
              }}
              maxLength={50}
            />
            <img src={hselecticon} alt="" className="c-select-icon" />
          </div>

          {/* Date field (visible + hidden) */}
          <label className="c-label">Date</label>
          <div
            className={`c-input c-date ${dateError ? "c-invalid" : ""}`}
            style={{ position: "relative" }}
          >
            <input
              ref={visibleDateRef}
              type="text"
              inputMode="numeric"
              value={displayDate}
              onChange={handleVisibleDateChange}
              onInput={(e) => {
                if (!composingRef.current) handleSanitizeAndSet(e.target.value);
              }}
              onKeyDown={handleDateKeyDown}
              onPaste={handleDatePaste}
              onBlur={onVisibleDateBlur}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              aria-label="Leave date"
              placeholder="MM/DD/YYYY"
              aria-invalid={!!dateError}
              maxLength={10}
              style={{
                border: 0,
                outline: "none",
                fontSize: 14,
                width: "100%",
                background: "transparent",
              }}
            />

            <input
              ref={hiddenDateRef}
              type="date"
              className="c-hidden-date"
              value={dateISO}
              onChange={(e) => {
                const val = e.target.value; // ISO YYYY-MM-DD
                setDateISO(val);
                if (val) {
                  setDisplayDate(formatIsoToDisplay(val));
                  setDateError("");
                }
              }}
              aria-hidden="true"
              tabIndex={-1}
            />

            <div
              className="c-date-icon-wrapper"
              onClick={openDatePicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDatePicker();
                }
              }}
              aria-label="Open date picker"
            >
              <img src={hcalendericon} alt="" className="c-date-icon" />
            </div>
          </div>
          {dateError ? (
            <div className="c-error" role="alert">
              {dateError}
            </div>
          ) : null}

          {/* Reason field */}
          <label className="c-label">Reason</label>
          <div className={`c-input c-reason ${reasonError ? "c-invalid" : ""}`}>
            <input
              ref={reasonInputRef}
              type="text"
              value={reason}
              onChange={handleReasonChange}
              onBlur={() => {
                if (!reason || !reason.trim()) {
                  setReasonError("Reason is required.");
                } else {
                  setReasonError("");
                }
              }}
              aria-label="Reason"
              placeholder="Enter reason"
              maxLength={300}
              aria-invalid={!!reasonError}
              style={{
                border: 0,
                outline: "none",
                fontSize: 14,
                width: "100%",
                background: "transparent",
              }}
            />
          </div>
          {reasonError ? (
            <div className="c-error" role="alert">
              {reasonError}
            </div>
          ) : null}

          {/* Upload row */}
          <div className="c-upload-row">
            <div className="c-pill">Upload Document (Optional)</div>
            <img src={hinicon} alt="" className="c-info-icon" />
            <span className="c-pill-txt">Please upload only PDF files.</span>
          </div>

          <div className="c-input c-upload" style={{ position: "relative" }}>
            <label className="c-upload-fake" htmlFor="c-file-input">
              {fileName || "No file chosen"}
            </label>
            <input
              id="c-file-input"
              type="file"
              style={{
                position: "absolute",
                opacity: 0,
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                cursor: "pointer",
              }}
              onChange={handleFileChange}
              aria-label="Upload document"
            />
            <img src={huploadicon} alt="" className="c-upload-icon" />
          </div>
          {fileError && (
            <span
              style={{
                color: "red",
                fontSize: "12px",
                marginTop: "4px",
                display: "block",
              }}
            >
              {fileError}
            </span>
          )}

          {/* Actions */}
          <div className="c-actions">
            {/* Use imported Submit component; if it expects props you can wire them from your app */}
            <div className="c-submit-wrapper" onClick={handleSubmit}>
              <SubmitButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}