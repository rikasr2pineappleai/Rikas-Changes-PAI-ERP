

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../../../../context/ToastContext';
import '../../../../styles/HoursPermission.css';

// Import the API function for creating hours permission leave requests
import { createHoursPermissionLeaveRequest } from '../../../../integration/leavesAPI';

import hcloseicon from '../../../../assets/icons/closeicon.png';
import hselecticon from '../../../../assets/icons/drop.png';
import hcalendericon from '../../../../assets/icons/calender.png';
import hinicon from '../../../../assets/icons/inicon.png';
import huploadicon from '../../../../assets/icons/upload.png';
import hSubmitbtn from '../../../../components/Buttons/Submit_button';

/* ----------------- Time utilities ----------------- */
function parseTimeToMinutes(t) {
  if (!t || typeof t !== 'string') return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh * 60 + mm;
}
function minutesToTimeString(mins) {
  if (mins == null || Number.isNaN(mins)) return '';
  const hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
function addMinutesToTime(t, minutesToAdd) {
  const m = parseTimeToMinutes(t);
  if (m == null) return null;
  return minutesToTimeString(m + minutesToAdd);
}
function subtractMinutesFromTime(t, minutesToSub) {
  const m = parseTimeToMinutes(t);
  if (m == null) return null;
  return minutesToTimeString(m - minutesToSub);
}
function diffMinutes(start, end) {
  const a = parseTimeToMinutes(start);
  const b = parseTimeToMinutes(end);
  if (a == null || b == null) return null;
  return b - a;
}
function isWithinMaxRange(start, end, maxHours = 3) {
  const d = diffMinutes(start, end);
  if (d == null) return false;
  return d > 0 && d <= maxHours * 60;
}
// convert minutes -> fraction of days (1 day = 8 hours = 480 minutes)
// return string with 2 decimal places (e.g. "0.13")
function computeDaysFromMinutes(minutes) {
  if (minutes == null || Number.isNaN(minutes) || minutes <= 0) return '';
  const days = minutes / 480; // 480 = 8 * 60
  const rounded = Math.round(days * 100) / 100;
  return rounded.toFixed(2);
}

/* ---------------- map reason -> leave_type_id ---------------- */
// map reason string -> leave_type_id
function getLeaveTypeId(reason) {
  if (!reason) return null;
  const r = String(reason).trim().toLowerCase();
  if (!r) return null;

  // handle exact presets + common misspelling
  if (r === 'sick') return 22;
  if (r === 'casual') return 23;
  if (r === 'emergency' || r === 'emergancy') return 25;

  // anything else (custom typed or 'others') => 24
  return 24;
}

/* ---------------- Custom Time Select (updated with min/max disabling) ---------------- */

function TimeSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select Time',
  ariaLabel,
  onOpenChange,
  minTime = null, // string 'HH:MM' - options before this are disabled
  maxTime = null, // string 'HH:MM' - options after this are disabled
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (typeof onOpenChange === 'function') onOpenChange(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  function optionDisabled(opt) {
    if (!opt) return false;
    const mins = parseTimeToMinutes(opt);
    if (mins == null) return false;
    if (minTime) {
      const minM = parseTimeToMinutes(minTime);
      if (minM != null && mins < minM) return true;
    }
    if (maxTime) {
      const maxM = parseTimeToMinutes(maxTime);
      if (maxM != null && mins > maxM) return true;
    }
    return false;
  }

  function handleButtonKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => {
        if (!listRef.current) return;
        // focus first non-disabled li
        const items = Array.from(listRef.current.querySelectorAll('li'));
        const firstEnabled = items.find((it) => it.getAttribute('aria-disabled') !== 'true');
        if (firstEnabled) firstEnabled.focus();
      }, 0);
    }
  }

  function pick(val) {
    onChange(val);
    setOpen(false);
  }

  function handleOptionKeyDown(e) {
    const current = e.target;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      let next = current.nextElementSibling;
      while (next && next.getAttribute('aria-disabled') === 'true') {
        next = next.nextElementSibling;
      }
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      let prev = current.previousElementSibling;
      while (prev && prev.getAttribute('aria-disabled') === 'true') {
        prev = prev.previousElementSibling;
      }
      if (prev) prev.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const disabled = current.getAttribute('aria-disabled') === 'true';
      if (!disabled) {
        const opt = current.getAttribute('data-value') || '';
        pick(opt);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const label = value || '';

  return (
    <div className={`h-time-select ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="h-time-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={handleButtonKeyDown}
      >
        <span className={`h-time-label ${!label ? 'h-time-placeholder' : ''}`}>
          {label || placeholder}
        </span>
        <img
          src={hselecticon}
          alt=""
          className={`h-select-icon ${open ? 'open' : ''}`}
        />
      </button>

      {open && (
        <ul className="h-time-list" role="listbox" ref={listRef}>
          {options.map((opt, i) => {
            const disabled = optionDisabled(opt);
            const isSelected = opt && value && opt === value;
            return (
              <li
                key={opt || `opt-${i}`}
                role="option"
                tabIndex={disabled ? -1 : 0}
                aria-selected={isSelected}
                aria-disabled={disabled}
                data-value={opt || ''}
                onClick={() => {
                  if (!disabled) pick(opt);
                }}
                onKeyDown={handleOptionKeyDown}
                className={`${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
              >
                {opt || 'Select Time'}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- ReasonSelect (unchanged) ---------------- */

function ReasonSelect({
  value,
  onChange,
  options = ['Sick', 'Emergency', 'Casual', 'Others'],
  placeholder = 'Select Leave reason',
  ariaLabel = 'Reason',
}) {
  const [open, setOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const customInputRef = useRef(null);

  useEffect(() => {
    const normalized = String(value || '');
    const presetFound = options.find(
      (o) => o.toLowerCase() === normalized.toLowerCase()
    );
    if (presetFound && presetFound.toLowerCase() !== 'others') {
      setIsCustom(false);
      setCustomText('');
    } else {
      if (normalized && normalized.length > 0) {
        setIsCustom(true);
        setCustomText(normalized);
      }
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  function handleButtonKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => {
        const first = listRef.current && listRef.current.querySelector('li');
        if (first) first.focus();
      }, 0);
    }
  }

  function handleOptionKeyDown(e, idx) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = e.target.nextElementSibling;
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = e.target.previousElementSibling;
      if (prev) prev.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(options[idx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function pick(opt) {
    if (String(opt).toLowerCase() === 'others') {
      setIsCustom(true);
      setCustomText('');
      onChange('');
      setOpen(false);
      setTimeout(() => {
        if (customInputRef.current) customInputRef.current.focus();
      }, 50);
    } else {
      setIsCustom(false);
      setCustomText('');
      onChange(opt);
      setOpen(false);
    }
  }

  function onCustomChange(e) {
    const txt = e.target.value;
    setCustomText(txt);
    onChange(txt);
  }

  const displayLabel =
    value && value.length > 0
      ? value
      : isCustom && customText
      ? customText
      : '';

  return (
    <div className={`h-reason-select ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="h-time-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={handleButtonKeyDown}
      >
        <span
          className={`h-time-label ${!displayLabel ? 'h-time-placeholder' : ''}`}
        >
          {displayLabel || placeholder}
        </span>
        <img
          src={hselecticon}
          alt=""
          className={`h-select-icon ${open ? 'open' : ''}`}
        />
      </button>

      {open && (
        <ul className="h-time-list" role="listbox" ref={listRef}>
          {options.map((opt, i) => (
            <li
              key={opt || `opt-${i}`}
              role="option"
              tabIndex={0}
              aria-selected={
                String(opt).toLowerCase() === String(value).toLowerCase() ||
                (String(opt).toLowerCase() === 'others' &&
                  (isCustom || (!options.includes(value) && !!value)))
              }
              onClick={() => pick(opt)}
              onKeyDown={(e) => handleOptionKeyDown(e, i)}
              className={
                String(opt).toLowerCase() === String(value).toLowerCase()
                  ? 'selected'
                  : ''
              }
            >
              {opt}
            </li>
          ))}
        </ul>
      )}

      {isCustom ? (
        <div className="h-input" style={{ marginTop: 8 }}>
          <textarea
            ref={customInputRef}
            className="h-input-text"
            placeholder="Type your reason"
            value={customText}
            onChange={onCustomChange}
            rows={3}
            maxLength={500}
            aria-label="Custom reason"
          />
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Main Popup (updated to use TimeSelect min/max) ---------------- */

export default function HoursPermissionPopup({ onClose = () => {} }) {
  const { showToast } = useToast();
  const SubmitButton = hSubmitbtn;

  // basic form state
  const category = 'Hours Permission';
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  // hidden value for backend
  const [numberOfDays, setNumberOfDays] = useState('');

  const [reason, setReason] = useState(''); // will hold preset or custom text
  const [leaveTypeId, setLeaveTypeId] = useState(null); // NEW: numeric FK for backend

  // track which dropdown is open (for z-index styling etc.)
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  // Date state & refs
  const [dateISO, setDateISO] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [dateError, setDateError] = useState('');
  const hiddenDateRef = useRef(null);
  const visibleDateRef = useRef(null);
  const composingRef = useRef(false); // IME composition guard

  // Upload
  const hiddenFileRef = useRef(null);
  const [fileName, setFileName] = useState('');

  // other validation errors
  const [timeError, setTimeError] = useState('');
  const [reasonError, setReasonError] = useState('');

  // time options (values are plain strings; shown 1:1 in the list)
  const timeOptions = [
    '',
    '07:00',
    '07:15',
    '07:30',
    '07:45',
    '08:00',
    '08:15',
    '08:30',
    '08:45',
    '09:00',
    '09:15',
    '09:30',
    '09:45',
    '10:00',
    '10:15',
    '10:30',
    '10:45',
    '11:00',
    '11:15',
    '11:30',
    '11:45',
    '12:00',
    '12:15',
    '12:30',
    '12:45',
    '13:00',
    '13:15',
    '13:30',
    '13:45',
    '14:00',
    '14:15',
    '14:30',
    '14:45',
    '15:00',
    '15:15',
    '15:30',
    '15:45',
    '16:00',
    '16:15',
    '16:30',
    '16:45',
    '17:00',
    '17:15',
    '17:30',
    '17:45',
    '18:00',
    '18:15',
    '18:30',
    '18:45',
    '19:00',
    '19:15',
    '19:30',
    '19:45',
    '20:00',
    '20:15',
    '20:30',
    '20:45',
    '21:00',
    '21:15',
    '21:30',
    '21:45',
    '22:00',
  ];

  // keep displayDate synced when dateISO changes externally
  useEffect(() => {
    if (dateISO) {
      setDisplayDate(formatIsoToDisplay(dateISO));
    } else {
      setDisplayDate('');
    }
  }, [dateISO]);

  useEffect(() => {
    if (!startTime || !endTime) {
      setNumberOfDays('');
      return;
    }
    const minutes = diffMinutes(startTime, endTime);
    if (minutes == null || minutes <= 0) {
      setNumberOfDays('');
      return;
    }
    // If the range exceeds 3 hours, keep it empty (your validation already prevents >3h)
    if (minutes > 3 * 60) {
      setNumberOfDays('');
      return;
    }
    setNumberOfDays(computeDaysFromMinutes(minutes));
  }, [startTime, endTime]);

  // update leaveTypeId whenever reason changes
  useEffect(() => {
    setLeaveTypeId(getLeaveTypeId(reason));
  }, [reason]);

  /* ---------- Date helpers (unchanged) ---------- */
  function formatIsoToDisplay(iso) {
    if (!iso) return '';
    const parts = String(iso).split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
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

  function isValidDateParts(y, m, d) {
    const year = Number(y),
      month = Number(m),
      day = Number(d);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return false;
    if (month < 1 || month > 12) return false;
    const mdays = new Date(year, month, 0).getDate();
    if (day < 1 || day > mdays) return false;
    return true;
  }

  /* returns ISO YYYY-MM-DD or null if invalid */
  function parseDisplayToIso(text) {
    if (!text) return null;
    const t = text.trim();
    const isoMatch = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      if (isValidDateParts(y, m, d)) return `${y}-${m}-${d}`;
      return null;
    }
    const mmddMatch = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddMatch) {
      let mm = mmddMatch[1].padStart(2, '0');
      let dd = mmddMatch[2].padStart(2, '0');
      const yyyy = mmddMatch[3];
      if (isValidDateParts(yyyy, mm, dd)) return `${yyyy}-${mm}-${dd}`;
      return null;
    }
    // try Date parse fallback
    const dt = new Date(t);
    if (!isNaN(dt)) {
      const yyyy = String(dt.getFullYear());
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      if (isValidDateParts(yyyy, mm, dd)) return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }

  function openDatePicker() {
    if (hiddenDateRef.current) {
      if (typeof hiddenDateRef.current.showPicker === 'function') {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
      }
    }
  }

  function onHiddenDateChange(e) {
    const val = e.target.value; // ISO YYYY-MM-DD or ''
    setDateISO(val || '');
    if (val) {
      setDisplayDate(formatIsoToDisplay(val));
      setDateError('');
    }
  }

  /* ---------- Input sanitization & IME handling (unchanged) ---------- */
  function onCompositionStart() {
    composingRef.current = true;
  }
  function onCompositionEnd(e) {
    composingRef.current = false;
    handleSanitizeAndSet(e.target.value || '');
  }

  function sanitizeDateInput(input) {
    if (!input) return '';
    // allow only digits and slash
    const sanitized = input.replace(/[^0-9/]/g, '');
    // enforce mm/dd/yyyy length limit = 10
    return sanitized.slice(0, 10);
  }

  function handleSanitizeAndSet(value) {
    const cleaned = sanitizeDateInput(value);
    setDisplayDate(cleaned);
    if (cleaned) setDateError('');
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
      return;
    }
    const cur =
      (visibleDateRef.current && visibleDateRef.current.value) || '';
    const selStart =
      (visibleDateRef.current && visibleDateRef.current.selectionStart) || 0;
    const selEnd =
      (visibleDateRef.current && visibleDateRef.current.selectionEnd) || 0;
    const selectionLength = Math.max(0, selEnd - selStart);
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
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    const sanitized = sanitizeDateInput(text);
    const limited = sanitized.slice(0, 10);
    setDisplayDate(limited);
    if (limited) setDateError('');
  }

  /* blur: parse to ISO or show required message */
  function onVisibleDateBlur() {
    const text = (displayDate || '').trim();
    if (!text) {
      setDateISO('');
      setDateError('Date is required.');
      return;
    }
    const parsed = parseDisplayToIso(text);
    if (parsed) {
      setDateISO(parsed);
      if (hiddenDateRef.current) hiddenDateRef.current.value = parsed;
      setDisplayDate(formatIsoToDisplay(parsed));
      setDateError('');
    } else {
      setDateISO('');
    }
  }

  /* ---------- Upload handlers (unchanged) ---------- */
  function onFakeUploadClick() {
    if (hiddenFileRef.current) hiddenFileRef.current.click();
  }
  function onFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setFileName(f.name);
    else setFileName('');
  }

  /* ---------- Validation helpers (modified validateReason) ---------- */
  function validateReason() {
    const t = (reason || '').trim();
    // Accept presets without min-length, accept custom only if >=5 chars
    const presets = ['sick', 'emergency', 'casual'];
    if (!t) {
      setReasonError('Reason is required.');
      return false;
    }
    if (!presets.includes(t.toLowerCase()) && t.length < 5) {
      setReasonError('Please enter at least 5 characters for custom reason.');
      return false;
    }
    setReasonError('');
    return true;
  }

  function validateTimes() {
    setTimeError('');
    if (!startTime || !endTime) {
      setTimeError('Start and end times are required.');
      return false;
    }
    if (startTime >= endTime) {
      setTimeError('End time must be later than start time.');
      return false;
    }
    const minutes = diffMinutes(startTime, endTime);
    if (minutes == null) {
      setTimeError('Invalid time selection.');
      return false;
    }
    // 3 hours = 180 minutes
    if (minutes > 3 * 60) {
      setTimeError('Maximum allowed time range is 3 hours.');
      return false;
    }
    setTimeError('');
    return true;
  }

  function validateDateOnSubmit() {
    const trimmed = (displayDate || '').trim();
    if (!trimmed) {
      setDateError('Date is required.');
      return false;
    }
    const parsed = parseDisplayToIso(trimmed);
    if (!parsed) {
      setDateISO('');
      return false;
    }
    setDateISO(parsed);
    setDateError('');
    return true;
  }

  /* ---------- Submit ---------- */
  function submitHandler(e) {
    e.preventDefault();
    const okDate = validateDateOnSubmit();
    const okReason = validateReason();
    const okTimes = validateTimes();

    if (!okDate || !okReason || !okTimes) {
      return;
    }

    // compute leave_type_id from the reason text
    const computedLeaveTypeId = getLeaveTypeId(reason); // returns number or null

    // Get the file from the hidden input
    const fileInput = hiddenFileRef.current;
    const file = fileInput && fileInput.files && fileInput.files[0];

    // Create payload for API
    const payload = {
      leave_type_id: computedLeaveTypeId, // integer foreign key expected by backend
      start_date: dateISO,
      start_time: startTime,
      end_time: endTime,
      number_of_days: numberOfDays ? parseFloat(numberOfDays) : null, // send numeric or null
      reason: reason,
      leave_session: null, // leave_session is optional
    };

    // Add file to payload if it exists
    if (file) {
      payload.document = file;
    }

    // Call the API to create the hours permission leave request
    createHoursPermissionLeaveRequest(payload)
      .then((response) => {
        console.log('Hours permission leave request created:', response);
        // Show success message using toast
        showToast('Hours permission leave request submitted successfully!', 'success');
        

        
        // Close the popup
        onClose();
      })
      .catch((error) => {
        console.error('Error creating hours permission leave request:', error);
        // Show error message using toast
        let errorMessage = (error && error.message ? error.message : 'Unknown error');
        
        // Check if the error is specifically about leave balance
        if (error?.response?.data?.error && error.response.data.error.includes('Insufficient leave balance')) {
          setReasonError(error.response.data.error); // Display the specific balance error near the reason field
          errorMessage = error.response.data.error;
        }
        
        showToast('Error submitting hours permission leave request: ' + errorMessage, 'error');
      });
  }

  /* ---------- Handlers for time selection to enforce /update constraints ---------- */

  // when user chooses a start time
  function onStartTimePick(v) {
    setStartTime(v);
    setTimeError('');
    if (endTime) {
      // if current endTime is now > start + 3 hours OR <= start
      if (!isWithinMaxRange(v, endTime)) {
        // clear endTime and show hint
        setEndTime('');
        setTimeError('End time reset: must be within 3 hours of start time. Please choose an end time.');
      }
    }
  }

  // when user chooses an end time
  function onEndTimePick(v) {
    if (startTime) {
      if (!isWithinMaxRange(startTime, v)) {
        setTimeError('Maximum allowed time range is 3 hours.');
        return;
      }
    }
    setEndTime(v);
    setTimeError('');
  }

  // compute max allowed end time if startTime set (3 hours = 180 minutes)
  const maxAllowedEndTime = startTime ? addMinutesToTime(startTime, 180) : null;
  // compute min allowed start time if endTime set (end - 3h)
  const minAllowedStartTime = endTime ? subtractMinutesFromTime(endTime, 180) : null;

  return (
    <div className="h-overlay" role="dialog" aria-modal="true">
      <div className="h-popup">
        <button
          className="h-close-btn"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          <span className="h-close-circle">
            <img src={hcloseicon} alt="close" className="h-close-icon" />
          </span>
        </button>

        <h2 className="h-title">New leave request</h2>

        <form className="h-form" onSubmit={submitHandler} noValidate>
          {/* Category */}
          <label className="h-label">Leave Category</label>
          <div className="h-input h-select" style={{ position: 'relative' }}>
            <input
              type="text"
              readOnly
              value={category}
              aria-label="Leave category"
              className="h-input-text"
            />
            <img src={hselecticon} alt="" className="h-select-icon" />
          </div>

          {/* Date + Start/End time row */}
          <div className="h-row">
            <div>
              <label className="h-label">Date</label>
              <div
                className={`h-input h-date ${
                  dateError ? 'h-input-invalid' : ''
                }`}
                style={{ position: 'relative' }}
              >
                {/* visible text input */}
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
                  className="h-input-text"
                />

                {/* hidden native date input */}
                <input
                  ref={hiddenDateRef}
                  type="date"
                  className="h-hidden-date"
                  value={dateISO}
                  onChange={onHiddenDateChange}
                  aria-hidden="true"
                  tabIndex={-1}
                />

                {/* Calendar icon */}
                <div
                  className="h-date-icon-wrapper"
                  onClick={openDatePicker}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDatePicker();
                    }
                  }}
                  aria-label="Open date picker"
                >
                  <img src={hcalendericon} alt="" className="h-date-icon" />
                </div>
              </div>
              {dateError ? (
                <div className="h-error" role="alert">
                  {dateError}
                </div>
              ) : null}
            </div>

            <div>
              <label className="h-label">Start Time</label>
              <div
                className={`h-input h-time ${
                  timeError ? 'h-input-invalid' : ''
                } ${startOpen ? 'h-time-open' : ''}`}
              >
                <TimeSelect
                  value={startTime}
                  onChange={(v) => {
                    onStartTimePick(v);
                  }}
                  options={timeOptions}
                  placeholder="Select Time"
                  ariaLabel="Start time"
                  onOpenChange={(isOpen) => {
                    setStartOpen(isOpen);
                    if (isOpen) setEndOpen(false);
                  }}
                  // prevent start times earlier than end - 3h (if end chosen)
                  minTime={minAllowedStartTime}
                  iconClassName="h-select-icon-start" // UNIQUE class for start icon
                />
              </div>
            </div>

            <div>
              <label className="h-label">End Time</label>
              <div
                className={`h-input h-time ${
                  timeError ? 'h-input-invalid' : ''
                } ${endOpen ? 'h-time-open' : ''}`}
              >
                <TimeSelect
                  value={endTime}
                  onChange={(v) => {
                    onEndTimePick(v);
                  }}
                  options={timeOptions}
                  placeholder="Select Time"
                  ariaLabel="End time"
                  onOpenChange={(isOpen) => {
                    setEndOpen(isOpen);
                    if (isOpen) setStartOpen(false);
                  }}
                  // restrict endTime to be no later than start + 3h
                  maxTime={maxAllowedEndTime}
                  iconClassName="h-select-icon-end" // UNIQUE class for end icon
                />
              </div>
              {timeError ? (
                <div className="h-error" role="alert">
                  {timeError}
                </div>
              ) : null}
            </div>
          </div>

          {/* Reason (replaced textarea with ReasonSelect) */}
          <label className="h-label">Reason</label>
          <div className="h-input h-reason-input">
            <ReasonSelect
              value={reason}
              onChange={(v) => {
                setReason(v);
                if (reasonError) setReasonError('');
              }}
              options={['Sick', 'Emergency', 'Casual', 'Others']}
              placeholder="Select Leave reason"
              ariaLabel="Leave Reason"
            />
          </div>
          {reasonError ? (
            <div className="h-error" role="alert">
              {reasonError}
            </div>
          ) : null}

          {/* Upload row label + pill */}
          <div className="h-upload-row" style={{ marginTop: 12 }}>
            <label className="h-upload-label">Upload Document (Optional)</label>
            <img src={hinicon} alt="" className="h-info-icon" />
            <span className="h-pill">Please upload only PDF files.</span>
          </div>

          <div className="h-input h-upload" style={{ position: 'relative' }}>
            <div
              className="h-upload-fake"
              onClick={onFakeUploadClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onFakeUploadClick();
              }}
            >
              {fileName || 'Upload your proof document'}
            </div>

            <input
              ref={hiddenFileRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={onFileChange}
              className="h-hidden-file"
              style={{ display: 'none' }}
            />

            <img src={huploadicon} alt="upload" className="h-upload-icon" />
          </div>

          {/* Hidden field for backend: number of days (computed from start/end) */}
          <label htmlFor="number_of_days" style={{ display: 'none' }}>Number of days</label>
           <input
              id="number_of_days"
              name="number_of_days"
              type="hidden"
              value={numberOfDays}
            />

          {/* Hidden field for backend: leave_type_id */}
          <input
            type="hidden"
            name="leave_type_id"
            value={leaveTypeId ?? ''}
          />

          {/* Submit button */}
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {SubmitButton ? (
              <SubmitButton label="Submit" />
            ) : (
              <button type="submit">Submit</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}