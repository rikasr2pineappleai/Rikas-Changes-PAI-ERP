import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const [totalPages, setTotalPagesState] = useState(1);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterMgmtRole, setFilterMgmtRole] = useState("");
  const filterDropdownRef = useRef(null);
  const filterBtnRef = useRef(null);

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
  }, [page, setTotalPages, location.state?.refresh]);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!showFilter) return;
    const handleOutside = (e) => {
      if (
        filterDropdownRef.current && !filterDropdownRef.current.contains(e.target) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target)
      ) setShowFilter(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showFilter]);

  // Unique filter options from loaded data
  const designationOptions = useMemo(
    () => [...new Set(employees.map((e) => e.designation).filter((v) => v && v !== "-"))].sort(),
    [employees]
  );
  const roleOptions = useMemo(
    () => [...new Set(employees.map((e) => e.role).filter((v) => v && v !== "-"))].sort(),
    [employees]
  );
  const mgmtRoleOptions = useMemo(
    () => [...new Set(employees.map((e) => e.mgmtRole).filter((v) => v && v !== "-"))].sort(),
    [employees]
  );
  const clearFilters = () => { setFilterDesignation(""); setFilterRole(""); setFilterMgmtRole(""); };

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
            <div className="femp-filter-wrap">
              <button className="femp-filter-btn" disabled aria-label="Filter">
                <img src={filter} alt="Filter" className="femp-filter-icon" />
              </button>
            </div>
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
          {/* Filter button + dropdown */}
          <div className="femp-filter-wrap">
            <button
              ref={filterBtnRef}
              className="femp-filter-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setShowFilter((p) => !p)}
              aria-label="Filter"
              aria-expanded={showFilter}
            >
              <img src={filter} alt="Filter" className="femp-filter-icon" />
            </button>

            {showFilter && (
              <div ref={filterDropdownRef} className="femp-filter-dropdown">

                {designationOptions.length > 0 && (
                  <div className="femp-filter-section">
                    <p className="femp-filter-title">Designation</p>
                    {designationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`femp-filter-row${filterDesignation === opt ? " active" : ""}`}
                        onClick={() => setFilterDesignation((p) => (p === opt ? "" : opt))}
                      >
                        <span className={`femp-filter-check${filterDesignation === opt ? " active" : ""}`} />
                        <span className="femp-filter-text">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {roleOptions.length > 0 && (
                  <div className="femp-filter-section">
                    <p className="femp-filter-title">Role</p>
                    {roleOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`femp-filter-row${filterRole === opt ? " active" : ""}`}
                        onClick={() => setFilterRole((p) => (p === opt ? "" : opt))}
                      >
                        <span className={`femp-filter-check${filterRole === opt ? " active" : ""}`} />
                        <span className="femp-filter-text">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {mgmtRoleOptions.length > 0 && (
                  <div className="femp-filter-section">
                    <p className="femp-filter-title">Management Role</p>
                    {mgmtRoleOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`femp-filter-row${filterMgmtRole === opt ? " active" : ""}`}
                        onClick={() => setFilterMgmtRole((p) => (p === opt ? "" : opt))}
                      >
                        <span className={`femp-filter-check${filterMgmtRole === opt ? " active" : ""}`} />
                        <span className="femp-filter-text">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button type="button" className="femp-filter-clear" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Search */}
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
                if (searchTerm) {
                  const s = searchTerm.toLowerCase();
                  const match =
                    emp.name.toLowerCase().includes(s) ||
                    emp.empId.toLowerCase().includes(s) ||
                    emp.designation.toLowerCase().includes(s) ||
                    emp.role.toLowerCase().includes(s);
                  if (!match) return false;
                }
                if (filterDesignation && emp.designation !== filterDesignation) return false;
                if (filterRole && emp.role !== filterRole) return false;
                if (filterMgmtRole && emp.mgmtRole !== filterMgmtRole) return false;
                return true;
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