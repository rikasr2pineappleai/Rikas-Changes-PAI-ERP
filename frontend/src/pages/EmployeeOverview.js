import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import employeeAPI from "../integration/employeeAPI";
import PromotionProgress from "../components/PromotionProgress";
import EmployeeDocumentsModal from "../modals/EmployeeDocumentsModal";
import useAuth from "../hooks/useAuth";

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
  const { id: paramId } = useParams();
  const { user } = useAuth();
  // If no :id is in the URL (self-view via /my-overview), fall back to the
  // logged-in user's id so non-admins can view their own overview.
  const id = paramId || user?.id;
  // Self-view = visiting /my-overview (no :id in URL).
  // On the user side we hide the eov-header (back btn + title) and the
  // Attendance / Ratings green buttons.
  const isSelfView = !paramId;
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  useEffect(() => {
    // Wait until we have an id (either from the URL or from the logged-in user).
    if (!id) return;
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        console.log("📡 Fetching employee overview data for ID:", id);
        const response = await employeeAPI.getEmployeeById(id);

        if (response.success) {
          console.log("✅ Employee data received:", response.data.user);
          console.log("Project allocations:", response.data.user.ProjectAllocations);
          
          // Debug: Check project allocation structure
          if (response.data.user.ProjectAllocations?.length > 0) {
            const lastAllocation = response.data.user.ProjectAllocations[response.data.user.ProjectAllocations.length - 1];
            console.log("🎯 Last project allocation:", lastAllocation);
            console.log("Project association:", lastAllocation.Project);
            console.log("current_project field:", lastAllocation.current_project);
            console.log("start_date field:", lastAllocation.start_date);
            console.log("previous_projects field:", lastAllocation.previous_projects);
            console.log("completed_projects field:", lastAllocation.completed_projects);
          }

          // Helpful: see if backend returns work info under a different key
          console.log("Possible work-info keys:", {
            work_info: response.data.user.work_info,
            workInfo: response.data.user.workInfo,
            WorkInfo: response.data.user.WorkInfo,
            employee_work_info: response.data.user.employee_work_info,
            EmployeeWorkInfo: response.data.user.EmployeeWorkInfo,
          });

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
          {!isSelfView && (
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
          )}
          <div className="loading">Loading employee data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eov-page">
        <div className="eov-width">
          {!isSelfView && (
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
          )}
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="eov-page">
        <div className="eov-width">
          {!isSelfView && (
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
          )}
          <div className="error">Employee data not found</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const profileImage = (() => {
    const BASE_URL = "http://localhost:5001";

    const imagePath =
      employeeData?.profile_image || employeeData?.EmployeeDetail?.image_path;

    if (!imagePath) return profilePic;
    return `${BASE_URL}/${imagePath}`;
  })();

  // Get the most recent project allocation (by highest ID, matching edit page logic)
  const allocation = (() => {
    if (!employeeData?.ProjectAllocations?.length) return null;
    const allocs = employeeData.ProjectAllocations;
    // Prefer allocation with project details; otherwise use highest ID
    const withDetails = allocs.find(
      a => a.previous_projects || a.completed_projects || a.project_role
    );
    if (withDetails) return withDetails;
    return allocs.reduce((best, a) => (a.id > best.id ? a : best), allocs[0]);
  })();

  // Debug logs to see what we have
  console.log("=== PROJECT INFO DEBUG ===");
  console.log("Total ProjectAllocations:", employeeData?.ProjectAllocations?.length || 0);
  
  if (employeeData?.ProjectAllocations?.length > 0) {
    employeeData.ProjectAllocations.forEach((alloc, index) => {
      console.log(`\n📁 Allocation #${index + 1} (ID: ${alloc.id}):`);
      console.log(`  - current_project: ${alloc.current_project || '(empty)'}`);
      console.log(`  - previous_projects: ${alloc.previous_projects || '(empty)'}`);
      console.log(`  - completed_projects: ${alloc.completed_projects || '(empty)'}`);
      console.log(`  - project_role: ${alloc.project_role || '(empty)'}`);
    });
  }
  
  console.log("\n🎯 Using LAST allocation for display:");
  console.log("Allocation object:", allocation);
  console.log("allocation.Project:", allocation?.Project);
  console.log("allocation.current_project:", allocation?.current_project);
  console.log("allocation.start_date:", allocation?.start_date);
  console.log("allocation.previous_projects (raw):", allocation?.previous_projects);
  console.log("allocation.completed_projects (raw):", allocation?.completed_projects);

  // Current Project - prioritize direct current_project field from allocation (not Project association)
  const currentProject =
    allocation?.current_project ||
    allocation?.Project?.project_name ||
    "N/A";

  // Start Date - prioritize direct start_date field from allocation (not Project association)
  const startDate =
    allocation?.start_date ||
    allocation?.Project?.start_date ||
    null;

  console.log("Final currentProject:", currentProject);
  console.log("Final startDate:", startDate);
  console.log("========================");

  return (
    <div className="eov-page">
      <div className="eov-width">
        {!isSelfView && (
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
        )}

        <div className="eov-container">
          <div className="eov-left">
            <div className="eov-profile-card">
              <img src={profileImage} alt="Profile" className="eov-profile-img" />
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
              <PromotionProgress employeeData={employeeData} formatDate={formatDate} />
            </div>

            <div className="eov-buttons">
              {!isSelfView && (
                <button
                  className="eov-green-btn"
                  onClick={() => navigate(`/attendance?employeeId=${id}`)}
                >
                  <img src={attendanceIcon} alt="" />
                  <span>Attendance</span>
                </button>
              )}

              <button className="eov-green-btn" onClick={() => navigate("/org-hierarchy")}>
                <img src={structureIcon} alt="" />
                <span>Reporting Structure</span>
              </button>

              {!isSelfView && (
                <button
                  className="eov-green-btn"
                  onClick={() => navigate(`/employees/${id}/rating`)}
                >
                  <img src={ratingIcon} alt="" />
                  <span>Ratings</span>
                </button>
              )}

              <button
                className="eov-green-btn"
                onClick={() => navigate("/rules-and-regulations")}
              >
                <img src={rulesIcon} alt="" />
                <span>Rules and Regulations</span>
              </button>
            </div>
          </div>

          <div className="eov-right">
            <div className="eov-status-row">
              <div className="eov-status-card">
                <span className="eov-green-txt">Away for Breakfast</span>
                <img src={breakfastIcon} alt="" />
              </div>

              <div className="eov-status-card">
                <span className="eov-dark-txt">Employment Status</span>
                <div
                  className={`eov-status-pill ${
                    employeeData.status === "active" ? "eov-active" : "eov-inactive"
                  }`}
                >
                  {employeeData.status.charAt(0).toUpperCase() + employeeData.status.slice(1)}
                </div>
              </div>

              <div
                className="eov-status-card eov-docs"
                onClick={() => setShowDocumentsModal(true)}
                style={{ cursor: "pointer" }}
              >
                <span className="eov-red-txt">Uploaded Documents</span>
                <img src={uploadIcon} alt="" />
              </div>
            </div>

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
                  {employeeData?.email ? (
                    <a
                      href={`https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=${encodeURIComponent(
                        employeeData.email
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="eov-email-link"
                      title="Send email via Gmail"
                    >
                      <p className="eov-email-text">{employeeData.email}</p>
                      <span className="eov-icon-link">
                        <img src={mailIcon} alt="Send email" />
                      </span>
                    </a>
                  ) : (
                    <p>N/A</p>
                  )}
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
                          setTimeout(() => setCopySuccess(false), 2000);
                        } catch (err) {
                          console.error("Failed to copy phone number:", err);
                          alert("Failed to copy phone number");
                        }
                      }
                    }}
                    className="eov-icon-button"
                    title={copySuccess ? "Copied!" : "Copy phone number"}
                  >
                    <img src={copyIcon} alt="Copy phone number" />
                  </button>
                  {copySuccess && <span className="eov-copy-success">Copied!</span>}
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
                {(() => {
                  // Only get the first professional experience entry
                  const firstProfessional = employeeData.professional && employeeData.professional.length > 0 
                    ? employeeData.professional[0] 
                    : null;
                  
                  if (firstProfessional) {
                    return (
                      <>
                        <div className="eov-info">
                          <label>Position</label>
                          <p>{firstProfessional.position}</p>
                        </div>

                        <div className="eov-info">
                          <label>Company Name</label>
                          <p>{firstProfessional.company_name}</p>
                        </div>

                        <div className="eov-info">
                          <label>Year of Experience</label>
                          <p>{firstProfessional.years_of_experience || "N/A"} years</p>
                        </div>
                      </>
                    );
                  } else {
                    return (
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
                    );
                  }
                })()}
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
                    {employeeData?.ReportTo
  ? `${employeeData.ReportTo.first_name} ${employeeData.ReportTo.last_name || ""}`.trim()
  : "N/A"}
                  </p>
                </div>

                <div className="eov-info">
                  <label>Current Project</label>
                  <p>{currentProject}</p>
                </div>

                <div className="eov-info">
                  <label>Start Date</label>
                  <p>{formatDate(startDate)}</p>
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
        employeeName={`${employeeData?.first_name || ""} ${employeeData?.last_name || ""}`.trim()}
      />
    </div>
  );
}
