import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/former_emp_list.css";
import employeeAPI from "../../integration/employeeAPI"; // Import the employee API
import { getEmployeeImageUrl } from "../../utils/imageUtils";

import filter from "../../assets/icons/filterricon.png";
import search from "../../assets/icons/searchicon.png";
import greenicon from "../../assets/icons/editicon.png"; // Overview
import blueicon from "../../assets/icons/editblueicon.png"; // Edit
import tempp from "../../assets/icons/img.png";

const FormerEmpList = ({ page = 1, setPage, setTotalPages }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    designations: [],
    roles: [],
    management_roles: [],
  });

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterDesignation, setFilterDesignation] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterMgmtRole, setFilterMgmtRole] = useState("");
  const filterDropdownRef = useRef(null);
  const filterBtnRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // Fetch former employees (inactive and terminated) from the backend
  useEffect(() => {
    let ignoreResponse = false;

    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeAPI.getAllEmployees(page, 10, "former", {
          designation: filterDesignation,
          role: filterRole,
          management_role: filterMgmtRole,
          search: debouncedSearchTerm,
        });
        if (ignoreResponse) return;

        if (response.success) {
          const transformedEmployees = response.data.employees.map((emp) => ({
            id: emp.id, // Use the actual database user ID
            empId: emp.emp_id, // Store emp_id separately
            name: `${emp.first_name} ${emp.last_name || ""}`.trim(),
            designation: emp.designation || "-",
            role: emp.role || "-",
            mgmtRole: emp.management_role || "-",
            avatar: getEmployeeImageUrl(emp, tempp),
          }));

          setEmployees(transformedEmployees);
          setFilterOptions(response.data.filter_options || {
            designations: [],
            roles: [],
            management_roles: [],
          });

          // Update total pages if provided
          if (setTotalPages && response.data.pagination) {
            setTotalPages(Math.max(response.data.pagination.pages, 1));
          }
        } else {
          setError(response.message || "Failed to fetch employees");
        }
      } catch (err) {
        if (ignoreResponse) return;
        console.error("Error fetching employees:", err);
        setError("An error occurred while fetching employees");
      } finally {
        if (!ignoreResponse) setLoading(false);
      }
    };

    fetchEmployees();
    return () => {
      ignoreResponse = true;
    };
  }, [
    page,
    setTotalPages,
    location.state?.refresh,
    filterDesignation,
    filterRole,
    filterMgmtRole,
    debouncedSearchTerm,
  ]);

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

  const designationOptions = filterOptions.designations;
  const roleOptions = filterOptions.roles;
  const mgmtRoleOptions = filterOptions.management_roles;

  const updateFilter = (setter, value) => {
    if (setPage) setPage(1);
    setter((current) => (current === value ? "" : value));
  };

  const clearFilters = () => {
    if (setPage) setPage(1);
    setFilterDesignation("");
    setFilterRole("");
    setFilterMgmtRole("");
  };

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
                        onClick={() => updateFilter(setFilterDesignation, opt)}
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
                        onClick={() => updateFilter(setFilterRole, opt)}
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
                        onClick={() => updateFilter(setFilterMgmtRole, opt)}
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
              onChange={(e) => {
                if (setPage) setPage(1);
                setSearchTerm(e.target.value);
              }}
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
            {employees.map((emp) => (
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
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                  No former employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormerEmpList;
