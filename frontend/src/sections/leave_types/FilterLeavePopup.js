import React, { useEffect, useRef, useState } from "react";
import "../../styles/filter_leave_popup.css";

export default function FilterLeavePopup({ 
  onClose, 
  leaveTypeFilters = { fullDay: false, halfDay: false, hourPermission: false },
  statusFilters = { pending: false, approved: false, rejected: false },
  onLeaveTypeChange,
  onStatusChange,
  onClearAll
}) {
  const boxRef = useRef(null);

  const [localLeaveTypes, setLocalLeaveTypes] = useState(leaveTypeFilters);
  const [localStatus, setLocalStatus] = useState(statusFilters);

  useEffect(() => { setLocalLeaveTypes(leaveTypeFilters); }, [leaveTypeFilters]);
  useEffect(() => { setLocalStatus(statusFilters); }, [statusFilters]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function toggleLeaveType(key) {
    const newValue = !localLeaveTypes[key];
    setLocalLeaveTypes(prev => ({ ...prev, [key]: newValue }));
    if (onLeaveTypeChange) onLeaveTypeChange(key, newValue);
  }

  function toggleStatus(key) {
    const newValue = !localStatus[key];
    setLocalStatus(prev => ({ ...prev, [key]: newValue }));
    if (onStatusChange) onStatusChange(key, newValue);
  }

  function handleClearAll() {
    setLocalLeaveTypes({ fullDay: false, halfDay: false, hourPermission: false });
    setLocalStatus({ pending: false, approved: false, rejected: false });
    if (onClearAll) onClearAll();
  }

  const leaveTypeOptions = [
    { key: "fullDay",       label: "Full Day" },
    { key: "halfDay",       label: "Half Day" },
    { key: "hourPermission",label: "Hour Permission" },
  ];

  const statusOptions = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div ref={boxRef} className="flt-card" role="dialog" aria-label="Filter leaves">

      {/* Leave Type */}
      <div className="flt-section">
        <p className="flt-title">Leave Type</p>
        {leaveTypeOptions.map(({ key, label }) => {
          const active = localLeaveTypes[key];
          return (
            <button
              key={key}
              type="button"
              className={`flt-row${active ? " active" : ""}`}
              onClick={() => toggleLeaveType(key)}
            >
              <span className={`flt-check${active ? " active" : ""}`} aria-hidden="true" />
              <span className="flt-label-text">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Status */}
      <div className="flt-section">
        <p className="flt-title">Status</p>
        {statusOptions.map(({ key, label }) => {
          const active = localStatus[key];
          return (
            <button
              key={key}
              type="button"
              className={`flt-row${active ? " active" : ""}`}
              onClick={() => toggleStatus(key)}
            >
              <span className={`flt-check${active ? " active" : ""}`} aria-hidden="true" />
              <span className="flt-label-text">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Clear all */}
      <button type="button" className="flt-clear" onClick={handleClearAll}>
        Clear all
      </button>
    </div>
  );
}
