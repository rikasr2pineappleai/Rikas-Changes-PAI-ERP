import React, { useState, useRef, useEffect } from "react";
import ErrorModal from '../../modals/ErrorModal';
import SuccessModal from '../../modals/SuccessModal';
import closeIcon from "../../assets/icons/Close.png";
import profile from "../../assets/icons/profile.png";
import proofIcon from "../../assets/icons/proof.png";
import "../../styles/hour_permission_leave_popup.css";
import { updateLeaveStatus, getLeaveRequestById, openLeaveDocument } from "../../integration/leavesAPI";
import { getEmployeeImageUrl } from "../../utils/imageUtils";

const toFiniteNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export default function FullDayLeavePopup({ data, onClose, onRefresh }) {
  // Fetch actual leave request data from database
  const [leaveRequestData, setLeaveRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const normalizeStatus = (status) => {
    if (!status) return "Pending";
    const normalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return ["Pending", "Rejected", "Approved"].includes(normalized) ? normalized : "Pending";
  };

  // Format time to "HH.MM AM/PM" (e.g. "09.00 AM", "10.00 PM")
  const formatTime = (value) => {
    if (!value) return "N/A";
    const str = String(value).trim();

    // Try to parse "HH:MM[:SS] [AM|PM]" or 24-hour "HH:MM[:SS]"
    const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2];
      let suffix = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;

      if (!suffix) {
        // 24-hour input -> derive AM/PM
        suffix = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
      }

      const hh = String(hours).padStart(2, "0");
      return `${hh}.${minutes} ${suffix}`;
    }

    // Fallback: replace any existing colon with a dot
    return str.replace(/:/g, ".");
  };

  const rejectedInputRef = useRef(null);

  const [selectedStatus, setSelectedStatus] = useState(() => normalizeStatus(data?.status));
  const [rejectedReason, setRejectedReason] = useState(() => {
    return data?.rejectionReason ?? data?.rejectedReason ?? "";
  });

  const [updating, setUpdating] = useState(false);
  
  // Modals
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [documentNotice, setDocumentNotice] = useState("");
  const [rejectedReasonError, setRejectedReasonError] = useState('');

  // Fetch leave request data when component mounts
  useEffect(() => {
    const fetchLeaveRequestData = async () => {
      if (!data?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await getLeaveRequestById(data.id);
        setLeaveRequestData(response);
      } catch (err) {
        console.error('Error fetching leave request data:', err);
        setError('Failed to load leave request data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequestData();
  }, [data?.id]);

  useEffect(() => {
    if (selectedStatus === "Rejected" && rejectedInputRef.current) {
      rejectedInputRef.current.focus();
    }
  }, [selectedStatus]);

  if (!data) return null;
  
  // Use fetched data if available, otherwise fallback to passed data
  // Merge to preserve the popup's original display fields (employee/type/from/to)
  // while still benefiting from DB fields returned by GET /leave-request/:id (User, EmployeeDetail, times, etc.)
  const displayData = leaveRequestData ? { ...data, ...leaveRequestData } : data;

  const employeeUser = displayData?.User || null;
  const avatarSrc = getEmployeeImageUrl(employeeUser, profile);

  const annualTotal = toFiniteNumber(displayData?.annualTotal);
  const annualRemaining = toFiniteNumber(displayData?.annualRemaining, annualTotal);

  const pct =
    annualTotal > 0
      ? Math.round((annualRemaining / annualTotal) * 100)
      : 0;

  const pctClamped = Math.max(0, Math.min(100, pct));

  const handleUpdateStatus = async () => {
    if (selectedStatus === "Rejected" && (!rejectedReason || rejectedReason.trim() === "")) {
      setRejectedReasonError("Rejection reason is required");
      setErrorModalMessage("Rejection reason is required");
      setErrorModalOpen(true);
      if (rejectedInputRef.current) rejectedInputRef.current.focus();
      return;
    }

    setRejectedReasonError("");

    if (!displayData.id) {
      console.error('Leave request ID is missing');
      setErrorModalMessage('Leave request ID is missing');
      setErrorModalOpen(true);
      return;
    }

    try {
      setUpdating(true);

      const payload = {
        status: selectedStatus.toLowerCase()
      };

      if (selectedStatus === "Rejected") {
        const cleanReason = rejectedReason.trim();
        payload.rejectionReason = cleanReason;
        payload.adminReason = cleanReason;
      }

      await updateLeaveStatus(displayData.id, payload);

      setSuccessModalMessage(`Leave request status updated to ${selectedStatus}`);
      setSuccessModalOpen(true);

      if (onRefresh) await onRefresh();

      setTimeout(() => {
        if (onClose) onClose();
      }, 900);
    } catch (error) {
      console.error('Error updating leave status:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Failed to update leave status. Please try again.';
      setErrorModalMessage(errorMessage);
      setErrorModalOpen(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusKey = (e, value) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedStatus(value);
    }
  };

  const handleOpenDocument = async () => {
    if (!displayData.upload_document) {
      setDocumentNotice("No document found");
      return;
    }

    const result = await openLeaveDocument(displayData.id);
    setDocumentNotice(result.success ? "" : "No document found");
  };

  return (
    <div className="hp-popup-overlay">
      <div className="hp-popup-box" role="dialog" aria-modal="true" aria-label="Leave details">

        <button className="hp-close-btn" onClick={onClose} aria-label="Close">
          <img src={closeIcon} alt="close" />
        </button>

        <div className="hp-header-row">
          <div className="hp-user-info">
            <img
              src={avatarSrc}
              alt={`${displayData.employee || 'Employee'} profile`}
              className="hp-profile-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = profile;
              }}
            />

            <div className="hp-header-text">
              <h2 className="hp-username">{displayData.employee}</h2>
              <p className="hp-role">{displayData.role || 'UI/UX Engineer'}</p>
            </div>
          </div>

          <div className="hp-annual-balance" aria-hidden={false}>
            <div className="hp-annual-top">
              <div className="hp-annual-title">Annual Leave Balance</div>

              <div className="hp-annual-days-block">
                <div className="hp-annual-days">
                  <span className="hp-annual-remaining">{annualRemaining}</span>
                  <span className="hp-annual-total">
                    / {annualTotal} days remaining
                  </span>
                </div>

                <div
                  className="hp-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pctClamped}
                >
                  <div
                    className="hp-progress-fill"
                    style={{ width: `${pctClamped}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hp-content-box">

          {/* ROW 1: Leave Type (left) | Reason (right) */}
          <div className="hp-row">
            <div>
              <label>Leave Type</label>
              <p className="hp-value">{displayData.type || 'Full Day'}</p>
            </div>

            <div>
              <label>Reason</label>
              <p className="hp-value">{displayData.reason}</p>
            </div>
          </div>

          {/* ROW 2: Date (left) | Start Time + End Time (right) */}
          <div className="hp-row">
            <div>
              <label>Date</label>
              <p className="hp-value">{loading ? 'Loading...' : error ? 'Error loading date' : (displayData.start_date || displayData.from || 'N/A')}</p>
            </div>

            <div className="hp-time-pair">
              <div className="hp-time-col">
                <label>Start Time</label>
                <p className="hp-value">{formatTime(displayData.start_time || displayData.from)}</p>
              </div>
              <div className="hp-time-divider" aria-hidden="true" />
              <div className="hp-time-col">
                <label>End Time</label>
                <p className="hp-value">{formatTime(displayData.end_time || displayData.to)}</p>
              </div>
            </div>
          </div>

          <label className="hp-status-label">Status</label>

          <div className="hp-status-proof-row">
            <div className="hp-status-box" aria-label="Leave status options">
              <div className="hp-status-option">
                <span>Pending</span>
                <span
                  className={`hp-radio pending ${selectedStatus === "Pending" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Pending")}
                  onKeyDown={(e) => handleStatusKey(e, "Pending")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Pending"}
                  aria-label="Set status to pending"
                />
              </div>

              <div className="hp-status-divider" />

              <div className="hp-status-option">
                <span>Rejected</span>
                <span
                  className={`hp-radio rejected ${selectedStatus === "Rejected" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Rejected")}
                  onKeyDown={(e) => handleStatusKey(e, "Rejected")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Rejected"}
                  aria-label="Set status to rejected"
                />
              </div>

              <div className="hp-status-divider" />

              <div className="hp-status-option">
                <span>Approved</span>
                <span
                  className={`hp-radio approved ${selectedStatus === "Approved" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Approved")}
                  onKeyDown={(e) => handleStatusKey(e, "Approved")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Approved"}
                  aria-label="Set status to approved"
                />
              </div>
            </div>

            <div className="hp-proof-column">
              <button
                className="hp-proof-btn"
                type="button"
                onClick={handleOpenDocument}
                aria-label="Open proof document"
              >
                <img src={proofIcon} alt="" />
                View Document
              </button>

              {documentNotice && (
                <p className="hp-document-notice">
                  {documentNotice}
                </p>
              )}
            </div>
          </div>

          {/* Rejection reason input - shown only when Rejected is selected */}
          <div
            className={`hp-reject-reason-row ${selectedStatus === "Rejected" ? "visible" : "hidden"}`}
            aria-hidden={selectedStatus !== "Rejected"}
          >
            <label htmlFor="rejected-reason">Reason (rejected)</label>
            <input
              id="rejected-reason"
              ref={rejectedInputRef}
              className={`hp-reject-input ${rejectedReasonError ? "error" : ""}`}
              type="text"
              placeholder="Enter the reason.."
              value={rejectedReason}
              onChange={(e) => {
                setRejectedReason(e.target.value);
                if (e.target.value.trim()) {
                  setRejectedReasonError("");
                }
              }}
              aria-label="Rejection reason"
            />
            {rejectedReasonError && (
              <p className="hp-reject-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                {rejectedReasonError}
              </p>
            )}
          </div>

          {/* Update Button */}
          <button
            className="hp-update-btn"
            onClick={handleUpdateStatus}
            disabled={updating}
            aria-disabled={updating}
          >
            {updating ? 'Updating...' : 'Update'}
          </button>

        </div>

      </div>

      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorModalMessage}
      />
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        message={successModalMessage}
      />
    </div>
  );
}
