import React, { useState, useRef, useEffect } from "react";
import ErrorModal from '../../modals/ErrorModal';
import SuccessModal from '../../modals/SuccessModal';
import closeIcon from "../../assets/icons/Close.png";
import profile from "../../assets/icons/profile.png";
import proofIcon from "../../assets/icons/proof.png";
import "../../styles/halfDay_leave_popup.css";
import { updateLeaveStatus, getLeaveRequestById, openLeaveDocument } from "../../integration/leavesAPI";
import { getEmployeeImageUrl } from "../../utils/imageUtils";

const toFiniteNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export default function FullDayLeavePopup({ data, onClose, onRefresh }) {
  // normalizer (safe when data is undefined)
  const normalizeStatus = (status) => {
    if (!status) return "Pending";
    const normalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return ["Pending", "Rejected", "Approved"].includes(normalized) ? normalized : "Pending";
  };

  
  /* -------------------------
     Hooks (always declared)
     ------------------------- */
  const rejectedInputRef = useRef(null);

  // Fetch full leave request by id (for employee profile image)
  const [leaveRequestData, setLeaveRequestData] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState(() => normalizeStatus(data?.status));
  // keep rejected reason (prefill if API provided)
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

  // autofocus when Rejected is selected
  useEffect(() => {
    if (selectedStatus === "Rejected" && rejectedInputRef.current) {
      rejectedInputRef.current.focus();
    }
  }, [selectedStatus]);

  // Load leave request (includes User -> EmployeeDetail.image_path)
  useEffect(() => {
    if (!data?.id) return;
    let isMounted = true;

    const fetchLeaveRequest = async () => {
      try {
        const response = await getLeaveRequestById(data.id);
        if (isMounted) setLeaveRequestData(response);
      } catch (err) {
        console.error("Error fetching leave request by ID:", err);
      }
    };

    fetchLeaveRequest();
    return () => {
      isMounted = false;
    };
  }, [data?.id]);

  /* -------------------------
     Early return (after hooks)
     ------------------------- */
  if (!data) return null;

  /* -------------------------
     Derived values
     ------------------------- */
  const employeeUser = leaveRequestData?.User || data?.User || null;
  const hasUploadedDocument =
    leaveRequestData?.upload_document ?? data?.upload_document ?? false;
  const avatarSrc = getEmployeeImageUrl(employeeUser, profile);

  const annualTotal = toFiniteNumber(data?.annualTotal);
  const annualRemaining = toFiniteNumber(data?.annualRemaining, annualTotal);

  const pct =
    annualTotal > 0
      ? Math.round((annualRemaining / annualTotal) * 100)
      : 0;

  const pctClamped = Math.max(0, Math.min(100, pct));

  /* -------------------------
     Handlers
     ------------------------- */
  const handleUpdateStatus = async () => {
    // validation for rejection reason
    if (selectedStatus === "Rejected" && (!rejectedReason || rejectedReason.trim() === "")) {
      setRejectedReasonError("Rejection reason is required");
      setErrorModalMessage("Rejection reason is required");
      setErrorModalOpen(true);
      if (rejectedInputRef.current) rejectedInputRef.current.focus();
      return;
    }

    setRejectedReasonError("");

    if (!data.id) {
      console.error('Leave request ID is missing');
      setErrorModalMessage('Leave request ID is missing');
      setErrorModalOpen(true);
      return;
    }

    try {
      setUpdating(true);

      // payload - include both keys just in case backend expects one of them
      const payload = {
        status: selectedStatus.toLowerCase()
      };

      if (selectedStatus === "Rejected") {
        const cleanReason = rejectedReason.trim();
        payload.rejectionReason = cleanReason;
        payload.adminReason = cleanReason; // use adminReason field for rejected requests
      }

      await updateLeaveStatus(data.id, payload);

      setSuccessModalMessage(`Leave request status updated to ${selectedStatus}`);
      setSuccessModalOpen(true);

      if (onRefresh) await onRefresh();

      // close shortly after success so user sees modal
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
    if (!hasUploadedDocument) {
      setDocumentNotice("No document found");
      return;
    }

    const result = await openLeaveDocument(data.id);
    setDocumentNotice(result.success ? "" : "No document found");
  };

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="hd-popup-overlay">
      <div className="hd-popup-box" role="dialog" aria-modal="true" aria-label="Leave details">

        {/* Close Button */}
        <button className="hd-close-btn" onClick={onClose} aria-label="Close">
          <img src={closeIcon} alt="close" />
        </button>

        {/* HEADER: left = profile+text, right = annual card */}
        <div className="hd-header-row">
          <div className="hd-user-info">
            <img
              src={avatarSrc}
              alt={`${data.employee || 'Employee'} profile`}
              className="hd-profile-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = profile;
              }}
            />

            <div className="hd-header-text">
              <h2 className="hd-username">{data.employee}</h2>
              <p className="hd-role">{data.role || 'UI/UX Engineer'}</p>
            </div>
          </div>

          {/* Annual leave card (aligned to the right automatically) */}
          <div className="hd-annual-balance" aria-hidden={false}>
            {/* Title on top, days + progress under it */}
            <div className="hd-annual-top">
              <div className="hd-annual-title">Annual Leave Balance</div>

              <div className="hd-annual-days-block">
                <div className="hd-annual-days">
                  <span className="hd-annual-remaining">{annualRemaining}</span>
                  <span className="hd-annual-total">
                    / {annualTotal} days remaining
                  </span>
                </div>

                <div
                  className="hd-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pctClamped}
                >
                  <div
                    className="hd-progress-fill"
                    style={{ width: `${pctClamped}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT / DETAILS BOX */}
        <div className="hd-content-box">

          {/* Form rows - grid with two columns so "Reason" and "End Date" sit on the right column */}
          <div className="hd-row">
            <div>
              <label>Leave Type</label>
              <p className="hd-value">{data.type || 'Full Day'}</p>
            </div>

            <div className="hd-right-column">
              <label>Reason</label>
              <p className="hd-value">{data.reason}</p>
            </div>
          </div>

          <div className="hd-row">
            <div>
              <label>Date</label>
              <p className="hd-value">{data.from}</p>
            </div>
            <div className="hd-right-column">
              <label>Leave Session</label>
              <p className="hd-end-date">{data.to}</p>
            </div>
          </div>

          {/* STATUS + PROOF (aligned horizontally) */}
          <label className="hd-status-label">Status</label>

          <div className="hd-status-proof-row">
            <div className="hd-status-box" aria-label="Leave status options">
              {/* PENDING */}
              <div className="hd-status-option">
                <span>Pending</span>

                <span
                  className={`hd-radio pending ${selectedStatus === "Pending" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Pending")}
                  onKeyDown={(e) => handleStatusKey(e, "Pending")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Pending"}
                  aria-label="Set status to pending"
                />
              </div>

              <div className="hd-status-divider" />

              {/* REJECTED */}
              <div className="hd-status-option">
                <span>Rejected</span>

                <span
                  className={`hd-radio rejected ${selectedStatus === "Rejected" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Rejected")}
                  onKeyDown={(e) => handleStatusKey(e, "Rejected")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Rejected"}
                  aria-label="Set status to rejected"
                />
              </div>

              <div className="hd-status-divider" />

              {/* APPROVED */}
              <div className="hd-status-option">
                <span>Approved</span>

                <span
                  className={`hd-radio approved ${selectedStatus === "Approved" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Approved")}
                  onKeyDown={(e) => handleStatusKey(e, "Approved")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Approved"}
                  aria-label="Set status to approved"
                />
              </div>
            </div>

            <div className="hd-proof-column">
              <button
                className="hd-proof-btn"
                type="button"
                onClick={handleOpenDocument}
                aria-label="Open proof document"
              >
                <img src={proofIcon} alt="" />
                View Document
              </button>

              {documentNotice && (
                <p className="hd-document-notice">
                  {documentNotice}
                </p>
              )}
            </div>
          </div>

          {/* Rejection reason input - shown only when Rejected is selected */}
          <div
            className={`hd-reject-reason-row ${selectedStatus === "Rejected" ? "visible" : "hidden"}`}
            aria-hidden={selectedStatus !== "Rejected"}
          >
            <label htmlFor="rejected-reason">Reason (rejected)</label>
            <input
              id="rejected-reason"
              ref={rejectedInputRef}
              className={`hd-reject-input ${rejectedReasonError ? "error" : ""}`}
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
              <p className="hd-reject-error" style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                {rejectedReasonError}
              </p>
            )}
          </div>

          {/* Update Button */}
          <button
            className="hd-update-btn"
            onClick={handleUpdateStatus}
            disabled={updating}
            aria-disabled={updating}
          >
            {updating ? 'Updating...' : 'Update'}
          </button>

        </div>

      </div>

      {/* Modals */}
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
