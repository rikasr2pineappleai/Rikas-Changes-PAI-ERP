// MainPopup.js
import React, { useState, useEffect, useRef } from 'react';
import '../../../../styles/Mainpopup.css';
import dropicon from '../../../../assets/icons/drop.png';
import closeicon from '../../../../assets/icons/closeicon.png'; // close icon
import Submitbtn from '../../../../components/Buttons/Submit_button';
import Fulldaypopup from '../popup/FulldayPopup';
import HoursPermissionPopup from './HoursPermission';
import Halfday from './HalfdayPopup';

const LEAVE_OPTIONS = [
  'Full Day',
  'Half Day',
  'Hours Permission',
];

export default function MainPopup({ onClose = () => {}, onRefresh = null }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selected, setSelected] = useState(''); // chosen leave type
  const [showFullDay, setShowFullDay] = useState(false);
  const [showHoursPermission, setShowHoursPermission] = useState(false);
  const [showHalfday, setShowHalfday] = useState(false); // <--- added
  const [showMainContent, setShowMainContent] = useState(true);
  const [thought, setThought] = useState(null); // used by think()
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dropdownRef = useRef(null);

  // think() - user asked to include a "think" function. It stores a short debug note and logs.
  function think(action) {
    const note = `${action} @ ${new Date().toLocaleTimeString()}`;
    setThought(note);
    // keep debug console for dev
    // eslint-disable-next-line no-console
    console.log('think:', note, { selected, dropdownOpen });
  }

  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  function toggleDropdown() {
    setDropdownOpen((s) => {
      const next = !s;
      think(next ? 'open-dropdown' : 'close-dropdown');
      // clear validation error when user opens the dropdown
      if (!s) {
        setError(false);
        setErrorMessage('');
      }
      return next;
    });
  }

  function selectOption(opt) {
    setSelected(opt);
    setDropdownOpen(false);
    // clear validation error on selection
    if (error) {
      setError(false);
      setErrorMessage('');
    }
    think(`select-${opt}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    think('submit');

    // validation: require a selection
    if (!selected) {
      setError(true);
      setErrorMessage('Select one option');
      think('validation-failed');
      // focus the dropdown for accessibility
      if (dropdownRef.current) {
        const btn = dropdownRef.current.querySelector('.mp-select');
        if (btn && typeof btn.focus === 'function') btn.focus();
      }
      return;
    }

    // Route to the specific popup based on selection
    switch (selected) {
      case 'Full Day':
        setShowMainContent(false);
        setShowFullDay(true);
        return;
      case 'Hours Permission':
        setShowMainContent(false);
        setShowHoursPermission(true);
        return;
      case 'Half Day': // <--- added handling for Half Day
        setShowMainContent(false);
        setShowHalfday(true);
        return;
      default:
        // no matching popup: just close or send data outward
        onClose();
        return;
    }
  }

  // Full Day handlers
  function handleFullDayClose() {
    setShowFullDay(false);
    onClose();
  }

  function handleFullDaySubmit(formData) {
    think('full-day-submitted');
    console.log('Submitted full day leave:', formData);
    setShowFullDay(false);
    onClose();
  }

  // Hours Permission handlers
  function handleHoursPermissionClose() {
    setShowHoursPermission(false);
    onClose();
  }

  function handleHoursPermissionSubmit(formData) {
    think('hours-permission-submitted');
    console.log('Submitted hours permission:', formData);
    setShowHoursPermission(false);
    onClose();
  }

  // Half Day handlers (added)
  function handleHalfdayClose() {
    setShowHalfday(false);
    onClose();
  }

  function handleHalfdaySubmit(formData) {
    think('halfday-submitted');
    console.log('Submitted half day leave:', formData);
    setShowHalfday(false);
    onClose();
  }

  return (
    <>
      {showMainContent && (
        <div className="mp-overlay">
          <div
            className="mp-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mp-title"
          >
            <button
              className="mp-closebtn"
              onClick={onClose}
              aria-label="Close"
            >
              <div className="close-circle">
                <img src={closeicon} alt="close" />
              </div>
            </button>

            <h2 id="mp-title" className="mp-title">
              New leave request
            </h2>

            <form className="mp-form" onSubmit={handleSubmit} noValidate>
              <label className="mp-label" htmlFor="mp-leave-select">
                Leave Type
              </label>
              <div className="mp-dropdown" ref={dropdownRef}>
                <button
                  id="mp-leave-select"
                  type="button"
                  className={`mp-select ${dropdownOpen ? 'open' : ''} ${error ? 'error' : ''}`}
                  onClick={toggleDropdown}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                  aria-invalid={error}
                  aria-describedby={error ? 'mp-error' : undefined}
                >
                  <span
                    className={`mp-placeholder ${selected ? 'has-value' : ''}`}
                  >
                    {selected || 'Choose a type for your leave'}
                  </span>
                  <img className="mp-dropicon" src={dropicon} alt="toggle" />
                </button>

                {dropdownOpen && (
                  <ul className="mp-options" role="listbox" tabIndex={-1}>
                    {LEAVE_OPTIONS.map((opt) => (
                      <li
                        key={opt}
                        className={`mp-option ${selected === opt ? 'selected' : ''}`}
                        onClick={() => selectOption(opt)}
                        role="option"
                        aria-selected={selected === opt}
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Error message shown under the dropdown */}
              {errorMessage && (
                <div id="mp-error" className="mp-error-text" role="alert" aria-live="assertive">
                  {errorMessage}
                </div>
              )}

              <div className="mp-submit-row">
                {/* Submitbtn assumed to pass through type="submit" */}
                <Submitbtn type="submit" />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render conditional popups */}
      {showFullDay && (
        <Fulldaypopup
          onClose={handleFullDayClose}
          onSubmit={handleFullDaySubmit}
          onRefresh={onRefresh}
        />
      )}

      {showHoursPermission && (
        <HoursPermissionPopup
          onClose={handleHoursPermissionClose}
          onSubmit={handleHoursPermissionSubmit}
          onRefresh={onRefresh}
        />
      )}

      {/* Half Day popup (added) */}
      {showHalfday && (
        <Halfday
          onClose={handleHalfdayClose}
          onSubmit={handleHalfdaySubmit}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}
