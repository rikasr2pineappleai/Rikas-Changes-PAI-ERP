import React, { useState, useEffect } from "react";
import "../styles/performance.css";
import ratingAPI from "../integration/ratingAPI";

const Performance = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [remarksData, setRemarksData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeName, setEmployeeName] = useState("");

  // Get current user ID from localStorage or context
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser?.id;

  // Fetch employee ratings on component mount
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Current User Data:", currentUser);
        console.log("Current User ID:", currentUserId);

        if (!currentUserId) {
          setError("User not authenticated. Please login again.");
          setIsLoading(false);
          return;
        }

        // Fetch ratings for current user
        console.log("Fetching ratings for user ID:", currentUserId);
        const response = await ratingAPI.getEmployeeRatings(currentUserId);
        
        console.log("Ratings API Response:", response);

        if (response.success) {
          if (response.data.performance_data && response.data.performance_data.length > 0) {
            setPerformanceData(response.data.performance_data);
            setEmployeeName(response.data.employee_name || "");
            setRemarksData(response.data.grouped_ratings || {});
            console.log("Ratings loaded successfully:", response.data.performance_data);
          } else {
            // No ratings found
            setPerformanceData([]);
            setRemarksData({});
            console.log("No ratings found for user");
          }
        } else {
          // If no ratings found, show empty state
          setPerformanceData([]);
          setRemarksData({});
          console.log("API returned no ratings:", response.message);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
        setError(err.response?.data?.message || "Failed to load performance ratings");
        setPerformanceData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [currentUserId]);

  const openModal = (criteria) => {
    setSelectedCriteria(criteria);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCriteria(null);
  };

  const calculateAverage = (row) => {
    const values = [];
    if (row.tl !== undefined) values.push(row.tl);
    if (row.pm !== undefined) values.push(row.pm);
    if (row.coo !== undefined) values.push(row.coo);
    if (row.cto !== undefined) values.push(row.cto);
    if (row.ceo !== undefined) values.push(row.ceo);

    if (values.length === 0) return "0.0";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  // Default/static remarks data for fallback
  const defaultRemarksData = {
    "Task completion within deadlines": {
      tl: "sample remark is here",
      pm: "sample remark is here",
      coo: "sample remark is here",
      cto: "sample remark is here",
      ceo: "sample remark is here",
    },
  };

  const getRemarksForCriteria = (criteria) => {
    if (remarksData[criteria]) {
      const ratings = remarksData[criteria].ratings;
      return {
        tl: ratings.TL?.remarks || "No remarks",
        pm: ratings.PM?.remarks || "No remarks",
        coo: ratings.COO?.remarks || "No remarks",
        cto: ratings.CTO?.remarks || "No remarks",
        ceo: ratings.CEO?.remarks || "No remarks",
      };
    }
    return defaultRemarksData[criteria] || {
      tl: "No remarks",
      pm: "No remarks",
      coo: "No remarks",
      cto: "No remarks",
      ceo: "No remarks",
    };
  };

  const totalAverage =
    performanceData.length > 0
      ? (
          performanceData
            .map((row) => parseFloat(calculateAverage(row)))
            .reduce((a, b) => a + b, 0) / performanceData.length
        ).toFixed(1)
      : "0.0";

  if (isLoading) {
    return (
      <div className="performance-container">
        <div className="loading-spinner">
          <p>Loading performance ratings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-container">
        <div className="error-message">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (performanceData.length === 0) {
    return (
      <div className="performance-container">
        <div className="performance-header">
          <h2>Performance</h2>
        </div>
        <div className="no-data-message">
          <p>No performance ratings available yet.</p>
          <p>You will see your ratings here once your managers have rated you.</p>
          {currentUser?.emp_id && (
            <p style={{ marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
              Employee ID: {currentUser.emp_id} (User ID: {currentUserId})
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="performance-container">
      {/* Header */}
      <div className="performance-header">
        <h2>Performance</h2>
      </div>

      {/* Section */}
      <div className="ratings-section">
        <h3>Ratings Overview</h3>

        {/* Desktop Table View */}
        <div className="performance-table-wrapper">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Criteria</th>
                <th>TL Rating</th>
                <th>PM Rating</th>
                <th>COO Rating</th>
                <th>CTO Rating</th>
                <th>CEO Rating</th>
                <th>Average Score</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {performanceData.map((row, index) => (
                <tr key={index}>
                  <td className="criteria">{row.criteria}</td>
                  <td>{row.tl ? row.tl.toFixed(1) : "-"}</td>
                  <td>{row.pm ? row.pm.toFixed(1) : "-"}</td>
                  <td>{row.coo ? row.coo.toFixed(1) : "-"}</td>
                  <td>{row.cto ? row.cto.toFixed(1) : "-"}</td>
                  <td>{row.ceo ? row.ceo.toFixed(1) : "-"}</td>
                  <td className="avg-score">{calculateAverage(row)}</td>
                  <td>
                    <span
                      className="remarks-link"
                      onClick={() => openModal(row.criteria)}
                    >
                      View Remarks
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="performance-cards">
          {performanceData.map((row, index) => (
            <div key={index} className="performance-card">
              <div className="card-header">
                <h4>{row.criteria}</h4>
              </div>
              <div className="card-body">
                <div className="card-rating-row">
                  <span className="rating-label">TL Rating</span>
                  <span className="rating-value">
                    {row.tl ? row.tl.toFixed(1) : "-"}
                  </span>
                </div>
                <div className="card-rating-row">
                  <span className="rating-label">PM Rating</span>
                  <span className="rating-value">
                    {row.pm ? row.pm.toFixed(1) : "-"}
                  </span>
                </div>
                <div className="card-rating-row">
                  <span className="rating-label">COO Rating</span>
                  <span className="rating-value">
                    {row.coo ? row.coo.toFixed(1) : "-"}
                  </span>
                </div>
                <div className="card-rating-row">
                  <span className="rating-label">CTO Rating</span>
                  <span className="rating-value">
                    {row.cto ? row.cto.toFixed(1) : "-"}
                  </span>
                </div>
                <div className="card-rating-row">
                  <span className="rating-label">CEO Rating</span>
                  <span className="rating-value">
                    {row.ceo ? row.ceo.toFixed(1) : "-"}
                  </span>
                </div>
                <div className="card-rating-row avg-row">
                  <span className="rating-label">Average Score</span>
                  <span className="rating-value-avg">{calculateAverage(row)}</span>
                </div>
              </div>
              <div className="card-footer">
                <span
                  className="remarks-link-mobile"
                  onClick={() => openModal(row.criteria)}
                >
                  View Remarks
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Appraisal */}
      <div className="overall-section">
        <h3>Overall Appraisal</h3>

        <div className="overall-card">
          <p className="overall-score">
            <span>Total Average Score</span>
            <strong>{totalAverage} / 10</strong>
          </p>

          <p className="overall-grade">
            <span>Overall Grade</span>
            <strong>
              {totalAverage >= 9
                ? "Exceeds Expectations"
                : totalAverage >= 7
                ? "Meets Expectations"
                : totalAverage >= 5
                ? "Needs Improvement"
                : "Below Expectations"}
            </strong>
          </p>
        </div>
      </div>

      {/* Remarks Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Remarks</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedCriteria ? (
                <>
                  <div className="remark-field">
                    <label>Team Lead</label>
                    <div className="remark-box">
                      {getRemarksForCriteria(selectedCriteria).tl}
                    </div>
                  </div>

                  <div className="remark-field">
                    <label>Project Manager</label>
                    <div className="remark-box">
                      {getRemarksForCriteria(selectedCriteria).pm}
                    </div>
                  </div>

                  <div className="remark-field">
                    <label>COO</label>
                    <div className="remark-box">
                      {getRemarksForCriteria(selectedCriteria).coo}
                    </div>
                  </div>

                  <div className="remark-field">
                    <label>CTO</label>
                    <div className="remark-box">
                      {getRemarksForCriteria(selectedCriteria).cto}
                    </div>
                  </div>

                  <div className="remark-field">
                    <label>CEO</label>
                    <div className="remark-box">
                      {getRemarksForCriteria(selectedCriteria).ceo}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;