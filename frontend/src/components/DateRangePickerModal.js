import React, { useState, useEffect } from 'react';
import './DateRangePickerModal.css';

// Helper to format date object as DD/MM/YYYY
const formatDateStr = (dateObj) => {
  if (!dateObj) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper to parse DD/MM/YYYY string into Date object
const parseDateStr = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateRangePickerModal({
  isOpen,
  onClose,
  onApply,
  initialStartDate = '24/03/2026',
  initialEndDate = ''
}) {
  const [startDateStr, setStartDateStr] = useState(initialStartDate);
  const [endDateStr, setEndDateStr] = useState(initialEndDate);
  const [activeInput, setActiveInput] = useState('start'); // 'start' | 'end'

  // Default left month to March 2026 (matching screenshot)
  const [leftMonthDate, setLeftMonthDate] = useState(() => new Date(2026, 2, 1)); // March 2026
  const [rightMonthDate, setRightMonthDate] = useState(() => new Date(2026, 3, 1)); // April 2026

  useEffect(() => {
    if (isOpen) {
      setStartDateStr(initialStartDate || '24/03/2026');
      setEndDateStr(initialEndDate || '');
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  if (!isOpen) return null;

  const startDateObj = parseDateStr(startDateStr);
  const endDateObj = parseDateStr(endDateStr);

  // Month Navigation
  const changeMonth = (direction, isLeft) => {
    if (isLeft) {
      setLeftMonthDate((prev) => {
        const next = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
        return next;
      });
    } else {
      setRightMonthDate((prev) => {
        const next = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
        return next;
      });
    }
  };

  // Click handler for date grid cell
  const handleDateClick = (dateObj) => {
    if (activeInput === 'start') {
      setStartDateStr(formatDateStr(dateObj));
      // If start date is after current end date, clear end date
      if (endDateObj && dateObj > endDateObj) {
        setEndDateStr('');
      }
      setActiveInput('end');
    } else {
      // If user clicks date before start date, set as new start date
      if (startDateObj && dateObj < startDateObj) {
        setStartDateStr(formatDateStr(dateObj));
        setEndDateStr('');
        setActiveInput('end');
      } else {
        setEndDateStr(formatDateStr(dateObj));
        setActiveInput('start');
      }
    }
  };

  // Generate 42 cells (6 weeks) for given month date
  const generateMonthGrid = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const date = new Date(year, month - 1, dayNum);
      cells.push({ dayNum, date, isCurrentMonth: false });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const date = new Date(year, month, dayNum);
      cells.push({ dayNum, date, isCurrentMonth: true });
    }

    // Next month padding days to fill 42 cells
    const remainingCells = 42 - cells.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const date = new Date(year, month + 1, dayNum);
      cells.push({ dayNum, date, isCurrentMonth: false });
    }

    return cells;
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isInRange = (dateObj) => {
    if (!startDateObj || !endDateObj) return false;
    return dateObj > startDateObj && dateObj < endDateObj;
  };

  const handleApplyClick = () => {
    onApply(startDateStr, endDateStr);
    onClose();
  };

  return (
    <div className="date-picker-overlay" onClick={onClose}>
      <div className="date-picker-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Title */}
        <h2 className="date-picker-header-title">Select Date / Date Range</h2>

        {/* Inputs Row */}
        <div className="date-picker-inputs-row">
          {/* Start Date Input */}
          <div className="date-picker-input-field">
            <span className="date-input-label">Start Date</span>
            <div
              className={`date-input-box-wrapper ${activeInput === 'start' ? 'active' : ''}`}
              onClick={() => setActiveInput('start')}
            >
              <svg className="date-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="text"
                value={startDateStr}
                placeholder="DD/MM/YYYY"
                onChange={(e) => setStartDateStr(e.target.value)}
              />
            </div>
          </div>

          <span className="date-range-arrow">➔</span>

          {/* End Date Input */}
          <div className="date-picker-input-field">
            <span className="date-input-label">End Date</span>
            <div
              className={`date-input-box-wrapper ${activeInput === 'end' ? 'active' : ''}`}
              onClick={() => setActiveInput('end')}
            >
              <svg className="date-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="text"
                value={endDateStr}
                placeholder="DD/MM/YYYY"
                onChange={(e) => setEndDateStr(e.target.value)}
              />
            </div>
          </div>
        </div>

        <p className="date-picker-subtitle">You can type manually or select from calendar.</p>

        {/* Dual Calendars Grid */}
        <div className="dual-calendars-container">
          {/* Left Month Calendar */}
          <div className="calendar-month-card">
            <div className="calendar-month-header">
              <button
                className="month-nav-btn"
                onClick={() => changeMonth(-1, true)}
                title="Previous Month"
              >
                &lt;
              </button>
              <span className="month-year-title">
                {MONTH_NAMES[leftMonthDate.getMonth()]} {leftMonthDate.getFullYear()}
              </span>
              <button
                className="month-nav-btn"
                onClick={() => changeMonth(1, true)}
                title="Next Month"
              >
                &gt;
              </button>
            </div>

            <div className="calendar-days-header">
              <span className="day-name-col">Mon</span>
              <span className="day-name-col">Tue</span>
              <span className="day-name-col">Wed</span>
              <span className="day-name-col">Thu</span>
              <span className="day-name-col">Fri</span>
              <span className="day-name-col">Sat</span>
              <span className="day-name-col">Sun</span>
            </div>

            <div className="calendar-days-grid">
              {generateMonthGrid(leftMonthDate).map((cell, idx) => {
                const isStart = isSameDay(cell.date, startDateObj);
                const isEnd = isSameDay(cell.date, endDateObj);
                const inRange = isInRange(cell.date);

                let cellClasses = 'day-cell';
                if (!cell.isCurrentMonth) cellClasses += ' dimmed';
                if (isStart || isEnd) cellClasses += ' selected-endpoint';
                if (inRange) cellClasses += ' in-range';
                if (isStart && endDateObj) cellClasses += ' range-start';
                if (isEnd && startDateObj) cellClasses += ' range-end';

                return (
                  <div
                    key={idx}
                    className={cellClasses}
                    onClick={() => handleDateClick(cell.date)}
                  >
                    {cell.dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Month Calendar */}
          <div className="calendar-month-card">
            <div className="calendar-month-header">
              <button
                className="month-nav-btn"
                onClick={() => changeMonth(-1, false)}
                title="Previous Month"
              >
                &lt;
              </button>
              <span className="month-year-title">
                {MONTH_NAMES[rightMonthDate.getMonth()]} {rightMonthDate.getFullYear()}
              </span>
              <button
                className="month-nav-btn"
                onClick={() => changeMonth(1, false)}
                title="Next Month"
              >
                &gt;
              </button>
            </div>

            <div className="calendar-days-header">
              <span className="day-name-col">Mon</span>
              <span className="day-name-col">Tue</span>
              <span className="day-name-col">Wed</span>
              <span className="day-name-col">Thu</span>
              <span className="day-name-col">Fri</span>
              <span className="day-name-col">Sat</span>
              <span className="day-name-col">Sun</span>
            </div>

            <div className="calendar-days-grid">
              {generateMonthGrid(rightMonthDate).map((cell, idx) => {
                const isStart = isSameDay(cell.date, startDateObj);
                const isEnd = isSameDay(cell.date, endDateObj);
                const inRange = isInRange(cell.date);

                let cellClasses = 'day-cell';
                if (!cell.isCurrentMonth) cellClasses += ' dimmed';
                if (isStart || isEnd) cellClasses += ' selected-endpoint';
                if (inRange) cellClasses += ' in-range';
                if (isStart && endDateObj) cellClasses += ' range-start';
                if (isEnd && startDateObj) cellClasses += ' range-end';

                return (
                  <div
                    key={idx}
                    className={cellClasses}
                    onClick={() => handleDateClick(cell.date)}
                  >
                    {cell.dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="date-picker-footer-actions">
          <button className="btn-picker-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-picker-apply" onClick={handleApplyClick}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
