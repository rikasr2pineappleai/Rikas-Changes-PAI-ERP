import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../../../../context/ToastContext';
import '../../../../styles/Fulldaypopup.css';
import closeicon from '../../../../assets/icons/closeicon.png';
import selecticon from '../../../../assets/icons/drop.png'; // dropdown icon for reason + category
import calendericon from '../../../../assets/icons/calender.png';
import inicon from '../../../../assets/icons/inicon.png';
import uploadicon from '../../../../assets/icons/upload.png';
import Submitbtn from '../../../../components/Buttons/Submit_button';

// Import the API client and function
import { createLeaveRequest } from '../../../../integration/leavesAPI';

export default function LeavePopup({ onClose = () => {}, onSubmit = () => {}, onRefresh = null }) {
  const { showToast } = useToast();
  // Category
  const [category, setCategory] = useState('Full Day');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Start date state
  const [startDateISO, setStartDateISO] = useState('');
  const [startDisplayDate, setStartDisplayDate] = useState('');
  const [startDateError, setStartDateError] = useState('');

  // End date state
  const [endDateISO, setEndDateISO] = useState('');
  const [endDisplayDate, setEndDisplayDate] = useState('');
  const [endDateError, setEndDateError] = useState('');

  // Hidden number of days (for backend)
  const [numberOfDays, setNumberOfDays] = useState('');

  // Reason & file
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [fileName, setFileName] = useState(null);
  const [file, setFile] = useState(null);

  // Reason dropdown specifics
  const [isReasonOpen, setIsReasonOpen] = useState(false);

  // reasonEditable: when true, user can type; when false the input is readOnly and clicking the bar toggles dropdown.
  // Default: false so clicking opens options on first interaction.
  const [reasonEditable, setReasonEditable] = useState(false);

  // Form valid
  const [isFormValid, setIsFormValid] = useState(false);

  // Refs
  const selectRef = useRef(null);
  const startHiddenDateRef = useRef(null);
  const startVisibleDateRef = useRef(null);
  const endHiddenDateRef = useRef(null);
  const endVisibleDateRef = useRef(null);

  // Reason refs
  const reasonWrapperRef = useRef(null);
  const reasonInputRef = useRef(null);

  const CATEGORY_OPTIONS = ['Full Day'];
  const REASON_OPTIONS = ['Sick', 'Emergency', 'Casual', 'Others'];

  useEffect(() => {
    function handleClickOutside(e) {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
      if (reasonWrapperRef.current && !reasonWrapperRef.current.contains(e.target)) {
        setIsReasonOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // keep display in sync if ISO changed programmatically
    if (startDateISO) {
      setStartDisplayDate(formatIsoToDisplay(startDateISO));
      setStartDateError('');
    }
  }, [startDateISO]);

  useEffect(() => {
    if (endDateISO) {
      setEndDisplayDate(formatIsoToDisplay(endDateISO));
      setEndDateError('');
    }
  }, [endDateISO]);

  useEffect(() => {
    // form is valid when both ISO dates exist, end >= start, and reason ok
    const reasonOk = validateReasonSilently(reason);
    const datesOk = validateDatesSilently(startDateISO, endDateISO);
    setIsFormValid(Boolean(datesOk && reasonOk));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateISO, endDateISO, reason]);

  // compute numberOfDays whenever dates change and are valid
  useEffect(() => {
    if (validateDatesSilently(startDateISO, endDateISO)) {
      const n = calculateNumberOfDaysInclusive(startDateISO, endDateISO);
      setNumberOfDays(String(n));
    } else {
      setNumberOfDays('');
    }
  }, [startDateISO, endDateISO]);

  /* ----- Category handlers (unchanged) ----- */
  function toggleCategoryDropdown() {
    setIsCategoryOpen((s) => !s);
  }
  function handleSelectOption(option) {
    setCategory(option);
    setIsCategoryOpen(false);
  }
  function handleKeyDownOnSelect(e) {
    const currentIndex = CATEGORY_OPTIONS.indexOf(category);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (currentIndex + 1) % CATEGORY_OPTIONS.length;
      setCategory(CATEGORY_OPTIONS[next]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (currentIndex - 1 + CATEGORY_OPTIONS.length) % CATEGORY_OPTIONS.length;
      setCategory(CATEGORY_OPTIONS[prev]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsCategoryOpen((s) => !s);
    } else if (e.key === 'Escape') {
      setIsCategoryOpen(false);
    }
  }
  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFileName(f.name);
    setFile(f);
  }

  /* ----- Date controls (Start) ----- */
  function openStartDatePicker() {
    if (startHiddenDateRef.current) {
      if (typeof startHiddenDateRef.current.showPicker === 'function') {
        startHiddenDateRef.current.showPicker();
      } else {
        startHiddenDateRef.current.focus();
      }
    }
  }
  function onStartHiddenChange(e) {
    const val = e.target.value; // ISO YYYY-MM-DD or ''
    setStartDateISO(val);
    if (val) {
      setStartDisplayDate(formatIsoToDisplay(val));
      setStartDateError('');
    }
  }
  function onStartVisibleBlur() {
    const text = startDisplayDate.trim();
    if (!text) {
      setStartDateISO('');
      setStartDateError('Date is required.');
      return;
    }
    const parsedISO = parseDisplayToIso(text);
    if (parsedISO) {
      setStartDateISO(parsedISO);
      if (startHiddenDateRef.current) startHiddenDateRef.current.value = parsedISO;
      setStartDisplayDate(formatIsoToDisplay(parsedISO));
      setStartDateError('');
      // if endDate exists and is before startDate -> clear end error (we'll revalidate end)
      if (endDateISO && !isValidOrder(parsedISO, endDateISO)) {
        setEndDateError('End date must be the same or after start date.');
      } else {
        setEndDateError('');
      }
    } else {
      // silently block invalid (no required message per request)
      setStartDateISO('');
    }
  }
  function handleStartVisibleChange(e) {
    const raw = e.target.value;
    const sanitized = sanitizeDateInput(raw);
    const limited = sanitized.slice(0, 10);
    setStartDisplayDate(limited);
    if (limited) setStartDateError('');
  }

  /* ----- Date controls (End) ----- */
  function openEndDatePicker() {
    if (endHiddenDateRef.current) {
      if (typeof endHiddenDateRef.current.showPicker === 'function') {
        endHiddenDateRef.current.showPicker();
      } else {
        endHiddenDateRef.current.focus();
      }
    }
  }
  function onEndHiddenChange(e) {
    const val = e.target.value; // ISO YYYY-MM-DD or ''
    setEndDateISO(val);
    if (val) {
      setEndDisplayDate(formatIsoToDisplay(val));
      setEndDateError('');
      // re-check ordering
      if (startDateISO && !isValidOrder(startDateISO, val)) {
        setEndDateError('End date must be the same or after start date.');
      }
    }
  }
  function onEndVisibleBlur() {
    const text = endDisplayDate.trim();
    if (!text) {
      setEndDateISO('');
      setEndDateError('Date is required.');
      return;
    }
    const parsedISO = parseDisplayToIso(text);
    if (parsedISO) {
      setEndDateISO(parsedISO);
      if (endHiddenDateRef.current) endHiddenDateRef.current.value = parsedISO;
      setEndDisplayDate(formatIsoToDisplay(parsedISO));
      setEndDateError('');
      if (startDateISO && !isValidOrder(startDateISO, parsedISO)) {
        setEndDateError('End date must be the same or after start date.');
      } else {
        setEndDateError('');
      }
    } else {
      // invalid format -> silently block
      setEndDateISO('');
    }
  }
  function handleEndVisibleChange(e) {
    const raw = e.target.value;
    const sanitized = sanitizeDateInput(raw);
    const limited = sanitized.slice(0, 10);
    setEndDisplayDate(limited);
    if (limited) setEndDateError('');
  }

  /* ----- Shared date Helpers ----- */
  function sanitizeDateInput(input) {
    return (input || '').replace(/[^0-9/]/g, '');
  }
  function handleDateKeyDown(e) {
    const ALLOWED_CONTROL_KEYS = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Tab',
    ];
    if (ALLOWED_CONTROL_KEYS.includes(e.key)) return;
    if (e.key.length === 1 && !/[0-9/]/.test(e.key)) {
      e.preventDefault();
    }
  }
  function handleDatePaste(e, target = 'start') {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    const sanitized = sanitizeDateInput(text);
    const limited = sanitized.slice(0, 10);
    if (target === 'start') {
      setStartDisplayDate(limited);
      if (limited) setStartDateError('');
    } else {
      setEndDisplayDate(limited);
      if (limited) setEndDateError('');
    }
  }
  function formatIsoToDisplay(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${m}/${d}/${y}`;
    }
    const dt = new Date(iso);
    if (!isNaN(dt)) {
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const yyyy = dt.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    return '';
  }
  function parseDisplayToIso(text) {
    if (!text) return '';
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const y = isoMatch[1], m = isoMatch[2], d = isoMatch[3];
      if (isValidDateParts(y, m, d)) return `${y}-${m}-${d}`;
      return null;
    }
    const mmddMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddMatch) {
      let mm = mmddMatch[1].padStart(2, '0');
      let dd = mmddMatch[2].padStart(2, '0');
      const yyyy = mmddMatch[3];
      if (isValidDateParts(yyyy, mm, dd)) {
        return `${yyyy}-${mm}-${dd}`;
      }
      return null;
    }
    const dt = new Date(text);
    if (!isNaN(dt)) {
      const yyyy = String(dt.getFullYear());
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }
  function isValidDateParts(y, m, d) {
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return false;
    if (month < 1 || month > 12) return false;
    const mdays = new Date(year, month, 0).getDate();
    if (day < 1 || day > mdays) return false;
    return true;
  }
  function isValidOrder(startIso, endIso) {
    try {
      const s = new Date(startIso + 'T00:00:00');
      const e = new Date(endIso + 'T00:00:00');
      return e.getTime() >= s.getTime();
    } catch {
      return false;
    }
  }
  function validateDatesSilently(sIso, eIso) {
    if (!sIso || !eIso) return false;
    if (!isValidOrder(sIso, eIso)) return false;
    return true;
  }

  /* ----- Reason validation ----- */
  function validateReason(text) {
    const t = text.trim();
    if (!t) {
      setReasonError('Reason is required.');
      return false;
    }
    if (t.length < 3) {
      setReasonError('Reason too short (min 3 characters).');
      return false;
    }
    if (t.length > 400) {
      setReasonError('Reason is too long.');
      return false;
    }
    setReasonError('');
    return true;
  }
  function validateReasonSilently(text) {
    const t = (text || '').trim();
    if (!t) return false;
    if (t.length < 3) return false;
    if (t.length > 400) return false;
    return true;
  }

  /* Helper: map reason text to leave_type_id */
  function getLeaveTypeIdFromReason(reasonText, editableFlag) {
    // If user typed (Others) -> id 24
    if (editableFlag) return 24;

    const t = (reasonText || '').trim().toLowerCase();

    if (!t) return null;

    // tolerant matching
    if (t.startsWith('sick')) return 22;
    if (t.startsWith('casual')) return 23;
    // match emergency spelled correctly or common misspelling 'emergancy' or 'emerg'
    if (t.startsWith('emerg') || t.startsWith('emergan') || t.startsWith('emergenc')) return 25;

    // fallback: if text exactly equals known options
    if (t === 'sick') return 22;
    if (t === 'casual') return 23;
    if (t === 'others' || t === 'other') return 24;
    if (t === 'emergency' || t === 'emergancy') return 25;

    // unknown mapping -> null
    return null;
  }

  /* ----- Reason dropdown behaviors ----- */
  function toggleReasonDropdown() {
    setIsReasonOpen((s) => !s);
  }
  function handleReasonSelect(opt) {
    setIsReasonOpen(false);
    if (opt === 'Others') {
      // make editable
      setReason('');
      setReasonEditable(true);
      setReasonError('');
      setTimeout(() => {
        if (reasonInputRef.current) reasonInputRef.current.focus();
      }, 0);
    } else {
      setReason(opt);
      setReasonEditable(false);
      setReasonError('');
      // keep input readOnly
    }
  }

  // clicking the whole reason bar:
  function handleReasonWrapperClick(e) {
    // if editable (Others selected) -> focus input and don't toggle dropdown
    if (reasonEditable) {
      if (reasonInputRef.current) reasonInputRef.current.focus();
      return;
    }
    // else toggle dropdown
    toggleReasonDropdown();
  }

  // keyboard on wrapper: Enter/Space toggles dropdown (unless editable)
  function handleReasonWrapperKeyDown(e) {
    if (reasonEditable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleReasonDropdown();
    } else if (e.key === 'Escape') {
      setIsReasonOpen(false);
    }
  }

  /* ----- Submit ----- */
  function calculateNumberOfDaysInclusive(sIso, eIso) {
    const s = new Date(sIso + 'T00:00:00');
    const e = new Date(eIso + 'T00:00:00');
    const diffDays = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return diffDays + 1; // inclusive
  }

  function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    // Ensure start date ISO exists; else try to parse (and show required if blank)
    if (!startDateISO) {
      const trimmed = startDisplayDate.trim();
      if (!trimmed) {
        setStartDateError('Date is required.');
        return;
      }
      const parsed = parseDisplayToIso(trimmed);
      if (parsed) {
        setStartDateISO(parsed);
      } else {
        return; // silently block
      }
    }

    // Ensure end date ISO exists; else try to parse (and show required if blank)
    if (!endDateISO) {
      const trimmed = endDisplayDate.trim();
      if (!trimmed) {
        setEndDateError('Date is required.');
        return;
      }
      const parsed = parseDisplayToIso(trimmed);
      if (parsed) {
        setEndDateISO(parsed);
      } else {
        return; // silently block
      }
    }

    // order check
    if (!isValidOrder(startDateISO, endDateISO)) {
      setEndDateError('End date must be the same or after start date.');
      return;
    }

    // validate reason
    const rOk = validateReason(reason);
    if (!rOk) return;

    // ensure numberOfDays is computed (safeguard) and use it in payload
    const numDays = calculateNumberOfDaysInclusive(startDateISO, endDateISO);
    setNumberOfDays(String(numDays)); // keep hidden input in sync

    // Use the leave_type_id based on the selected reason
    const leaveTypeId = getLeaveTypeIdFromReason(reason, reasonEditable);

    if (!leaveTypeId) {
      setReasonError('Unable to determine leave type. Please select Sick, Casual, Emergency or Others.');
      return;
    }

    // Prepare payload according to backend requirements
    const payload = {
      leave_mode: 'full_day',
      number_of_days: numDays,
      start_date: startDateISO,
      end_date: endDateISO,
      reason: reason,
      leave_type_id: leaveTypeId, // <-- newly added mapping
      // user_id handled by backend middleware
    };
    
    // Add file to payload if exists
    if (file) {
      payload.document = file; // Map upload document to upload_document field
    }

    const submitLeaveRequest = async () => {
      try {
        const response = await createLeaveRequest(payload);
        if (response) {
          showToast('Leave request submitted successfully!', 'success');
          
          // Call refresh callback if provided
          if (onRefresh && typeof onRefresh === 'function') {
            onRefresh();
          }
          
          onClose(); // Close popup on success
        }
      } catch (error) {
        console.error('Error submitting leave request:', error);
        // show a helpful message if available
        let msg = error?.response?.data?.error || error?.response?.data?.message || error.message;
        
        // Check if the error is specifically about leave balance
        if (msg && msg.includes('Insufficient leave balance')) {
          setReasonError(msg); // Display the specific balance error near the reason field
        }
        
        showToast('Error submitting leave request: ' + (msg || 'Unknown error'), 'error');
      }
    };

    submitLeaveRequest();
  }

  return (
    <div className="lp-overlay" role="dialog" aria-modal="true" aria-labelledby="lp-title">
      <div className="lp-card">
        <button className="lp-close-btn" onClick={onClose} aria-label="Close">
          <span className="lp-close-circle">
            <img src={closeicon} alt="close" className="lp-close-icon" />
          </span>
        </button>
        <h2 id="lp-title" className="lp-title">New leave request</h2>
        <form className="lp-form" onSubmit={handleSubmit} noValidate>
          {/* Leave Category */}
          <label className="lp-label" htmlFor="lp-category">Leave Category</label>
          <div
            className="lp-input lp-select"
            ref={selectRef}
            onKeyDown={handleKeyDownOnSelect}
          >
            <input
              id="lp-category"
              type="text"
              readOnly
              value={category}
              aria-label="Leave category"
              aria-haspopup="listbox"
              aria-expanded={isCategoryOpen}
              onClick={toggleCategoryDropdown}
              tabIndex={0}
            />
            <img
              src={selecticon}
              alt=""
              className="lp-select-icon"
              aria-hidden="true"
              onClick={toggleCategoryDropdown}
            />
            {isCategoryOpen && (
              <div
                className="lp-select-dropdown"
                role="listbox"
                aria-label="Leave category options"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <div
                    key={opt}
                    role="option"
                    tabIndex={0}
                    className="lp-select-item"
                    aria-selected={opt === category}
                    onClick={() => handleSelectOption(opt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectOption(opt);
                      }
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dates: start + end side-by-side */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <label className="lp-label">Start Date</label>
              <div className="lp-input lp-date" style={{ position: 'relative' }}>
                <input
                  ref={startVisibleDateRef}
                  type="text"
                  value={startDisplayDate}
                  onChange={handleStartVisibleChange}
                  onBlur={onStartVisibleBlur}
                  onKeyDown={handleDateKeyDown}
                  onPaste={(e) => handleDatePaste(e, 'start')}
                  aria-label="Start date"
                  placeholder="MM/DD/YYYY"
                  aria-invalid={!!startDateError}
                  style={{
                    border: 0,
                    outline: 'none',
                    fontSize: 14,
                    width: '100%',
                    background: 'transparent',
                  }}
                />
                <input
                  ref={startHiddenDateRef}
                  type="date"
                  className="lp-hidden-date"
                  value={startDateISO}
                  onChange={onStartHiddenChange}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <div
                  className="lp-date-icon-wrapper"
                  onClick={openStartDatePicker}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openStartDatePicker();
                    }
                  }}
                  aria-label="Open start date picker"
                >
                  <img src={calendericon} alt="" className="lp-date-icon" />
                </div>
              </div>
              {startDateError && <div className="lp-error" role="alert">{startDateError}</div>}
            </div>

            <div>
              <label className="lp-label">End Date</label>
              <div className="lp-input lp-date" style={{ position: 'relative' }}>
                <input
                  ref={endVisibleDateRef}
                  type="text"
                  value={endDisplayDate}
                  onChange={handleEndVisibleChange}
                  onBlur={onEndVisibleBlur}
                  onKeyDown={handleDateKeyDown}
                  onPaste={(e) => handleDatePaste(e, 'end')}
                  aria-label="End date"
                  placeholder="MM/DD/YYYY"
                  aria-invalid={!!endDateError}
                  style={{
                    border: 0,
                    outline: 'none',
                    fontSize: 14,
                    width: '100%',
                    background: 'transparent',
                  }}
                />
                <input
                  ref={endHiddenDateRef}
                  type="date"
                  className="lp-hidden-date"
                  value={endDateISO}
                  onChange={onEndHiddenChange}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <div
                  className="lp-date-icon-wrapper"
                  onClick={openEndDatePicker}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEndDatePicker();
                    }
                  }}
                  aria-label="Open end date picker"
                >
                  <img src={calendericon} alt="" className="lp-date-icon" />
                </div>
              </div>
              {endDateError && <div className="lp-error" role="alert">{endDateError}</div>}
            </div>
          </div>

          {/* Hidden number of days input for backend */}
          {/* Label is visually hidden; input is hidden (type="hidden") so users don't see it */}
          <label htmlFor="number_of_days" style={{ display: 'none' }}>Number of days</label>
          <input
            id="number_of_days"
            name="number_of_days"
            type="hidden"
            value={numberOfDays}
            readOnly
          />

          {/* Reason - updated with input + dropdown */}
          <label className="lp-label">Reason</label>

          <div
            className="lp-reason-wrapper"
            ref={reasonWrapperRef}
            onClick={handleReasonWrapperClick}
            onKeyDown={handleReasonWrapperKeyDown}
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={isReasonOpen}
            aria-label="Reason selector"
            style={{ cursor: reasonEditable ? 'text' : 'pointer' }}
          >
            <input
              ref={reasonInputRef}
              className="lp-reason-input"
              type="text"
              placeholder="Select Leave Reason"
              value={reason}
              onChange={(e) => {
                const newValue = e.target.value;
                // only allow typing when editable
                if (!reasonEditable) return;
                setReason(newValue);
                if (newValue.trim().length > 0) setReasonError('');
              }}
              onBlur={() => validateReason(reason)}
              maxLength={400}
              aria-label="Reason for leave"
              aria-invalid={!!reasonError}
              readOnly={!reasonEditable}
              // prevent wrapper click from toggling when user clicks the editable input
              onClick={(ev) => {
                if (reasonEditable) {
                  ev.stopPropagation();
                }
              }}
              onKeyDown={(ev) => {
                // if user presses Escape while editing, blur input
                if (ev.key === 'Escape' && reasonEditable) {
                  ev.currentTarget.blur();
                }
              }}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 14,
                width: '100%',
                background: 'transparent',
                padding: 0,
              }}
            />

            {/* dropdown toggle icon (still rotates) */}
            <img
              src={selecticon}
              alt=""
              className={`lp-dropdown-icon ${isReasonOpen ? 'rotated' : ''}`}
              style={{ pointerEvents: 'none' }}
              aria-hidden="true"
            />

            {isReasonOpen && (
              <div className="lp-reason-dropdown" role="listbox" aria-label="Reason options">
                {REASON_OPTIONS.map((opt) => (
                  <div
                    key={opt}
                    role="option"
                    tabIndex={0}
                    className="lp-reason-item"
                    aria-selected={reason === opt}
                    onClick={(e) => {
                       e.stopPropagation();
                      handleReasonSelect(opt);
                      }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleReasonSelect(opt);
                      }
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
          {reasonError && <div className="lp-error" role="alert">{reasonError}</div>}

          {/* Upload Document */}
          <div className="lp-upload-row" style={{ alignItems: 'center' }}>
           <label className="lp-label">Upload Document (Optional)</label>
           <img src={inicon} alt="" className="lp-info-icon" />

           {/* pill wrapper that contains the info icon + pill text */}
            <div className="lp-pill-wrapper" aria-hidden="true">
              
              <span className="lp-pill">Please upload only PDF files.</span>
             </div>
           </div>
          <div className="lp-input lp-upload">
            <input
              id="lp-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              aria-label="Upload proof document"
            />
            <label htmlFor="lp-file" className="lp-upload-fake">
              {fileName || 'Upload your proof document'}
            </label>
            <img src={uploadicon} alt="" className="lp-upload-icon" aria-hidden="true" />
          </div>

          <div className="lp-submit-wrap">
            <Submitbtn label="Submit" onClick={handleSubmit} disabled={!isFormValid} />
          </div>
        </form>
      </div>
    </div>
  );
}