// src/pages/leaves.js
import React, { useState, useRef } from "react";
import pplus from '../assets/icons/+icon.png';
import LeaveStats from '../sections/leaves/LeaveStats';
import LeaveCalendar from '../sections/leaves/LeaveCalendar';
import HolidayList from '../sections/leaves/HolidayList';
import "../styles/leaves.css";
import MainPopup from "../sections/leaves/hooks/popup/Mainpopup";

/**
 * Small reusable Apply button component.
 * - label: button text
 * - onClick: handler
 */
const Apply = ({ onClick, label = "Apply" }) => {
  return (
    <button
      type="button"
      className="apply-btn"
      onClick={onClick}
      aria-label={label}
    >
      <span className="apply-icon">
        {/* icon is decorative */}
        <img src={pplus} alt="" className="plus-icon" />
      </span>

      <span className="apply-btn-text">{label}</span>
    </button>
  );
};

export default function LeavesPage() {
  // state to control MainPopup visibility
  const [showMainPopup, setShowMainPopup] = useState(false);

  // Shared calendar date — drives both the calendar view and holiday sidebar
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Refs to access LeaveCalendar and LeaveStats components' refresh functions
  const leaveCalendarRef = useRef(null);
  const leaveStatsRef = useRef(null);

  const openApplyPopup = () => {
    setShowMainPopup(true);
  };

  const closeApplyPopup = () => {
    setShowMainPopup(false);
  };
  
  // Function to refresh calendar and stats data
  const refreshData = () => {
    // Refresh calendar data
    if (leaveCalendarRef.current && typeof leaveCalendarRef.current.refreshData === 'function') {
      leaveCalendarRef.current.refreshData();
    }
    
    // Refresh stats data
    if (leaveStatsRef.current && typeof leaveStatsRef.current.refreshData === 'function') {
      leaveStatsRef.current.refreshData();
    }
  };

  return (
    <div className="page-container">
      <div className="leaves-top-section">
        <h1>Leaves</h1>
        <div className="leaves-actions">
          <Apply onClick={openApplyPopup} label="Apply Leave" />
        </div>
      </div>

      <div className="leaves-content">
        <div className="leaves-left-section">
          <LeaveStats ref={leaveStatsRef} />
          <LeaveCalendar ref={leaveCalendarRef} date={selectedDate} onDateChange={setSelectedDate} />
        </div>
        <HolidayList selectedDate={selectedDate} />
      </div>

      {/* Render MainPopup when requested */}
      {showMainPopup && <MainPopup onClose={closeApplyPopup} onRefresh={refreshData} />}
    </div>
  );
}