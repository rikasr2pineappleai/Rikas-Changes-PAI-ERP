import React, { useEffect, useRef, useState } from "react";
import "../../styles/filter_leave_popup.css"; // keep your import

export default function FilterLeavePopup({ 
  onClose, 
  leaveTypeFilters = {
    fullDay: false,
    halfDay: false,
    hourPermission: false,
  },
  statusFilters = {
    pending: false,
    approved: false,
    rejected: false,
  },
  onLeaveTypeChange,
  onStatusChange,
  onClearAll
}) {
  const boxRef = useRef(null);

  // Initialize state with passed props
  const [localLeaveTypes, setLocalLeaveTypes] = useState(leaveTypeFilters);
  const [localStatus, setLocalStatus] = useState(statusFilters);

  // Sync with props when they change
  useEffect(() => {
    setLocalLeaveTypes(leaveTypeFilters);
  }, [leaveTypeFilters]);

  useEffect(() => {
    setLocalStatus(statusFilters);
  }, [statusFilters]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function toggleLeaveType(key) {
    const newValue = !localLeaveTypes[key];
    setLocalLeaveTypes(prev => ({ ...prev, [key]: newValue }));
    if (onLeaveTypeChange) {
      onLeaveTypeChange(key, newValue);
    }
  }

  function toggleStatus(key) {
    const newValue = !localStatus[key];
    setLocalStatus(prev => ({ ...prev, [key]: newValue }));
    if (onStatusChange) {
      onStatusChange(key, newValue);
    }
  }

  function handleClearAll() {
    setLocalLeaveTypes({
      fullDay: false,
      halfDay: false,
      hourPermission: false,
    });
    setLocalStatus({
      pending: false,
      approved: false,
      rejected: false,
    });
    if (onClearAll) {
      onClearAll();
    }
  }

  return (
    <div ref={boxRef} className="flt-card" role="dialog" aria-label="Filter leaves">
      {/* Leave Type */}
      <div className="flt-section">
        <p className="flt-title">Leave Type</p>

        <label className="flt-row" htmlFor="leave-fullDay">
          <input
            id="leave-fullDay"
            type="checkbox"
            checked={localLeaveTypes.fullDay}
            onChange={() => toggleLeaveType("fullDay")}
            aria-checked={localLeaveTypes.fullDay}
          />
          <span className="flt-label-text">Full Day</span>
        </label>

        <label className="flt-row" htmlFor="leave-halfDay">
          <input
            id="leave-halfDay"
            type="checkbox"
            checked={localLeaveTypes.halfDay}
            onChange={() => toggleLeaveType("halfDay")}
            aria-checked={localLeaveTypes.halfDay}
          />
          <span className="flt-label-text">Half Day</span>
        </label>

        <label className="flt-row" htmlFor="leave-hourPermission">
          <input
            id="leave-hourPermission"
            type="checkbox"
            checked={localLeaveTypes.hourPermission}
            onChange={() => toggleLeaveType("hourPermission")}
            aria-checked={localLeaveTypes.hourPermission}
          />
          <span className="flt-label-text">Hour Permission</span>
        </label>
      </div>

      {/* Status */}
      <div className="flt-section">
        <p className="flt-title">Status</p>

        <label className="flt-row" htmlFor="status-pending">
          <input
            id="status-pending"
            type="checkbox"
            checked={localStatus.pending}
            onChange={() => toggleStatus("pending")}
            aria-checked={localStatus.pending}
          />
          <span className="flt-label-text">Pending</span>
        </label>

        <label className="flt-row" htmlFor="status-approved">
          <input
            id="status-approved"
            type="checkbox"
            checked={localStatus.approved}
            onChange={() => toggleStatus("approved")}
            aria-checked={localStatus.approved}
          />
          <span className="flt-label-text">Approved</span>
        </label>

        <label className="flt-row" htmlFor="status-rejected">
          <input
            id="status-rejected"
            type="checkbox"
            checked={localStatus.rejected}
            onChange={() => toggleStatus("rejected")}
            aria-checked={localStatus.rejected}
          />
          <span className="flt-label-text">Rejected</span>
        </label>
      </div>

      
    </div>
  );
}
