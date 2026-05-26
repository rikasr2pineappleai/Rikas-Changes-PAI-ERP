import React, { useState, useRef, useEffect } from "react";
import "../../../../styles/ExtendedLeave.css";

import Ecloseicon from "../../../../assets/icons/closeicon.png"; // close icon
import Eselecticon from "../../../../assets/icons/drop.png"; // icon in Leave category input
import Ecalendericon from "../../../../assets/icons/calender.png"; // calendar icon in Date input
import Einicon from "../../../../assets/icons/inicon.png"; // information icon in Upload Document (Optional) label
import Euploadicon from "../../../../assets/icons/upload.png"; // upload icon in Upload Document (Optional) input
import ESubmitbtn from "../../../../components/Buttons/Submit_button"; // reusable submit button

export default function ExtendedLeave({ onClose = () => {} }) {
  const [category] = useState("Extended Leave");

  /* START date states & refs */
  const [dateISOStart, setDateISOStart] = useState("");
  const [displayDateStart, setDisplayDateStart] = useState("");
  const [dateErrorStart, setDateErrorStart] = useState("");
  const hiddenDateRefStart = useRef(null);
  const visibleDateRefStart = useRef(null);
  const composingRefStart = useRef(false);

  /* END date states & refs */
  const [dateISOEnd, setDateISOEnd] = useState("");
  const [displayDateEnd, setDisplayDateEnd] = useState("");
  const [dateErrorEnd, setDateErrorEnd] = useState("");
  const hiddenDateRefEnd = useRef(null);
  const visibleDateRefEnd = useRef(null);
  const composingRefEnd = useRef(false);

  /* Reason */
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const reasonRef = useRef(null);

  /* File upload */
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const fileRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleFileClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e) => {
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
  };

  /* ------------------------
     Date helper utilities (shared)
     ------------------------ */
  function isValidDateParts(y, m, d) {
    const year = Number(y),
      month = Number(m),
      day = Number(d);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
      return false;
    if (month < 1 || month > 12) return false;
    const mdays = new Date(year, month, 0).getDate();
    if (day < 1 || day > mdays) return false;
    return true;
  }

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

  /* ------------------------
     Sanitize helpers (digits and slashes only)
     ------------------------ */
  function sanitizeDateInput(input) {
    if (!input) return "";
    const sanitized = input.replace(/[^0-9/]/g, "");
    return sanitized.slice(0, 10); // MM/DD/YYYY max length
  }

  /* ------------------------
     START date handlers
     ------------------------ */
  function onCompositionStartStart() {
    composingRefStart.current = true;
  }
  function onCompositionEndStart(e) {
    composingRefStart.current = false;
    handleSanitizeAndSetStart(e.target.value || "");
  }

  function handleSanitizeAndSetStart(value) {
    const cleaned = sanitizeDateInput(value);
    setDisplayDateStart(cleaned);
    if (cleaned) setDateErrorStart("");
  }

  function handleVisibleDateChangeStart(e) {
    if (composingRefStart.current) {
      setDisplayDateStart(e.target.value);
      return;
    }
    handleSanitizeAndSetStart(e.target.value);
  }

  function handleDateKeyDownStart(e) {
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
    if (e.key.length === 1 && !/[0-9/]/.test(e.key)) {
      e.preventDefault();
    }
    const cur =
      visibleDateRefStart.current && visibleDateRefStart.current.value
        ? visibleDateRefStart.current.value
        : "";
    const selectionLength =
      (visibleDateRefStart.current &&
        visibleDateRefStart.current.selectionEnd -
          visibleDateRefStart.current.selectionStart) ||
      0;
    if (
      cur.length - selectionLength >= 10 &&
      e.key.length === 1 &&
      /[0-9/]/.test(e.key)
    ) {
      e.preventDefault();
    }
  }

  function handleDatePasteStart(e) {
    e.preventDefault();
    const text =
      (e.clipboardData || window.clipboardData).getData("text") || "";
    const sanitized = sanitizeDateInput(text).slice(0, 10);
    setDisplayDateStart(sanitized);
    if (sanitized) setDateErrorStart("");
  }

  function onVisibleDateBlurStart() {
    const text = (displayDateStart || "").trim();
    if (!text) {
      setDateISOStart("");
      setDateErrorStart("Date is required.");
      if (hiddenDateRefStart.current) hiddenDateRefStart.current.value = "";
      return;
    }
    const parsed = parseDisplayToIso(text);
    if (parsed) {
      setDateISOStart(parsed);
      if (hiddenDateRefStart.current) hiddenDateRefStart.current.value = parsed;
      setDisplayDateStart(formatIsoToDisplay(parsed));
      setDateErrorStart("");
    } else {
      // invalid format: do not show validation message per requirement; keep typed text
      setDateISOStart("");
    }
  }

  /* ------------------------
     END date handlers (mirror)
     ------------------------ */
  function onCompositionStartEnd() {
    composingRefEnd.current = true;
  }
  function onCompositionEndEnd(e) {
    composingRefEnd.current = false;
    handleSanitizeAndSetEnd(e.target.value || "");
  }

  function handleSanitizeAndSetEnd(value) {
    const cleaned = sanitizeDateInput(value);
    setDisplayDateEnd(cleaned);
    if (cleaned) setDateErrorEnd("");
  }

  function handleVisibleDateChangeEnd(e) {
    if (composingRefEnd.current) {
      setDisplayDateEnd(e.target.value);
      return;
    }
    handleSanitizeAndSetEnd(e.target.value);
  }

  function handleDateKeyDownEnd(e) {
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
    if (e.key.length === 1 && !/[0-9/]/.test(e.key)) {
      e.preventDefault();
    }
    const cur =
      visibleDateRefEnd.current && visibleDateRefEnd.current.value
        ? visibleDateRefEnd.current.value
        : "";
    const selectionLength =
      (visibleDateRefEnd.current &&
        visibleDateRefEnd.current.selectionEnd -
          visibleDateRefEnd.current.selectionStart) ||
      0;
    if (
      cur.length - selectionLength >= 10 &&
      e.key.length === 1 &&
      /[0-9/]/.test(e.key)
    ) {
      e.preventDefault();
    }
  }

  function handleDatePasteEnd(e) {
    e.preventDefault();
    const text =
      (e.clipboardData || window.clipboardData).getData("text") || "";
    const sanitized = sanitizeDateInput(text).slice(0, 10);
    setDisplayDateEnd(sanitized);
    if (sanitized) setDateErrorEnd("");
  }

  function onVisibleDateBlurEnd() {
    const text = (displayDateEnd || "").trim();
    if (!text) {
      setDateISOEnd("");
      setDateErrorEnd("Date is required.");
      if (hiddenDateRefEnd.current) hiddenDateRefEnd.current.value = "";
      return;
    }
    const parsed = parseDisplayToIso(text);
    if (parsed) {
      setDateISOEnd(parsed);
      if (hiddenDateRefEnd.current) hiddenDateRefEnd.current.value = parsed;
      setDisplayDateEnd(formatIsoToDisplay(parsed));
      setDateErrorEnd("");
    } else {
      // invalid format: do not show validation message per requirement
      setDateISOEnd("");
    }
  }

  /* Reason validation: only required check (no content filtering) */
  function handleReasonChange(e) {
    setReason(e.target.value);
    if (e.target.value && e.target.value.trim().length > 0) {
      setReasonError("");
    }
  }
  function onReasonBlur() {
    if (!reason || !reason.trim()) {
      setReasonError("Reason is required.");
    } else {
      setReasonError("");
    }
  }

  /* open native date pickers */
  function openDatePicker(hiddenRef) {
    if (hiddenRef && hiddenRef.current) {
      if (typeof hiddenRef.current.showPicker === "function") {
        hiddenRef.current.showPicker();
      } else {
        hiddenRef.current.focus();
      }
    }
  }

  /* keep display text in sync when each ISO date changes (if changed programmatically) */
  useEffect(() => {
    if (dateISOStart) {
      setDisplayDateStart(formatIsoToDisplay(dateISOStart));
    }
  }, [dateISOStart]);

  useEffect(() => {
    if (dateISOEnd) {
      setDisplayDateEnd(formatIsoToDisplay(dateISOEnd));
    }
  }, [dateISOEnd]);

  /* Submit handler: show "Date is required." if left blank; silent block for invalid parsed format */
  const handleSubmit = (e) => {
    e.preventDefault();

    let ok = true;
    let resolvedStartISO = dateISOStart;
    let resolvedEndISO = dateISOEnd;

    // Start date required
    if (!displayDateStart || !displayDateStart.trim()) {
      setDateErrorStart("Date is required.");
      ok = false;
    } else {
      const parsed = parseDisplayToIso(displayDateStart.trim());
      if (!parsed) {
        // silently block submission (do not set error message)
        ok = false;
      } else {
        resolvedStartISO = parsed;
        setDateISOStart(parsed);
        setDateErrorStart("");
      }
    }

    // End date required
    if (!displayDateEnd || !displayDateEnd.trim()) {
      setDateErrorEnd("Date is required.");
      ok = false;
    } else {
      const parsed = parseDisplayToIso(displayDateEnd.trim());
      if (!parsed) {
        ok = false;
      } else {
        resolvedEndISO = parsed;
        setDateISOEnd(parsed);
        setDateErrorEnd("");
      }
    }

    // Reason required
    if (!reason || !reason.trim()) {
      setReasonError("Reason is required.");
      ok = false;
    } else {
      setReasonError("");
    }

    if (!ok) {
      if ((!displayDateStart || !displayDateStart.trim()) && visibleDateRefStart.current) {
        visibleDateRefStart.current.focus();
      } else if ((!displayDateEnd || !displayDateEnd.trim()) && visibleDateRefEnd.current) {
        visibleDateRefEnd.current.focus();
      } else if (reasonRef.current) {
        reasonRef.current.focus();
      }
      return;
    }

    // If we reach here, both dates parsed and reason provided
    const payload = {
      category,
      startDateISO: resolvedStartISO,
      startDateDisplay: formatIsoToDisplay(resolvedStartISO),
      endDateISO: resolvedEndISO,
      endDateDisplay: formatIsoToDisplay(resolvedEndISO),
      reason,
      fileName,
    };
    console.log("Submit leave request:", payload);
    onClose();
  };

  return (
    <div
      className="Epopup-overlay"
      ref={overlayRef}
      onMouseDown={handleOverlayClick}
    >
      <div
        className="Epopup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="Epopup-title"
      >
        <button
          className="Eclose-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="Eclose-circle">
            <img src={Ecloseicon} alt="close" />
          </span>
        </button>

        <h2 className="Etitle" id="Epopup-title">
          New leave request
        </h2>

        <form className="Eform" onSubmit={handleSubmit} noValidate>
          {/* Leave Type */}
          <label className="Elabel">Leave Type</label>
          <div className="Eselect">
            <input
              className="Eselect-input"
              type="text"
              readOnly
              value={category}
              onClick={() => {
                /* placeholder for open dropdown if needed */
              }}
              aria-label="Leave category"
            />
            <div
              className="Eselect-icon-wrapper"
              onClick={() => {
                /* toggle if you add dropdown */
              }}
            >
              <img className="Eselect-icon" src={Eselecticon} alt="select" />
            </div>
          </div>

          {/* Dates (using improved visible text + hidden native date) */}
          <div className="Egrid-two">
            <div>
              <label className="Elabel">Start Date</label>

              <div
                className={`EEinput Edate ${dateErrorStart ? "E-invalid" : ""}`}
                style={{ position: "relative" }}
                aria-invalid={!!dateErrorStart}
              >
                {/* VISIBLE TEXT INPUT */}
                <input
                  ref={visibleDateRefStart}
                  type="text"
                  inputMode="numeric"
                  value={displayDateStart}
                  onChange={handleVisibleDateChangeStart}
                  onInput={(e) => {
                    if (!composingRefStart.current)
                      handleSanitizeAndSetStart(e.target.value);
                  }}
                  onKeyDown={handleDateKeyDownStart}
                  onPaste={handleDatePasteStart}
                  onBlur={onVisibleDateBlurStart}
                  onCompositionStart={onCompositionStartStart}
                  onCompositionEnd={onCompositionEndStart}
                  aria-label="Start date"
                  placeholder="MM/DD/YYYY"
                  aria-invalid={!!dateErrorStart}
                  maxLength={10}
                  style={{
                    border: 0,
                    outline: "none",
                    fontSize: 14,
                    width: "100%",
                    background: "transparent",
                  }}
                />

                {/* Native date input - visually hidden but still usable programmatically */}
                <input
                  ref={hiddenDateRefStart}
                  type="date"
                  className="E-hidden-date"
                  value={dateISOStart}
                  onChange={(e) => {
                    const val = e.target.value; // ISO YYYY-MM-DD
                    setDateISOStart(val);
                    if (val) {
                      setDisplayDateStart(formatIsoToDisplay(val));
                      setDateErrorStart("");
                    }
                  }}
                  aria-hidden="true"
                  tabIndex={-1}
                />

                {/* Calendar icon (click opens native picker) */}
                <div
                  className="E-date-icon-wrapper"
                  onClick={() => openDatePicker(hiddenDateRefStart)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDatePicker(hiddenDateRefStart);
                    }
                  }}
                  aria-label="Open date picker"
                >
                  <img src={Ecalendericon} alt="" className="E-date-icon" />
                </div>
              </div>

              {dateErrorStart ? (
                <div className="E-error" role="alert">
                  {dateErrorStart}
                </div>
              ) : null}
            </div>

            <div>
              <label className="Elabel">End Date</label>
              <div
                className={`EEinput Edate ${dateErrorEnd ? "E-invalid" : ""}`}
                style={{ position: "relative" }}
                aria-invalid={!!dateErrorEnd}
              >
                {/* VISIBLE TEXT INPUT */}
                <input
                  ref={visibleDateRefEnd}
                  type="text"
                  inputMode="numeric"
                  value={displayDateEnd}
                  onChange={handleVisibleDateChangeEnd}
                  onInput={(e) => {
                    if (!composingRefEnd.current)
                      handleSanitizeAndSetEnd(e.target.value);
                  }}
                  onKeyDown={handleDateKeyDownEnd}
                  onPaste={handleDatePasteEnd}
                  onBlur={onVisibleDateBlurEnd}
                  onCompositionStart={onCompositionStartEnd}
                  onCompositionEnd={onCompositionEndEnd}
                  aria-label="End date"
                  placeholder="MM/DD/YYYY"
                  aria-invalid={!!dateErrorEnd}
                  maxLength={10}
                  style={{
                    border: 0,
                    outline: "none",
                    fontSize: 14,
                    width: "100%",
                    background: "transparent",
                  }}
                />

                {/* Native date input - visually hidden but still usable programmatically */}
                <input
                  ref={hiddenDateRefEnd}
                  type="date"
                  className="E-hidden-date"
                  value={dateISOEnd}
                  onChange={(e) => {
                    const val = e.target.value; // ISO YYYY-MM-DD
                    setDateISOEnd(val);
                    if (val) {
                      setDisplayDateEnd(formatIsoToDisplay(val));
                      setDateErrorEnd("");
                    }
                  }}
                  aria-hidden="true"
                  tabIndex={-1}
                />

                {/* Calendar icon (click opens native picker) */}
                <div
                  className="E-date-icon-wrapper"
                  onClick={() => openDatePicker(hiddenDateRefEnd)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDatePicker(hiddenDateRefEnd);
                    }
                  }}
                  aria-label="Open date picker"
                >
                  <img src={Ecalendericon} alt="" className="E-date-icon" />
                </div>
              </div>

              {dateErrorEnd ? (
                <div className="E-error" role="alert">
                  {dateErrorEnd}
                </div>
              ) : null}
            </div>
          </div>

          {/* Reason */}
          <label className="Elabel">Reason</label>
          <textarea
            ref={reasonRef}
            className={`Etextarea ${reasonError ? "E-invalid" : ""}`}
            placeholder="Enter Leave Description"
            value={reason}
            onChange={handleReasonChange}
            onBlur={onReasonBlur}
            rows={3}
            aria-invalid={!!reasonError}
          />
          {reasonError ? (
            <div className="E-error" role="alert">
              {reasonError}
            </div>
          ) : null}

          {/* Upload */}
          <div className="Eupload-row">
            <label className="Elabel">Upload Document (Optional)</label>
            <img className="Einfo-icon" src={Einicon} alt="info" />
            <div className="Epill">Please upload only PDF files.</div>
          </div>

          <div className="Eupload" onClick={handleFileClick}>
            <span className="Eupload-fake">
              {fileName || "Upload your medical certificate"}
            </span>
            <input
              type="file"
              ref={fileRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <img className="Eupload-icon" src={Euploadicon} alt="upload" />
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

          {/* Submit */}
          <div className="Esubmit-row">
            <ESubmitbtn type="submit"></ESubmitbtn>
          </div>
        </form>
      </div>
    </div>
  );
}