import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import employeeAPI from "../integration/employeeAPI"; // Import the employee API
import PromotionProgress from "../components/PromotionProgress";
import EmployeeDocumentsModal from "../modals/EmployeeDocumentsModal";

import "../styles/employee_overview.css";

import backIcon from "../assets/icons/back.png";
import mailIcon from "../assets/icons/mail.png";
import copyIcon from "../assets/icons/copy.png";
import uploadIcon from "../assets/icons/epand_red.png";
import expandIcon from "../assets/icons/expand.png";
import profilePic from "../assets/icons/profile.jpg";
import attendanceIcon from "../assets/icons/attendance.png";
import structureIcon from "../assets/icons/structure.png";
import ratingIcon from "../assets/icons/rating.png";
import breakfastIcon from "../assets/icons/breakfast.png";
import rulesIcon from "../assets/icons/rulesandregulationsicon.png";

export default function EmployeeOverview() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the employee ID from the URL
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  // Fetch employee data from the backend
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        const response = await employeeAPI.getEmployeeById(id);

        if (response.success) {
          console.log('Employee data received:', response.data.user);
          console.log('Professional data:', response.data.user.professional);
          setEmployeeData(response.data.user);
        } else {
          setError(response.message || "Failed to fetch employee data");
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
        setError("An error occurred while fetching employee data");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id]);

  if (loading) {
    return (
      <div className="eov-page">
        <div className="eov-width">
          <div className="eov-header">
            <button
              type="button"
              className="eov-back-btn"
              onClick={() => navigate("/employees")}
            >
              <img src={backIcon} alt="Back" className="eov-back-icon" />
            </button>
            <h2 className="eov-title">Employee Overview</h2>
          </div>
          <div className="loading">Loading employee data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eov-page">
        <div className="eov-width">
          <div className="eov-header">
            <button
              type="button"
              className="eov-back-btn"
              onClick={() => navigate("/employees")}
            >
              <img src={backIcon} alt="Back" className="eov-back-icon" />
            </button>
            <h2 className="eov-title">Employee Overview</h2>
          </div>
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="eov-page">
        <div className="eov-width">
          <div className="eov-header">
            <button
              type="button"
              className="eov-back-btn"
              onClick={() => navigate("/employees")}
            >
              <img src={backIcon} alt="Back" className="eov-back-icon" />
            </button>
            <h2 className="eov-title">Employee Overview</h2>
          </div>
          <div className="error">Employee data not found</div>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get profile image or use default
  const profileImage = employeeData.profile_image
    ? (() => {
        // For uploads, use base URL without /api prefix
        const apiBaseUrl =
          process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";
        const baseUrl = apiBaseUrl.replace("/api", "");
        return employeeData.profile_image.startsWith("uploads/")
          ? `${baseUrl}/${employeeData.profile_image}`
          : `${baseUrl}/uploads/${employeeData.profile_image}`;
      })()
    : employeeData.EmployeeDetail?.image_path
    ? (() => {
        // For uploads, use base URL without /api prefix
        const apiBaseUrl =
          process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";
        const baseUrl = apiBaseUrl.replace("/api", "");
        return employeeData.EmployeeDetail.image_path.startsWith("uploads/")
          ? `${baseUrl}/${employeeData.EmployeeDetail.image_path}`
          : `${baseUrl}/uploads/${employeeData.EmployeeDetail.image_path}`;
      })()
    : profilePic;

  return (
    <div className="eov-page">
      <div className="eov-width">
        {/* HEADER */}
        <div className="eov-header">
          <button
            type="button"
            className="eov-back-btn"
            onClick={() => navigate("/employees")}
          >
            <img src={backIcon} alt="Back" className="eov-back-icon" />
          </button>
          <h2 className="eov-title">Employee Overview</h2>
        </div>

        {/* MAIN CONTENT */}
        <div className="eov-container">
          {/* LEFT PANEL */}
          <div className="eov-left">
            <div className="eov-profile-card">
              <img
                src={profileImage}
                alt="Profile"
                className="eov-profile-img"
              />
            </div>

            <div className="eov-basic">
              <div>
                <h3 className="eov-name">
                  {employeeData.first_name} {employeeData.last_name || ""}
                </h3>
                <p className="eov-role">{employeeData.designation || "N/A"}</p>
              </div>
              <div className="eov-id-badge">{employeeData.emp_id}</div>
            </div>

            <div className="eov-promotions">
              <h4 className="eov-promotions-title">Promotion Progress</h4>
              <PromotionProgress
                employeeData={employeeData}
                formatDate={formatDate}
              />
            </div>

            <div className="eov-buttons">
              <button
                className="eov-green-btn"
                onClick={() => navigate(`/attendance?employeeId=${id}`)}
              >
                <img src={attendanceIcon} alt="" />
                <span>Attendance</span>
              </button>

              <button
                className="eov-green-btn"
                onClick={() => navigate("/org-hierarchy")}
              >
                <img src={structureIcon} alt="" />
                <span>Reporting Structure</span>
              </button>

              <button
                className="eov-green-btn"
                onClick={() => navigate(`/employees/${id}/rating`)}
              >
                <img src={ratingIcon} alt="" />
                <span>Ratings</span>
              </button>

              <button
                className="eov-green-btn"
                onClick={() => navigate("/rules-and-regulations")}
              >
                <img src={rulesIcon} alt="" />
                <span>Rules and Regulations</span>
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="eov-right">
            {/* STATUS ROW */}
            <div className="eov-status-row">
              <div className="eov-status-card">
                <span className="eov-green-txt">Away for Breakfast</span>
                <img src={breakfastIcon} alt="" />
              </div>

              <div className="eov-status-card">
                <span className="eov-dark-txt">Employment Status</span>
                <div
                  className={`eov-status-pill ${
                    employeeData.status === "active"
                      ? "eov-active"
                      : "eov-inactive"
                  }`}
                >
                  {employeeData.status.charAt(0).toUpperCase() +
                    employeeData.status.slice(1)}
                </div>
              </div>

              <div 
                className="eov-status-card eov-docs" 
                onClick={() => setShowDocumentsModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <span className="eov-red-txt">Uploaded Documents</span>
                <img src={uploadIcon} alt="" />
              </div>
            </div>

            {/* CARDS */}
            {/* Employee Information */}
            <section className="eov-card">
              <div className="eov-card-header">
                <h3>Employee Information</h3>
              </div>

              <div className="eov-grid">
                <div className="eov-info">
                  <label>Gender</label>
                  <p>{employeeData.EmployeeDetail?.gender || "N/A"}</p>
                </div>

                <div className="eov-info">
                  <label>Date of Birth</label>
                  <p>{formatDate(employeeData.EmployeeDetail?.dob)}</p>
                </div>

                <div className="eov-info eov-has-icon">
                  <label>Email</label>
                  <p>{employeeData.email}</p>
                  <a
                    href={`mailto:${employeeData.email}`}
                    className="eov-icon-link"
                    title="Send email"
                  >
                    <img src={mailIcon} alt="Send email" />
                  </a>
                </div>

                <div className="eov-info eov-has-icon">
                  <label>Phone Number</label>
                  <p>{employeeData.EmployeeDetail?.phone || "N/A"}</p>
                  <button
                    onClick={async () => {
                      if (employeeData.EmployeeDetail?.phone) {
                        try {
                          await navigator.clipboard.writeText(employeeData.EmployeeDetail.phone);
                          setCopySuccess(true);
                          // Reset the success message after 2 seconds
                          setTimeout(() => setCopySuccess(false), 2000);
                        } catch (err) {
                          console.error('Failed to copy phone number:', err);
                          alert('Failed to copy phone number');
                        }
                      }
                    }}
                    className="eov-icon-button"
                    title={copySuccess ? "Copied!" : "Copy phone number"}
                  >
                    <img src={copyIcon} alt="Copy phone number" />
                  </button>
                  {copySuccess && (
                    <span className="eov-copy-success">Copied!</span>
                  )}
                </div>

                <div className="eov-info">
                  <label>Address</label>
                  <p>{employeeData.EmployeeDetail?.address || "N/A"}</p>
                </div>

                <div className="eov-info">
                  <label>Starts on</label>
                  <p>{formatDate(employeeData.EmployeeDetail?.joined_date)}</p>
                </div>

                <div className="eov-info">
                  <label>Management Role</label>
                  <p>{employeeData.management_role || "N/A"}</p>
                </div>

                <div className="eov-info">
                  <label>Designation</label>
                  <p>{employeeData.designation || "N/A"}</p>
                </div>

                <div className="eov-info">
                  <label>Department</label>
                  <p>{employeeData.Department?.dept_name || "N/A"}</p>
                </div>
              </div>
            </section>

            {/* Professional */}
            <section className="eov-card">
              <div className="eov-card-header">
                <h3>Professional Information</h3>
                <img src={expandIcon} alt="" />
              </div>

              <div className="eov-grid">
                {employeeData.professional &&
                employeeData.professional.length > 0 ? (
                  employeeData.professional.map((exp, index) => (
                    <React.Fragment key={index}>
                      <div className="eov-info">
                        <label>Position</label>
                        <p>{exp.position}</p>
                      </div>

                      <div className="eov-info">
                        <label>Company Name</label>
                        <p>{exp.company_name}</p>
                      </div>

                      <div className="eov-info">
                        <label>Year of Experience</label>
                        <p>{exp.years_of_experience || "N/A"} years</p>
                      </div>
                    </React.Fragment>
                  ))
                ) : (
                  <>
                    <div className="eov-info">
                      <label>Position</label>
                      <p>N/A</p>
                    </div>

                    <div className="eov-info">
                      <label>Company Name</label>
                      <p>N/A</p>
                    </div>

                    <div className="eov-info">
                      <label>Year of Experience</label>
                      <p>N/A</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Education */}
            <section className="eov-card">
              <div className="eov-card-header">
                <h3>Educational Information</h3>
                <img src={expandIcon} alt="" />
              </div>

              <div className="eov-grid">
                {employeeData.education && employeeData.education.length > 0 ? (
                  employeeData.education.map((edu, index) => (
                    <React.Fragment key={index}>
                      <div className="eov-info">
                        <label>Educational Qualification</label>
                        <p>{edu.qualification}</p>
                      </div>

                      <div className="eov-info">
                        <label>Name of the Institute</label>
                        <p>{edu.institution}</p>
                      </div>

                      <div className="eov-info">
                        <label>Year of Completion</label>
                        <p>{edu.year_of_completion}</p>
                      </div>
                    </React.Fragment>
                  ))
                ) : (
                  <>
                    <div className="eov-info">
                      <label>Educational Qualification</label>
                      <p>N/A</p>
                    </div>

                    <div className="eov-info">
                      <label>Name of the Institute</label>
                      <p>N/A</p>
                    </div>

                    <div className="eov-info">
                      <label>Year of Completion</label>
                      <p>N/A</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Project */}
            <section className="eov-card">
              <div className="eov-card-header">
                <h3>Project Information</h3>
                <img src={expandIcon} alt="" />
              </div>

              <div className="eov-grid">
                <div className="eov-info">
                  <label>Team Lead</label>
                  <p>
                    {employeeData.report_to
                      ? `${employeeData.ReportTo?.first_name} ${
                          employeeData.ReportTo?.last_name || ""
                        }`.trim()
                      : "N/A"}
                  </p>
                </div>

                <div className="eov-info">
                  <label>Current Project</label>
                  <p>ERP System</p>
                </div>

                <div className="eov-info">
                  <label>Start Date</label>
                  <p>16 Apr 2025</p>
                </div>

                <div className="eov-info">
                  <label>Previous Projects</label>
                  <p>N/A</p>
                </div>

                <div className="eov-info">
                  <label>Completed Projects</label>
                  <p>N/A</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <EmployeeDocumentsModal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        documents={employeeData?.Documents || []}
        employeeName={`${employeeData?.first_name || ''} ${employeeData?.last_name || ''}`.trim()}
      />
    </div>
  );
}