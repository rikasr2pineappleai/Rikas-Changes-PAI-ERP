import React, { useState, useEffect } from "react";
import "../styles/leave_management.css";

import actionIcon from "../assets/icons/action.png";
import searchIcon from "../assets/icons/search.png";
import mainfilterIcon from "../assets/icons/main_filter.png";
import subFilterIcon from "../assets/icons/subFilter.png";

/* POPUPS */
import FullDayLeavePopup from "../sections/leave_types/fullDayLeavePopups";
import HalfDayLeavePopup from "../sections/leave_types/halfDayLeavePopups";
import HoursPermissionLeavePopup from "../sections/leave_types/hourPermissionPopup";

/* Filter dropdown */
import FilterLeavePopup from "../sections/leave_types/FilterLeavePopup";

/* Pagination (reusable component) */
import Pagination from "../components/Pagination";

/* Components */
import LeaveSummaryCards from "../sections/leaves/LeaveSummaryCards";

/* API */
import { getAllLeaveRequests } from "../integration/leavesAPI";

export default function LeaveManagement() {
  const [activePeriod, setActivePeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [popupType, setPopupType] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  // Filter states
  const [leaveTypeFilters, setLeaveTypeFilters] = useState({
    fullDay: false,
    halfDay: false,
    hourPermission: false,
  });
  
  const [statusFilters, setStatusFilters] = useState({
    pending: false,
    approved: false,
    rejected: false,
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Pagination state */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // adjust page size here if desired

  // State for leave requests from backend
  const [leaves, setLeaves] = useState([]);

  // Fetch leave requests from backend
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        const response = await getAllLeaveRequests();
        
        // Transform backend data to match frontend structure
        const transformedLeaves = response.rows.map(leave => {
          // Format dates based on leave mode
          let fromDisplay, toDisplay;
          
          if (leave.leave_mode === 'full_day') {
            fromDisplay = leave.start_date ? new Date(leave.start_date).toLocaleDateString() : 'N/A';
            toDisplay = leave.end_date ? new Date(leave.end_date).toLocaleDateString() : fromDisplay;
          } else if (leave.leave_mode === 'half_day') {
            fromDisplay = leave.start_date ? new Date(leave.start_date).toLocaleDateString() : 'N/A';
            toDisplay = `${leave.leave_session || 'Morning'} Session`;
          } else if (leave.leave_mode === 'hours_permission') {
            fromDisplay = leave.start_time ? leave.start_time : 'N/A';
            toDisplay = leave.end_time ? leave.end_time : 'N/A';
          } else {
            // For other leave modes
            fromDisplay = leave.start_date ? new Date(leave.start_date).toLocaleDateString() : 'N/A';
            toDisplay = leave.end_date ? new Date(leave.end_date).toLocaleDateString() : fromDisplay;
          }
          
          return {
            id: leave.id,
            employee: leave.User ? `${leave.User.first_name || ''} ${leave.User.last_name || ''}`.trim() : 'Unknown Employee',
            type: leave.leave_mode === 'full_day' ? 'Full Day' : 
                  leave.leave_mode === 'half_day' ? 'Half Day' : 
                  leave.leave_mode === 'hours_permission' ? 'Hours Permission' : 
                  leave.leave_mode,
            reason: leave.reason || 'N/A',
            from: fromDisplay,
            to: toDisplay,
            status: (leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1).toLowerCase() : 'Pending'),
            leave_type_id: leave.leave_type_id,
            leave_type_name: leave.LeaveType ? leave.LeaveType.leave_name : 'Unknown', // Use LeaveType name if available
            user_id: leave.user_id,
            start_date: leave.start_date,
            end_date: leave.end_date,
            start_time: leave.start_time,
            end_time: leave.end_time,
            leave_session: leave.leave_session,
            requested_at: leave.requested_at,
            approved_by: leave.approved_by,
          };
        });
        
        setLeaves(transformedLeaves);
        setError(null);
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        setError('Failed to load leave requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaveRequests();
  }, []);

  const handleActionClick = (leave) => {
    setSelectedLeave(leave);

    switch (leave.type) {
      case "Full Day":
        setPopupType("fullDay");
        break;
      case "Half Day":
        setPopupType("halfDay");
        break;
      case "Hours Permission":
        setPopupType("hours");
        break;
      default:
        setPopupType(null);
    }
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupType(null);
    setSelectedLeave(null);
  };

  const refreshLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await getAllLeaveRequests();
      
      // Transform backend data to match frontend structure
      const transformedLeaves = response.rows.map(leave => {
        // Format dates based on leave mode
        let fromDisplay, toDisplay;
        
        if (leave.leave_mode === 'full_day') {
          fromDisplay = leave.start_date ? new Date(leave.start_date).toLocaleDateString() : 'N/A';
          toDisplay = leave.end_date ? new Date(leave.end_date).toLocaleDateString() : fromDisplay;
        } else if (leave.leave_mode === 'half_day') {
          fromDisplay = leave.start_date ? new Date(leave.start_date).toLocaleDateString() : 'N/A';
          toDisplay = `${leave.leave_session || 'Morning'} Session`;
        } else if (leave.leave_mode === 'hours_permission') {
          fromDisplay = leave.start_time ? leave.start_time : 'N/A';
          toDisplay = leave.end_time ? leave.end_time : 'N/A';
        } else {
          // For other leave modes
          fromDisplay = leave.start_date ? new Date(leave.start_date).toLocaleDateString() : 'N/A';
          toDisplay = leave.end_date ? new Date(leave.end_date).toLocaleDateString() : fromDisplay;
        }
        
        return {
          id: leave.id,
          employee: leave.User ? `${leave.User.first_name || ''} ${leave.User.last_name || ''}`.trim() : 'Unknown Employee',
          image: leave.User?.profile_image ? `http://localhost:5001/${leave.User.profile_image.startsWith('uploads/') ? leave.User.profile_image : `uploads/${leave.User.profile_image}`}` : (leave.User?.EmployeeDetail?.image_path ? `http://localhost:5001/${leave.User.EmployeeDetail.image_path.startsWith('uploads/') ? leave.User.EmployeeDetail.image_path : `uploads/${leave.User.EmployeeDetail.image_path}`}` : null), // Get image from profile_image first, construct proper URL, fallback to EmployeeDetail
          type: leave.leave_mode === 'full_day' ? 'Full Day' : 
                leave.leave_mode === 'half_day' ? 'Half Day' : 
                leave.leave_mode === 'hours_permission' ? 'Hours Permission' : 
                leave.leave_mode,
          reason: leave.reason || 'N/A',
          from: fromDisplay,
          to: toDisplay,
          status: (leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1).toLowerCase() : 'Pending'),
          leave_type_id: leave.leave_type_id,
          leave_type_name: leave.LeaveType ? leave.LeaveType.leave_name : 'Unknown', // Use LeaveType name if available
          user_id: leave.user_id,
          start_date: leave.start_date,
          end_date: leave.end_date,
          start_time: leave.start_time,
          end_time: leave.end_time,
          leave_session: leave.leave_session,
          requested_at: leave.requested_at,
          approved_by: leave.approved_by,
        };
      });
      
      setLeaves(transformedLeaves);
      setError(null);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for filter changes
  const handleLeaveTypeFilterChange = (filterType, value) => {
    setLeaveTypeFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleStatusFilterChange = (filterType, value) => {
    setStatusFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setLeaveTypeFilters({
      fullDay: false,
      halfDay: false,
      hourPermission: false,
    });
    setStatusFilters({
      pending: false,
      approved: false,
      rejected: false,
    });
  };

  // If the filter/search changes, reset current page to 1 to avoid empty page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activePeriod, leaveTypeFilters, statusFilters]);

  const filteredLeaves = React.useMemo(() => {
    return leaves.filter((l) => {
      // Apply search filter
      const t = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        l.employee.toLowerCase().includes(t) ||
        l.type.toLowerCase().includes(t) ||
        l.reason.toLowerCase().includes(t);
      
      if (!matchesSearch) {
        return false;
      }
      
      // Apply leave type filters
      const anyLeaveTypeSelected = leaveTypeFilters.fullDay || leaveTypeFilters.halfDay || leaveTypeFilters.hourPermission;
      if (anyLeaveTypeSelected) {
        const typeMatches = 
          (leaveTypeFilters.fullDay && l.type === 'Full Day') ||
          (leaveTypeFilters.halfDay && l.type === 'Half Day') ||
          (leaveTypeFilters.hourPermission && l.type === 'Hours Permission');
        
        if (!typeMatches) {
          return false;
        }
      }
      
      // Apply status filters
      const anyStatusSelected = statusFilters.pending || statusFilters.approved || statusFilters.rejected;
      if (anyStatusSelected) {
        // Ensure consistent capitalization of status values
        const normalizedStatus = l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1).toLowerCase() : 'Pending';
        const statusMatches = 
          (statusFilters.pending && normalizedStatus === 'Pending') ||
          (statusFilters.approved && normalizedStatus === 'Approved') ||
          (statusFilters.rejected && normalizedStatus === 'Rejected');
        
        if (!statusMatches) {
          return false;
        }
      }
      
      // Apply date filter based on activePeriod
      if (activePeriod === "today") {
        // Filter for leave requests created today (based on requested_at)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        // Use requested_at to determine when the request was made
        let requestedDate = l.requested_at ? new Date(l.requested_at) : null;
        
        if (requestedDate) {
          requestedDate.setHours(0, 0, 0, 0);
          
          // Compare the date of the request to today
          return requestedDate.getTime() === today.getTime();
        }
        
        return false;
      } else if (activePeriod === "week") {
        // Filter for leave requests that occur during this week (based on leave start and end dates)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        
        // Calculate start of week (Sunday = 0, Monday = 1, etc.)
        // Week starts on Monday: adjust accordingly
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days to Monday
        startOfWeek.setDate(today.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0); // Reset time to start of day
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999); // Set time to end of day
        
        // Use start_date and end_date to determine if the leave falls within the current week
        const leaveStart = l.start_date ? new Date(l.start_date) : null;
        
        if (leaveStart) {
          const leaveStartDate = new Date(leaveStart);
          leaveStartDate.setHours(0, 0, 0, 0);
          
          // For full day and half day leaves, use end_date; for hours permission, use same date
          const leaveEnd = l.end_date ? new Date(l.end_date) : leaveStartDate;
          const leaveEndDate = new Date(leaveEnd);
          leaveEndDate.setHours(23, 59, 59, 999);
          
          // Check if there's an overlap between the leave period and the current week
          return leaveStartDate <= endOfWeek && leaveEndDate >= startOfWeek;
        }
        
        return false;
      }
      // If activePeriod is 'all' or any other value (no specific filter), return all matching search results
      return true;
    });
  }, [leaves, searchTerm, activePeriod, leaveTypeFilters, statusFilters]);

  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil(filteredLeaves.length / pageSize));
  }, [filteredLeaves, pageSize]);

  const onPageChange = (page) => {
    // clamp page into valid range
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    // optionally scroll into view or do other UX touches here
  };

  // Ensure currentPage doesn't exceed totalPages when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // slice data for current page
  const paginatedLeaves = React.useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredLeaves.slice(startIdx, startIdx + pageSize);
  }, [filteredLeaves, currentPage, pageSize]);

  return (
    <>
      {/* Main content is wrapped and blurred when showPopup === true */}
      <div className={`leave-wrapper ${showPopup ? "blurred" : ""}`}>
        {/* PERIOD TOGGLE */}
        <div className="leave-period-toggle">
  <button
    className={`period-btn ${
      activePeriod === "today" ? "active" : ""
    }`}
    onClick={() => setActivePeriod(prev => prev === "today" ? "all" : "today")}
  >
    Today
  </button>
  <button
    className={`period-btn ${
      activePeriod === "week" ? "active" : ""
    }`}
    onClick={() => setActivePeriod(prev => prev === "week" ? "all" : "week")}
  >
    Week
  </button>
</div>

        {/* LEAVE SUMMARY CARDS */}
        <LeaveSummaryCards activePeriod={activePeriod} />

        {/* OUTER CONTAINER WITH BORDER */}
        <div className="leave-requests-container">
          {/* LEAVE REQUESTS HEADER */}
          <div className="leave-header">
            <h3>Leave Requests</h3>

            <div className="leave-tools">
              <div className="filter-wrapper">
                <button
                  className="main-filter-btn"
                  onClick={() => setShowFilterPopup(!showFilterPopup)}
                >
                  <img src={mainfilterIcon} alt="Filter" />
                </button>
                {showFilterPopup && (
                  <FilterLeavePopup 
                    onClose={() => setShowFilterPopup(false)}
                    leaveTypeFilters={leaveTypeFilters}
                    statusFilters={statusFilters}
                    onLeaveTypeChange={handleLeaveTypeFilterChange}
                    onStatusChange={handleStatusFilterChange}
                    onClearAll={clearAllFilters}
                  />
                )}
              </div>

              <div className="search-box">
                <img src={searchIcon} className="search-icon" alt="Search" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Divider line below header */}
          <div className="leave-requests-divider"></div>

          {/* Loading state */}
          {loading && (
            <div className="loading-container" style={{ textAlign: "center", padding: "20px" }}>
              <p>Loading leave requests...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="error-container" style={{ textAlign: "center", padding: "20px", color: "red" }}>
              <p>{error}</p>
            </div>
          )}

          {/* Content (only show if not loading and no error) */}
          {!loading && !error && (
            <>
              {/* DESKTOP TABLE + pagination wrapper */}
              <div className="leave-table-container">
                <div className="leave-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee Name</th>

                        <th>
                          <div className="header-with-icon">
                            Leave Type
                            <img src={subFilterIcon} alt="sort" />
                          </div>
                        </th>

                        <th>Reason</th>

                        <th>
                          <div className="header-with-icon">
                            Leave From
                            <img src={subFilterIcon} alt="sort" />
                          </div>
                        </th>

                        <th>
                          <div className="header-with-icon">
                            Leave To
                            <img src={subFilterIcon} alt="sort" />
                          </div>
                        </th>

                        <th>
                          <div className="header-with-icon">
                            Status
                            <img src={subFilterIcon} alt="sort" />
                          </div>
                        </th>

                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedLeaves.map((item) => (
                        <tr key={item.id}>
                          <td>{item.employee}</td>
                          <td>{item.type}</td>
                          <td>{item.reason}</td>
                          <td>{item.from}</td>
                          <td>{item.to}</td>
                          <td>
                            <span className={`status-tag ${item.status.toLowerCase()}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-container">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleActionClick(item)}
                                title="Edit"
                              >
                                <img src={actionIcon} alt="Edit" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* show "no results" row if nothing to display */}
                      {paginatedLeaves.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "24px" }}>
                            No leave requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination (bottom-right under the table) */}
                <div className="pagination-container">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              </div>

              {/* MOBILE CARDS */}
              <div className="leave-cards">
                {paginatedLeaves.map((item) => (
                  <div className="leave-card" key={item.id}>
                    <div className="card-top">
                      <h4>{item.employee}</h4>
                      <div className="card-action-buttons">
                        <button
                          className="card-action-btn edit-btn"
                          onClick={() => handleActionClick(item)}
                          title="Edit"
                        >
                          <img src={actionIcon} alt="Edit" />
                        </button>
                      </div>
                    </div>

                    <div className="card-row">
                      <span>Type</span>
                      <p>{item.type}</p>
                    </div>
                    <div className="card-row">
                      <span>Reason</span>
                      <p>{item.reason}</p>
                    </div>
                    <div className="card-row">
                      <span>From</span>
                      <p>{item.from}</p>
                    </div>
                    <div className="card-row">
                      <span>To</span>
                      <p>{item.to}</p>
                    </div>

                    <div className="card-row">
                      <span>Status</span>
                      <p className={`status-badge ${item.status.toLowerCase()}`}>
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for cards on mobile (kept the same pagination component) */}
              <div className="pagination-container pagination-container--mobile">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* BACKDROP (covers viewport; click to close popup) */}
      <div
        className={`lmodal-backdrop ${showPopup ? "visible" : ""}`}
        onClick={closePopup}
      />

      {/* MODAL WRAPPER (popup is rendered here so it is not blurred) */}
      {showPopup && (
        <div className="lmodal" role="dialog" aria-modal="true">
          {popupType === "fullDay" && (
            <FullDayLeavePopup data={selectedLeave} onClose={closePopup} onRefresh={refreshLeaveRequests} />
          )}
          {popupType === "halfDay" && (
            <HalfDayLeavePopup data={selectedLeave} onClose={closePopup} onRefresh={refreshLeaveRequests} />
          )}
          {popupType === "hours" && (
            <HoursPermissionLeavePopup data={selectedLeave} onClose={closePopup} onRefresh={refreshLeaveRequests} />
          )}

        </div>
      )}
    </>
  );
}