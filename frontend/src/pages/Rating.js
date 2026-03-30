import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/rating.css";
import ratingAPI from "../integration/ratingAPI";

// Icons
import starIcon from "../assets/icons/Star.png";
import remarkIcon from "../assets/icons/Remarks.png";
import alertIcon from "../assets/icons/Excalamation.png";
import backIcon from "../assets/icons/back.png"; // <-- back icon
import closeIcon from "../assets/icons/closeicon.png"; // Close icon for success popup
import greenStarIcon from "../assets/icons/Green-Star.png"; // Green star icon

const criteriaList = [
  "Task completion within deadlines",
  "Punctual in meetings",
  "Sign-in/out punctuality",
  "Timely daily updates",
  "Attendance reliability",
  "Teamwork and contribution",
  "Presentation skills",
  "Follows company policies",
  "Willingness to work flexible hours",
  "Communication (written & verbal)",
  "Responsibility in internal communications",
  "Power outage impact",
  "Meeting professionalism",
  "Note-taking & follow-up",
];

const Rating = () => {
  const { id: employeeId } = useParams();
  const navigate = useNavigate();
  
  const [ratings, setRatings] = useState({});
  const [remarks, setRemarks] = useState({});
  
  // Role selection for admin rating
  const [raterRole, setRaterRole] = useState("TL"); // Default to Team Lead
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState("");
  const [tempRemark, setTempRemark] = useState("");
  
  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // State to track which criteria just got rated (for green star animation)
  const [ratedCriteria, setRatedCriteria] = useState(null);

  // Star click
  const handleRating = (criteria, value) => {
    setRatings((prev) => ({
      ...prev,
      [criteria]: value,
    }));
    
    // Show green star for this criteria (stays until manually refresh)
    setRatedCriteria(criteria);
  };

  // Open modal
  const openRemarkModal = (criteria) => {
    setCurrentCriteria(criteria);
    setTempRemark(remarks[criteria] || "");
    setShowModal(true);
  };

  // Save remark
  const saveRemark = () => {
    setRemarks((prev) => ({
      ...prev,
      [currentCriteria]: tempRemark,
    }));

    setShowModal(false);
    setCurrentCriteria("");
    setTempRemark("");
  };

  // Submit
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setSubmitError(null);

      // Validate that at least one rating is provided
      if (Object.keys(ratings).length === 0) {
        setSubmitError("Please provide at least one rating before submitting");
        setIsLoading(false);
        return;
      }

      // Convert ratings object to array format expected by API
      const ratingsArray = criteriaList.map(criteria => ({
        criteria: criteria,
        rating: ratings[criteria] || 0,
        remarks: remarks[criteria] || null,
        raterRole: raterRole // Include the selected role
      })).filter(r => r.rating > 0); // Only include criteria that have been rated

      if (ratingsArray.length === 0) {
        setSubmitError("Please provide ratings for at least one criteria");
        setIsLoading(false);
        return;
      }

      console.log("Submitting ratings for employee ID:", employeeId);
      console.log("Ratings to submit:", ratingsArray);
      console.log("Rater Role:", raterRole);

      // Call API to submit ratings
      const response = await ratingAPI.submitRatings(employeeId, ratingsArray);

      console.log("Ratings API Response:", response);

      if (response.success) {
        setShowSuccessPopup(true);
        
        // Reset form
        setRatings({});
        setRemarks({});
        setRatedCriteria(null);
        setRaterRole("TL");
        
        // Auto-close popup and navigate after 2 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
          navigate(`/employees/${employeeId}/overview`);
        }, 2000);
      } else {
        setSubmitError(response.message || "Failed to submit ratings");
      }
    } catch (error) {
      console.error("Error submitting ratings:", error);
      setSubmitError(error.response?.data?.message || "An error occurred while submitting ratings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rating-container">
      {/* Header with back icon */}
      <div className="rating-header">
        <img
          src={backIcon}
          alt="Back"
          className="back-icon"
          onClick={() => window.history.back()}
        />
        <h2>Ratings</h2>
      </div>

      {/* Role Selection Section */}
      <div className="role-selection-section">
        <label htmlFor="rater-role">Rating As (Your Role):</label>
        <select 
          id="rater-role"
          value={raterRole} 
          onChange={(e) => setRaterRole(e.target.value)}
          className="role-dropdown"
        >
          <option value="TL">Team Lead (TL)</option>
          <option value="PM">Project Manager (PM)</option>
          <option value="COO">Chief Operating Officer (COO)</option>
          <option value="CTO">Chief Technology Officer (CTO)</option>
          <option value="CEO">Chief Executive Officer (CEO)</option>
        </select>
      </div>

      <div className="rating-table-wrapper">
        <table className="rating-table">
          {/* Header */}
          <thead>
            <tr>
              <th>Criteria</th>
              {[...Array(10)].map((_, i) => (
                <th key={i}>{i + 1}</th>
              ))}
              <th>Remarks</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {criteriaList.map((criteria, index) => (
              <tr key={index}>
                {/* Criteria */}
                <td className="criteria">
                  <div className="criteria-content">
                    <span className="criteria-text">{criteria}</span>
                    <img src={alertIcon} alt="info" className="criteria-icon" />
                  </div>
                </td>

                {/* Stars */}
                {[...Array(10)].map((_, i) => (
                  <td key={i}>
                    <div className="star-wrapper">
                      <img
                        src={starIcon}
                        alt="star"
                        className={
                          ratings[criteria] >= i + 1
                            ? "star-img active"
                            : "star-img"
                        }
                        onClick={() => handleRating(criteria, i + 1)}
                      />
                      {ratedCriteria === criteria && ratings[criteria] >= i + 1 && (
                        <img
                          src={greenStarIcon}
                          alt="success"
                          className="green-star-icon"
                        />
                      )}
                    </div>
                  </td>
                ))}

                {/* Remarks */}
                <td>
                  <img
                    src={remarkIcon}
                    alt="remark"
                    className={
                      remarks[criteria] ? "remark-icon active" : "remark-icon"
                    }
                    onClick={() => openRemarkModal(criteria)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View for Mobile */}
      <div className="rating-cards-container">
        {criteriaList.map((criteria, index) => (
          <div key={index} className="rating-card">
            <div className="card-criteria">
              <span className="card-criteria-text">{criteria}</span>
              <img src={alertIcon} alt="info" className="card-criteria-icon" />
            </div>

            <div className="card-stars">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="star-wrapper-mobile">
                  <img
                    src={starIcon}
                    alt="star"
                    className={
                      ratings[criteria] >= i + 1
                        ? "star-img active"
                        : "star-img"
                    }
                    onClick={() => handleRating(criteria, i + 1)}
                  />
                  {ratedCriteria === criteria && ratings[criteria] >= i + 1 && (
                    <img
                      src={greenStarIcon}
                      alt="success"
                      className="green-star-icon-mobile"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="card-remark">
              <img
                src={remarkIcon}
                alt="remark"
                className={
                  remarks[criteria] ? "remark-icon active" : "remark-icon"
                }
                onClick={() => openRemarkModal(criteria)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="submit-area">
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="error-popup">
          <div className="left-bar error-bar"></div>
          <span>{submitError}</span>
          <img
            src={closeIcon}
            alt="close"
            className="close-popup"
            onClick={() => setSubmitError(null)}
          />
        </div>
      )}

      {/* Modal */}
      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            {/* NEW header wrapper */}
            <div className="modal-header">
              <h3>Remarks</h3>
              <span className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </span>
            </div>

            <p className="modal-criteria">{currentCriteria}</p>

            <textarea
              placeholder="Write your remark here..."
              value={tempRemark}
              onChange={(e) => setTempRemark(e.target.value)}
            />

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button className="save-btn" onClick={saveRemark}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="left-bar"></div>
          <svg
            className="success-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
              fill="#347e45"
            />
          </svg>
          <span>Ratings submitted successfully!</span>
          <img
            src={closeIcon}
            alt="close"
            className="close-popup"
            onClick={() => setShowSuccessPopup(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Rating;