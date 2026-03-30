import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/former_emp_list.css";
import employeeAPI from "../../integration/employeeAPI"; // Import the employee API
import Pagination from "../../components/Pagination"; // Import Pagination component
import { getEmployeeImageUrl } from "../../utils/imageUtils";

import filter from "../../assets/icons/filterricon.png";
import search from "../../assets/icons/searchicon.png";
import greenicon from "../../assets/icons/editicon.png"; // Overview
import blueicon from "../../assets/icons/editblueicon.png"; // Edit
import tempp from "../../assets/icons/img.png";

const FormerEmpList = ({ page = 1, setTotalPages }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Use the page prop from parent directly, no local state needed for currentPage
  // const [currentPage, setCurrentPage] = useState(page); // Removed to prevent shadowing parent prop
  const [totalPages, setTotalPagesState] = useState(1); // Local state for total pages

  // Fetch former employees (inactive and terminated) from the backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        // Fetch all employees regardless of status
        const response = await employeeAPI.getAllEmployees(page, 10); // Get all employees

        if (response.success) {
          // Filter to show only inactive and terminated employees (former employees)
          const filteredEmployees = response.data.employees.filter(
            (emp) => emp.status === "inactive" || emp.status === "terminated"
          );

          // Transform the backend response to match the frontend format
          const transformedEmployees = filteredEmployees.map((emp) => ({
            id: emp.id, // Use the actual database user ID
            empId: emp.emp_id, // Store emp_id separately
            name: `${emp.first_name} ${emp.last_name || ""}`.trim(),
            designation: emp.designation || "-",
            role: emp.role || "-",
            mgmtRole: emp.management_role || "-",
            avatar: getEmployeeImageUrl(emp, tempp),
          }));

          setEmployees(transformedEmployees);

          // Update total pages if provided
          if (setTotalPages && response.data.pagination) {
            setTotalPages(response.data.pagination.pages);
            setTotalPagesState(response.data.pagination.pages); // Update local state
          } else {
            setTotalPagesState(1); // Default to 1 if no pagination info
          }
        } else {
          setError(response.message || "Failed to fetch employees");
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("An error occurred while fetching employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [page, setTotalPages, location.state?.refresh]); // Use page prop for dependency

  // 🔥 Navigate to Employee Overview (GREEN button)
  const openOverview = (empId) => {
    navigate(`/employees/${empId}/overview`);
  };

  // 🔥 Navigate to Edit Employee (BLUE button)
  const openEdit = (empId) => {
    navigate(`/employees/${empId}/edit`);
  };

  if (loading) {
    return (
      <div className="femp-section">
        <div className="femp-header-box">
          <div className="femp-title-section">
            <h2>Former Employee</h2>
          </div>
          <div className="femp-controls">
            <img src={filter} alt="Filter" className="femp-filter-icon" />
            <div className="femp-search-bar">
              <img src={search} alt="Search" className="femp-search-icon" />
              <input type="text" placeholder="Search" disabled />
            </div>
          </div>
        </div>
        <div className="loading">Loading former employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="femp-section">
        <div className="femp-header-box">
          <div className="femp-title-section">
            <h2>Former Employee</h2>
          </div>
        </div>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="femp-section">
      <div className="femp-header-box">
        <div className="femp-title-section">
          <h2>Former Employee</h2>
        </div>
        <div className="femp-controls">
          <img src={filter} alt="Filter" className="femp-filter-icon" />
          <div className="femp-search-bar">
            <img src={search} alt="Search" className="femp-search-icon" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      {/* Table container */}
      <div className="femp-table-container">
        {/* Table */}
        <table className="femp-form-table">
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Role</th>
              <th>Management Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees
              .filter((emp) => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                return (
                  emp.name.toLowerCase().includes(searchLower) ||
                  emp.empId.toLowerCase().includes(searchLower) ||
                  emp.designation.toLowerCase().includes(searchLower) ||
                  emp.role.toLowerCase().includes(searchLower)
                );
              })
              .map((emp) => (
              <tr key={emp.id}>
                <td>{emp.empId}</td>
                <td>
                  <span className="femp-name-cell">
                    <img
                      src={emp.avatar}
                      alt=""
                      aria-hidden="true"
                      className="femp-avatar"
                      onError={(e) => {
                        e.target.onerror = null; // prevents looping
                        e.target.src = tempp; // fallback to default profile
                      }}
                    />
                    <span className="femp-name-text">{emp.name}</span>
                  </span>
                </td>
                <td>{emp.designation}</td>
                <td>{emp.role}</td>
                <td>{emp.mgmtRole}</td>
                <td>
                  {/* 🟢 GREEN button = Overview */}
                  <button
                    className="femp-action-btn"
                    onClick={() => openOverview(emp.id)}
                  >
                    <img src={greenicon} alt="View Overview" />
                  </button>
                  {/* 🔵 BLUE button = Edit Employee */}
                  <button
                    className="femp-action-btn"
                    onClick={() => openEdit(emp.id)}
                  >
                    <img src={blueicon} alt="Edit Employee" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormerEmpList;