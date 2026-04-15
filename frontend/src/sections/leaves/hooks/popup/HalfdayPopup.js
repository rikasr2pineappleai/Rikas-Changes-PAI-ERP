// halfday.js
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../../../../context/ToastContext";
import { createPortal } from "react-dom";
import "../../../../styles/HalfdayPopup.css";
import hcloseicon from "../../../../assets/icons/closeicon.png";
import hselecticon from "../../../../assets/icons/drop.png";
import hcalendericon from "../../../../assets/icons/calender.png";
import hinicon from "../../../../assets/icons/inicon.png";
import huploadicon from "../../../../assets/icons/upload.png";
import HSubmitbtn from "../../../../components/Buttons/Submit_button";
import { createHalfdayLeaveRequest } from "../../../../integration/leavesAPI";

const timeOptions = ["1st Half", "2nd Half"];
const reasonOptions = ["Sick", "Emergency", "Casual", "Others"];

// Gap (in px) between toggle and portal menu. Change this to increase/decrease the vertical spacing.
const MENU_GAP = 16;

const Halfday = ({ onClose = () => {}, onRefresh = null }) => {
  const { showToast } = useToast();
  // States and refs for date
  const [dateISO, setDateISO] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [dateError, setDateError] = useState("");
  const hiddenDateRef = useRef(null);
  const visibleDateRef = useRef(null);
  const composingRef = useRef(false); // for IME/composition handling

  // States for other fields
  const [leaveCategory, setLeaveCategory] = useState("Half Day");
  const [startTime, setStartTime] = useState("");
  const [startTimeError, setStartTimeError] = useState("");
  // Reason as a combination of chosen option and typed text
  const [reasonOption, setReasonOption] = useState(""); // chosen option from dropdown
  const [reason, setReason] = useState(""); // typed reason if 'Others'
  const [reasonError, setReasonError] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [fileError, setFileError] = useState("");

  // ---------- ADD FIXED HIDDEN VALUE HERE ----------
  const numberOfDays = 0.5; // fixed value, not editable by user (hidden input will contain this)

  // Map reason label -> backend id
  const reasonIdMap = {
    Sick: 22,
    Casual: 23,
    Others: 24,
    Emergency: 25,
  };

  // Dropdown open state
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isReasonOpen, setIsReasonOpen] = useState(false);

  // Refs to toggle buttons
  const timeToggleRef = useRef(null);
  const reasonToggleRef = useRef(null);

  // Refs to menu DOM nodes (portal nodes)
  const timeMenuRef = useRef(null);
  const reasonMenuRef = useRef(null);

  // Inline styles for portal menus (top, left, width)
  const [timeMenuStyle, setTimeMenuStyle] = useState(null);
  const [reasonMenuStyle, setReasonMenuStyle] = useState(null);

  // reason inline input ref
  const reasonInputRef = useRef(null);

  // Keep display text in sync when the ISO date changes
  useEffect(() => {
    if (dateISO) {
      setDisplayDate(formatIsoToDisplay(dateISO));
    } else {
      setDisplayDate("");
    }
  }, [dateISO]);

  // Disable page scroll while popup is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);

  // Close on ESC (also close dropdowns)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isTimeOpen) setIsTimeOpen(false);
        else if (isReasonOpen) setIsReasonOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, isTimeOpen, isReasonOpen]);

  // Close dropdowns when clicking outside (works with portal menus)
  useEffect(() => {
    function onDocClick(e) {
      const target = e.target;
      // time
      if (isTimeOpen) {
        const toggle = timeToggleRef.current;
        const menu = timeMenuRef.current;
        if (
          toggle &&
          menu &&
          !toggle.contains(target) &&
          !menu.contains(target)
        ) {
          setIsTimeOpen(false);
        }
      }
      // reason
      if (isReasonOpen) {
        const toggle = reasonToggleRef.current;
        const menu = reasonMenuRef.current;
        if (
          toggle &&
          menu &&
          !toggle.contains(target) &&
          !menu.contains(target)
        ) {
          setIsReasonOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isTimeOpen, isReasonOpen]);

  /* -------- Date helpers (unchanged) -------- */
  function onCompositionStart() {
    composingRef.current = true;
  }
  function onCompositionEnd(e) {
    composingRef.current = false;
    handleSanitizeAndSet(e.target.value || "");
  }
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
    if (e.key.length === 1 && !/[0-9/]/.test(e.key)) {
      e.preventDefault();
    }
    const cur = visibleDateRef.current?.value || "";
    const selectionLength =
      visibleDateRef.current?.selectionEnd -
        visibleDateRef.current?.selectionStart || 0;
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
  function openDatePicker() {
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === "function") {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
      }
    }
  }
  function onHiddenDateChange(e) {
    const val = e.target.value;
    setDateISO(val);
    if (val) setDateError("");
  }
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
      setDisplayDate(formatIsoToDisplay(parsed));
      setDateError("");
    } else {
      setDateISO("");
      setDateError("Invalid date format.");
    }
  }
  function parseDisplayToIso(text) {
    if (!text) return null;
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      if (isValidDateParts(y, m, d)) return `${y}-${m}-${d}`;
      return null;
    }
    const mmddMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddMatch) {
      let mm = mmddMatch[1].padStart(2, "0");
      let dd = mmddMatch[2].padStart(2, "0");
      const yyyy = mmddMatch[3];
      if (isValidDateParts(yyyy, mm, dd)) return `${yyyy}-${mm}-${dd}`;
      return null;
    }
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

  /* ---------------- Reason handlers ---------------- */
  function toggleReasonDropdown() {
    setIsReasonOpen((v) => {
      const next = !v;
      if (next) positionReasonMenu();
      return next;
    });
  }
  function selectReasonOption(option) {
    setReasonOption(option);
    setReasonError("");
    setIsReasonOpen(false);

    if (option === "Others") {
      setReason("");
      // focus inline input after menu closes
      setTimeout(() => reasonInputRef.current?.focus(), 0);
    } else {
      setReason(option);
    }
  }
  function onReasonToggleKeyDown(e) {
    // When toggle wrapper is focused and user presses Enter/Space, open dropdown
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleReasonDropdown();
    }
  }

  /* ---------------- Start time handlers ---------------- */
  function toggleTimeDropdown() {
    setIsTimeOpen((v) => {
      const next = !v;
      if (next) positionTimeMenu();
      return next;
    });
  }
  function selectTime(option) {
    setStartTime(option);
    setStartTimeError("");
    setIsTimeOpen(false);
  }
  function onStartTimeBlur() {
    if (!startTime) setStartTimeError("Leave session is required.");
    else setStartTimeError("");
  }

  // keydown for time toggle (same as reason but separate for clarity)
  function onTimeToggleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTimeDropdown();
    }
  }
  /* ---------------- File ---------------- */
  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const isPdf =
      f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("Please upload only PDF files.");
      setUploadFile(null);
      e.target.value = "";
      return;
    }
    setFileError("");
    setUploadFile(f);
  }

  /* ---------------- Positioning helpers for portal menus --------------- */
  function getToggleRect(toggleEl) {
    if (!toggleEl) return null;
    return toggleEl.getBoundingClientRect();
  }

  function positionTimeMenu() {
    const toggle = timeToggleRef.current;
    if (!toggle) return;
    const rect = getToggleRect(toggle);
    if (!rect) return;
    // Use toggle width so menu lines up exactly with the input
    const viewportPad = 24; // small padding both sides
    const maxAllowed = window.innerWidth - viewportPad;
    const menuWidth = Math.max(120, Math.min(rect.width, maxAllowed));
    const desiredLeft = rect.left + window.scrollX;
    const maxLeft = window.scrollX + window.innerWidth - menuWidth - 12;
    const left = Math.max(window.scrollX + 8, Math.min(desiredLeft, maxLeft));
    const top = rect.bottom + window.scrollY + MENU_GAP; // <-- use MENU_GAP
    setTimeMenuStyle({
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 2147483647,
    });
  }

  // UPDATED function: align reason menu's right edge to the toggle's right edge on narrow screens
  function positionReasonMenu() {
    const toggle = reasonToggleRef.current;
    if (!toggle) return;
    const rect = getToggleRect(toggle);
    if (!rect) return;

    const viewportPad = 24;
    const viewportAvailable = window.innerWidth - viewportPad;

    // On narrow screens prefer a slightly larger minimum so menu is usable
    const minWidth = window.innerWidth <= 1024 ? 240 : 160;
    const menuWidth = Math.max(
      minWidth,
      Math.min(rect.width, viewportAvailable)
    );

    const desiredLeft = rect.left + window.scrollX;
    const maxLeft = window.scrollX + window.innerWidth - menuWidth - 12;

    let left;
    if (window.innerWidth <= 1024) {
      // Align the menu's right edge to the toggle's right edge (so it appears to the right)
      left = rect.right + window.scrollX - menuWidth;
    } else {
      // Desktop behavior: align to the toggle's left
      left = desiredLeft;
    }

    // Clamp to viewport
    left = Math.max(window.scrollX + 8, Math.min(left, maxLeft));
    const top = rect.bottom + window.scrollY + MENU_GAP;

    setReasonMenuStyle({
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: 2147483647,
    });
  }

  // reposition menus on resize/scroll while open
  useEffect(() => {
    function onScrollResize() {
      if (isTimeOpen) positionTimeMenu();
      if (isReasonOpen) positionReasonMenu();
    }
    window.addEventListener("resize", onScrollResize);
    window.addEventListener("scroll", onScrollResize, true); // true to catch scroll on parents
    return () => {
      window.removeEventListener("resize", onScrollResize);
      window.removeEventListener("scroll", onScrollResize, true);
    };
  }, [isTimeOpen, isReasonOpen]);

  /* ---------------- Submit ---------------- */
  function handleSubmit(e) {
    e.preventDefault();
    let hasError = false;
    let resolvedDateISO = dateISO;

    if (!displayDate.trim()) {
      setDateError("Date is required.");
      resolvedDateISO = "";
      hasError = true;
    } else {
      const parsed = parseDisplayToIso(displayDate.trim());
      if (!parsed) {
        setDateError("Invalid date format.");
        resolvedDateISO = "";
        hasError = true;
      } else {
        resolvedDateISO = parsed;
        setDateISO(parsed);
        setDateError("");
      }
    }

    if (!startTime) {
      setStartTimeError("Leave session is required.");
      hasError = true;
    } else {
      setStartTimeError("");
    }

    if (!reasonOption) {
      setReasonError("Reason is required.");
      hasError = true;
    } else if (reasonOption === "Others" && !reason.trim()) {
      setReasonError("Reason is required.");
      hasError = true;
    } else setReasonError("");

    if (hasError) {
      if (!resolvedDateISO && visibleDateRef.current) {
        visibleDateRef.current.focus();
      } else if (!startTime && timeToggleRef.current) {
        timeToggleRef.current.focus();
      } else if (reasonToggleRef.current) {
        reasonToggleRef.current.focus();
      }
      return;
    }

    const finalReason =
      reasonOption === "Others" ? reason.trim() : reasonOption;
    setReason(finalReason);
    const reasonId = reasonIdMap[reasonOption] ?? null;

    const leaveData = {
      leave_type_id: String(reasonId),
      leave_mode: "half_day",
      start_date: resolvedDateISO,
      leave_session: startTime,
      reason: finalReason,
      number_of_days: String(numberOfDays),
    };
    if (uploadFile) leaveData.document = uploadFile;

    createHalfdayLeaveRequest(leaveData)
      .then((data) => {
        if (data.success) {
          showToast(
            "Half day leave request submitted successfully!",
            "success"
          );

          // Call refresh callback if provided
          if (onRefresh && typeof onRefresh === "function") {
            onRefresh();
          }

          onClose();
        } else {
          showToast(
            "Error submitting request: " + (data.error || "Unknown error"),
            "error"
          );
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        showToast("Error submitting request: " + err.message, "error");
      });
  }

  /* ---------------- Render menus as portals ---------------- */
  function renderTimeMenu() {
    if (!isTimeOpen || !timeMenuStyle) return null;
    return createPortal(
      <div
        className="hd-select-menu hd-time-select-menu hd-select-menu--match-toggle"
        role="listbox"
        aria-label="Start time options"
        ref={(el) => (timeMenuRef.current = el)}
        style={timeMenuStyle}
      >
        {timeOptions.map((opt) => (
          <div
            key={opt}
            role="option"
            aria-selected={startTime === opt}
            className="hd-select-item hd-time-select-item"
            onClick={() => selectTime(opt)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTime(opt);
              }
            }}
            tabIndex={0}
          >
            {opt}
          </div>
        ))}
      </div>,
      document.body
    );
  }

  function renderReasonMenu() {
    if (!isReasonOpen || !reasonMenuStyle) return null;
    return createPortal(
      <div
        className="hd-select-menu hd-reason-menu hd-select-menu--match-toggle"
        role="listbox"
        aria-label="Reason options"
        ref={(el) => (reasonMenuRef.current = el)}
        style={reasonMenuStyle}
      >
        {reasonOptions.map((opt) => (
          <div
            key={opt}
            role="option"
            aria-selected={reasonOption === opt}
            className="hd-select-item"
            onClick={() => selectReasonOption(opt)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectReasonOption(opt);
              }
            }}
            tabIndex={0}
          >
            {opt}
          </div>
        ))}
      </div>,
      document.body
    );
  }

  /* -------- Render -------- */
  return (
    <div className="hd-overlay" onMouseDown={onClose} role="presentation">
      <div
        className="hd-popup"
        role="dialog"
        aria-modal="true"
        aria-label="New Leave Request"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="hd-title">New Leave Request</h2>
        <button
          className="hd-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <div className="hd-close-circle">
            <img src={hcloseicon} alt="Close" className="hd-close-icon" />
          </div>
        </button>

        <form className="hd-form" onSubmit={handleSubmit}>
          {/* Leave Category */}
          <label className="hd-label">Leave Category</label>
          <div className="hd-input hd-select" style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={leaveCategory}
              readOnly
              aria-label="Leave category"
              placeholder="Half Day"
            />
            <img src={hselecticon} alt="" className="hd-select-icon" />
          </div>

          {/* Hidden field for backend: Number of days (0.5) */}
          <label htmlFor="number_of_days" style={{ display: "none" }}>
            Number of days
          </label>
          <input
            id="number_of_days"
            name="number_of_days"
            type="hidden"
            value={numberOfDays}
          />

          {/* Date + Start Time - side-by-side wrapper */}
          <div className="hd-fields-row">
            {/* Date field */}
            <div className="hd-field">
              <label className="hd-label">Date</label>
              <div
                className={`hd-input hd-date ${dateError ? "hd-invalid" : ""}`}
              >
                <input
                  ref={visibleDateRef}
                  type="text"
                  inputMode="numeric"
                  value={displayDate}
                  onChange={handleVisibleDateChange}
                  onInput={(e) => {
                    if (!composingRef.current)
                      handleSanitizeAndSet(e.target.value);
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
                  className="hd-hidden-date"
                  value={dateISO}
                  onChange={onHiddenDateChange}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <div
                  className="hd-date-icon-wrapper"
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
                  <img src={hcalendericon} alt="" className="hd-date-icon" />
                </div>
              </div>
              {dateError && (
                <span className="hd-error" role="alert">
                  {dateError}
                </span>
              )}
            </div>

            {/* Start Time field (dropdown) */}
            <div className="hd-field">
              <label className="hd-label">Leave Session</label>
              <div
                className={`hd-input hd-select ${
                  startTimeError ? "hd-invalid" : ""
                }`}
              >
                <button
                  type="button"
                  className="hd-select-toggle hd-time-toggle"
                  onClick={() => {
                    toggleTimeDropdown();
                  }}
                  onKeyDown={onTimeToggleKeyDown}
                  onBlur={onStartTimeBlur}
                  aria-haspopup="listbox"
                  aria-expanded={isTimeOpen}
                  aria-invalid={!!startTimeError}
                  aria-label="Start time"
                  ref={timeToggleRef}
                >
                  <span className={startTime ? "" : "hd-select-placeholder"}>
                    {startTime || "Select session"}
                  </span>
                  <img
                    src={hselecticon}
                    alt=""
                    className={`hd-select-icon ${
                      isTimeOpen ? "hd-rotated" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* time menu (portal) */}
                {renderTimeMenu()}
              </div>
              {startTimeError && (
                <span className="hd-error" role="alert">
                  {startTimeError}
                </span>
              )}
            </div>
          </div>

          <label className="hd-label">Reason</label>
          <div className="hd-field" style={{ marginBottom: 12 }}>
            <div
              className={`hd-input hd-select hd-reason-select ${
                reasonError ? "hd-invalid" : ""
              }`}
            >
              {/* Wrapper acting as toggle; we use a focusable div so we can place an input inside it */}
              <div
                role="button"
                tabIndex={0}
                className="hd-select-toggle hd-reason-toggle"
                onClick={(e) => {
                  // Prevent toggling when clicking inside the inline input itself
                  if (e.target && e.target.tagName === "INPUT") return;
                  toggleReasonDropdown();
                }}
                onKeyDown={onReasonToggleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={isReasonOpen}
                aria-invalid={!!reasonError}
                aria-label="Reason"
                ref={reasonToggleRef}
              >
                {reasonOption === "Others" ? (
                  <input
                    ref={reasonInputRef}
                    className={`hd-inline-input ${
                      reasonError ? "hd-invalid" : ""
                    }`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onBlur={() => {
                      // validation on blur, same logic as before
                      if (reasonOption === "Others") {
                        if (!reason.trim())
                          setReasonError("Reason is required.");
                        else setReasonError("");
                      } else if (!reasonOption) {
                        setReasonError("Reason is required.");
                      } else setReasonError("");
                    }}
                    placeholder="Select leave reason"
                    aria-label="Other reason"
                    aria-invalid={!!reasonError}
                    // stop propagation of key events so Enter doesn't toggle the dropdown unexpectedly while typing
                    onKeyDown={(ev) => {
                      ev.stopPropagation();
                      // allow Enter to blur/finish editing instead of toggling menu
                      if (ev.key === "Enter") {
                        ev.preventDefault();
                        ev.target.blur();
                      }
                    }}
                  />
                ) : (
                  <span
                    className={!reasonOption ? "hd-select-placeholder" : ""}
                  >
                    {reasonOption || "Select leave reason"}
                  </span>
                )}

                <img
                  src={hselecticon}
                  alt=""
                  className={`hd-select-icon ${
                    isReasonOpen ? "hd-rotated" : ""
                  }`}
                  aria-hidden="true"
                />
              </div>

              {/* reason menu (portal) */}
              {renderReasonMenu()}
            </div>

            {/* show error under the control regardless of which UI path is used */}
            {reasonError && (
              <span className="hd-error" role="alert">
                {reasonError}
              </span>
            )}
          </div>

          {/* Upload Document */}
          <div className="hd-upload-row">
            <label className="hd-label" style={{ marginBottom: 0 }}>
              Upload Document (Optional)
            </label>
            <img src={hinicon} alt="Info" className="hd-info-icon" />
            <span className="hd-pill">Please Upload only PDF files</span>
          </div>
          <div className="hd-input hd-upload" style={{ marginTop: 8 }}>
            <label className="hd-upload-fake" htmlFor="file-upload">
              {uploadFile ? uploadFile.name : "Upload your proof document"}
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <img src={huploadicon} alt="Upload" className="hd-upload-icon" />
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
          <div className="hdsubmit-row">
            <HSubmitbtn type="submit" />
          </div>
        </form>
      </div>
    </div>
  );
};
export default Halfday;