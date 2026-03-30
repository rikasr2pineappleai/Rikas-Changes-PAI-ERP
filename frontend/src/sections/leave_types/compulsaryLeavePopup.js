import React, { useState } from "react";
import ErrorModal from '../../modals/ErrorModal';
import SuccessModal from '../../modals/SuccessModal';
import closeIcon from "../../assets/icons/Close.png";
import profile from "../../assets/icons/profile.png";
import proofIcon from "../../assets/icons/proof.png";
import "../../styles/compulsory_leave_popup.css";
import { updateLeaveStatus } from "../../integration/leavesAPI";

export default function CompulsoryLeavePopup({ data, onClose, onRefresh }) {
  const normalizeStatus = (status) => {
    if (!status) return "Pending";
    const normalized = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return ["Pending", "Rejected", "Approved"].includes(normalized) ? normalized : "Pending";
  };
  
  const [status, setStatus] = useState(normalizeStatus(data?.status));
  const [updating, setUpdating] = useState(false);
  
  // State for modals
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');

  if (!data) return null;

  const handleUpdateStatus = async () => {
    if (!data.id) {
      console.error('Leave request ID is missing');
      // Show error modal
      setErrorModalMessage('Leave request ID is missing');
      setErrorModalOpen(true);
      return;
    }
    
    try {
      setUpdating(true);
      await updateLeaveStatus(data.id, { status: status.toLowerCase() });
      // Show success message using modal
      setSuccessModalMessage(`Leave request status updated to ${status}`);
      setSuccessModalOpen(true);
      // Refresh the leave requests data
      if (onRefresh) {
        await onRefresh();
      }
      // Close the popup after successful update
      setTimeout(() => {
        onClose();
      }, 1000); // Delay closing to show success modal
    } catch (error) {
      console.error('Error updating leave status:', error);
      // Show error using modal
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to update leave status. Please try again.';
      setErrorModalMessage(errorMessage);
      setErrorModalOpen(true);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="cl-popup-overlay">
      <div className="cl-popup-box">

        {/* Close Button */}
        <button className="cl-close-btn" onClick={onClose}>
          <img src={closeIcon} alt="close" />
        </button>

        {/* Profile */}
        <img src={data.image || profile} className="cl-profile-img" alt="profile" onError={(e) => {
          e.target.onerror = null; // prevents looping
          e.target.src = profile; // fallback to default profile
        }} />
        <h2 className="cl-username">{data.employee}</h2>
        <p className="cl-role">UI/UX Engineer</p>

        {/* Content */}
        <div className="cl-content-box">

          {/* Leave Type + Date */}
          <div className="cl-row">
            <div>
              <label>Leave Type</label>
              <p className="cl-value">{data.type}</p>
            </div>

            <div>
              <label>Extended Working Date</label>
              <p className="cl-value">{data.extendedDate}</p>
            </div>
          </div>

          {/* Description */}
          <div className="cl-description-block">
            <label>Description</label>
            <p>{data.reason}</p>
          </div>

          {/* Proof Button – moved UP */}
          <div className="cl-proof-section">
            <button className="cl-proof-btn">
              <img src={proofIcon} alt="proof" />
              Proof Document
            </button>
          </div>

          {/* Status */}
          <label className="cl-status-title">Status</label>

          <div className="cl-status-box">

            <div className="cl-status-option" onClick={() => setStatus("Pending")}>
              Pending
              <span className={`cl-radio ${status === "Pending" ? "active pending" : ""}`}></span>
            </div>

            <div className="cl-status-divider"></div>

            <div className="cl-status-option" onClick={() => setStatus("Rejected")}>
              Rejected
              <span className={`cl-radio ${status === "Rejected" ? "active rejected" : ""}`}></span>
            </div>

            <div className="cl-status-divider"></div>

            <div className="cl-status-option" onClick={() => setStatus("Approved")}>
              Approved
              <span className={`cl-radio ${status === "Approved" ? "active approved" : ""}`}></span>
            </div>

          </div>
        </div>

        {/* Update Button */}
        <button 
          className="cl-update-btn" 
          onClick={handleUpdateStatus}
          disabled={updating}
        >
          {updating ? 'Updating...' : 'Update'}
        </button>
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