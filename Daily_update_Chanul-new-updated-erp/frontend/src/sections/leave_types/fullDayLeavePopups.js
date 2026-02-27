import React, { useState, useRef, useEffect } from "react";
import ErrorModal from '../../modals/ErrorModal';
import SuccessModal from '../../modals/SuccessModal';
import closeIcon from "../../assets/icons/Close.png";
import profile from "../../assets/icons/profile.png";
import proofIcon from "../../assets/icons/proof.png";
import "../../styles/fullDay_leave_popup.css";
import { updateLeaveStatus, getLeaveDocumentUrl, getLeaveRequestById } from "../../integration/leavesAPI";
import { getEmployeeImageUrl } from "../../utils/imageUtils";

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
  // Prefer actual employee image path from DB; fallback to existing icon
  // (loading/error states keep fallback behavior unchanged)
  const avatarSrc = getEmployeeImageUrl(employeeUser, profile);

  const annualRemaining =
    typeof data?.annualRemaining === "number" ? data.annualRemaining : 12;

  const annualTotal =
    typeof data?.annualTotal === "number" ? data.annualTotal : 26;

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
      setErrorModalMessage("Please enter a reason for rejection.");
      setErrorModalOpen(true);
      return;
    }

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
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to update leave status. Please try again.';
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

  /* -------------------------
     Render
     ------------------------- */
  return (
    <div className="fd-popup-overlay">
      <div className="fd-popup-box" role="dialog" aria-modal="true" aria-label="Leave details">

        {/* Close Button */}
        <button className="fd-close-btn" onClick={onClose} aria-label="Close">
          <img src={closeIcon} alt="close" />
        </button>

        {/* HEADER: left = profile+text, right = annual card */}
        <div className="fd-header-row">
          <div className="fd-user-info">
            <img
              src={avatarSrc}
              alt={`${data.employee || 'Employee'} profile`}
              className="fd-profile-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = profile;
              }}
            />

            <div className="fd-header-text">
              <h2 className="fd-username">{data.employee}</h2>
              <p className="fd-role">{data.role || 'UI/UX Engineer'}</p>
            </div>
          </div>

          {/* Annual leave card (aligned to the right automatically) */}
          <div className="fd-annual-balance" aria-hidden={false}>
            {/* Title on top, days + progress under it */}
            <div className="fd-annual-top">
              <div className="fd-annual-title">Annual Leave Balance</div>

              <div className="fd-annual-days-block">
                <div className="fd-annual-days">
                  <span className="fd-annual-remaining">{annualRemaining}</span>
                  <span className="fd-annual-total">
                    / {annualTotal} days remaining
                  </span>
                </div>

                <div
                  className="fd-progress-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pctClamped}
                >
                  <div
                    className="fd-progress-fill"
                    style={{ width: `${pctClamped}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT / DETAILS BOX */}
        <div className="fd-content-box">

          {/* Form rows - grid with two columns so "Reason" and "End Date" sit on the right column */}
          <div className="fd-row">
            <div>
              <label>Leave Type</label>
              <p className="fd-value">{data.type || 'Full Day'}</p>
            </div>

            <div className="fd-right-column">
              <label>Reason</label>
              <p className="fd-value">{data.reason}</p>
            </div>
          </div>

          <div className="fd-row">
            <div>
              <label>Start Date</label>
              <p className="fd-value">{data.from}</p>
            </div>
            <div className="fd-right-column">
              <label>End Date</label>
              <p className="fd-end-date">{data.to}</p>
            </div>
          </div>

          {/* STATUS + PROOF (aligned horizontally) */}
          <label className="fd-status-label">Status</label>

          <div className="fd-status-proof-row">
            <div className="fd-status-box" aria-label="Leave status options">
              {/* PENDING */}
              <div className="fd-status-option">
                <span>Pending</span>

                <span
                  className={`fd-radio pending ${selectedStatus === "Pending" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Pending")}
                  onKeyDown={(e) => handleStatusKey(e, "Pending")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Pending"}
                  aria-label="Set status to pending"
                />
              </div>

              <div className="fd-status-divider" />

              {/* REJECTED */}
              <div className="fd-status-option">
                <span>Rejected</span>

                <span
                  className={`fd-radio rejected ${selectedStatus === "Rejected" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Rejected")}
                  onKeyDown={(e) => handleStatusKey(e, "Rejected")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Rejected"}
                  aria-label="Set status to rejected"
                />
              </div>

              <div className="fd-status-divider" />

              {/* APPROVED */}
              <div className="fd-status-option">
                <span>Approved</span>

                <span
                  className={`fd-radio approved ${selectedStatus === "Approved" ? "active" : ""}`}
                  onClick={() => setSelectedStatus("Approved")}
                  onKeyDown={(e) => handleStatusKey(e, "Approved")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedStatus === "Approved"}
                  aria-label="Set status to approved"
                />
              </div>
            </div>

            {data.upload_document && (
              <button
                className="fd-proof-btn"
                type="button"
                onClick={async () => {
                  try {
                    const documentUrl = await getLeaveDocumentUrl(data.id);
                    // Open in new tab with authentication
                    const token = localStorage.getItem('token');
                    if (token) {
                      // Add token to headers via fetch and blob
                      fetch(documentUrl, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      })
                      .then(response => response.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        window.open(url, '_blank');
                      })
                      .catch(err => {
                        console.error('Error opening document:', err);
                        // Fallback to direct URL
                        window.open(documentUrl, '_blank');
                      });
                    } else {
                      window.open(documentUrl, '_blank');
                    }
                  } catch (error) {
                    console.error('Error getting document URL:', error);
                  }
                }}
                aria-label="Open proof document"
              >
                <img src={proofIcon} alt="" />
                Proof Document
              </button>
            )}
          </div>

          {/* Rejection reason input - shown only when Rejected is selected */}
          <div
            className={`fd-reject-reason-row ${selectedStatus === "Rejected" ? "visible" : "hidden"}`}
            aria-hidden={selectedStatus !== "Rejected"}
          >
            <label htmlFor="rejected-reason">Reason (rejected)</label>
            <input
              id="rejected-reason"
              ref={rejectedInputRef}
              className="fd-reject-input"
              type="text"
              placeholder="Enter the reason.."
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
              aria-label="Rejection reason"
            />
          </div>

          {/* Update Button */}
          <button
            className="fd-update-btn"
            onClick={handleUpdateStatus}
            disabled={updating || (selectedStatus === "Rejected" && !rejectedReason.trim())}
            aria-disabled={updating || (selectedStatus === "Rejected" && !rejectedReason.trim())}
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
