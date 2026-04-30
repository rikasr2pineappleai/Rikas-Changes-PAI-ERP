// // current_emp_list.js (updated: unique class names prefixed with cemp-)
// import React from "react";
// import "../../styles/current_emp_list.css";
// import filter from "../../assets/icons/filterricon.png";
// import search from "../../assets/icons/searchicon.png";
// import greenicon from "../../assets/icons/editicon.png"; // green icon
// import blueicon from "../../assets/icons/editblueicon.png"; // blue icon
// import tempimg from "../../assets/icons/img.png";

// const CurrentEmpList = () => {
//   const employees = [
//     {
//       id: "01",
//       name: "Y. Kishana",
//       designation: "Full Stack Engineer",
//       role: "Team Lead",
//       mgmtRole: "-",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "02",
//       name: "A. Nimal",
//       designation: "UI/UX Engineer",
//       role: "Team Lead",
//       mgmtRole: "-",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "03",
//       name: "B. Perera",
//       designation: "QA Engineer",
//       role: "Associate",
//       mgmtRole: "COO",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "04",
//       name: "S. Sanjeevan",
//       designation: "Mobile App Developer",
//       role: "Intern",
//       mgmtRole: "CHRO",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "05",
//       name: "R. Fernando",
//       designation: "Back end Developer",
//       role: "Senior",
//       mgmtRole: "-",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "06",
//       name: "K. Silva",
//       designation: "UI/UX Engineer",
//       role: "Intern",
//       mgmtRole: "-",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//   ];

//   return (
//     <div className="cemp-section">
//       <div className="cemp-header-box">
//         <div className="cemp-title-section">
//           <h2>Current Employee</h2>
//           {/* show count dynamically so it's always correct */}
//           <p>{employees.length} of 30 employees available</p>
//         </div>

//         <div className="cemp-controls">
//           <img src={filter} alt="Filter" className="cemp-filter-icon" />
//           <div className="cemp-search-bar">
//             <img src={search} alt="Search" className="cemp-search-icon" />
//             <input type="text" placeholder="Search" />
//           </div>
//         </div>
//       </div>

//       <table className="cemp-form-table">
//         <thead>
//           <tr>
//             <th>Emp ID</th>
//             <th>Employee Name</th>
//             <th>Designation</th>
//             <th>Role</th>
//             <th>Management Role</th>
//             <th>Reporting Manager</th>
//             <th>Action</th>
//           </tr>
//         </thead>

//         <tbody>
//           {employees.map((emp) => (
//             <tr key={emp.id}>
//               <td>
//                 <span
//                  // className="cemp-id-circle"
//                 //  style={{ backgroundColor: emp.idColor || "#777" }}
//                 >
//                   {emp.id}
//                 </span>
//               </td>

//               <td>
//                 {/* avatar is decorative because name text is shown next to it;
//                     so make alt="" and aria-hidden so screen readers do not double announce */}
//                 <span className="cemp-name-cell">
//                   <img
//                     src={emp.avatar}
//                     alt=""
//                     aria-hidden="true"
//                     className="cemp-avatar"
//                   />
//                   <span className="cemp-name-text">{emp.name}</span>
//                 </span>
//               </td>
//               <td>{emp.designation}</td>
//               <td>{emp.role}</td>
//               <td>{emp.mgmtRole}</td>

//               <td>
//                 <span className="cemp-manager-cell">
//                   <img
//                     src={emp.managerAvatar}
//                     alt=""
//                     aria-hidden="true"
//                     className="cemp-avatar"
//                   />
//                   <span className="cemp-manager-text">{emp.manager}</span>
//                 </span>
//               </td>

//               <td>
//                 <button className="cemp-action-btn" aria-label="green action">
//                   <img src={greenicon} alt="Green Action" />
//                 </button>

//                 <button className="cemp-action-btn" aria-label="blue action">
//                   <img src={blueicon} alt="Blue Action" />
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// // export default CurrentEmpList;
// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "../../styles/current_emp_list.css";

// import filter from "../../assets/icons/filterricon.png";
// import search from "../../assets/icons/searchicon.png";
// import greenicon from "../../assets/icons/editicon.png";
// import blueicon from "../../assets/icons/editblueicon.png";
// import tempimg from "../../assets/icons/img.png";

// const CurrentEmpList = () => {
//   const navigate = useNavigate();

//   const employees = [
//     {
//       id: "01",
//       name: "Y. Kishana",
//       designation: "Full Stack Engineer",
//       role: "Team Lead",
//       mgmtRole: "-",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "02",
//       name: "A. Nimal",
//       designation: "UI/UX Engineer",
//       role: "Team Lead",
//       mgmtRole: "-",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "03",
//       name: "B. Perera",
//       designation: "QA Engineer",
//       role: "Associate",
//       mgmtRole: "COO",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//     {
//       id: "04",
//       name: "S. Sanjeevan",
//       designation: "Mobile App Developer",
//       role: "Intern",
//       mgmtRole: "CHRO",
//       manager: "S. Sanjeevan",
//       avatar: tempimg,
//       managerAvatar: tempimg,
//     },
//   ];

//   // 🔥 Function to navigate to Employee Overview
//   const openOverview = (empId) => {
//     navigate(`/employees/${empId}/overview`);
//   };

//   return (
//     <div className="cemp-section">
//       <div className="cemp-header-box">
//         <div className="cemp-title-section">
//           <h2>Current Employee</h2>
//           <p>{employees.length} of 30 employees available</p>
//         </div>

//         <div className="cemp-controls">
//           <img src={filter} alt="Filter" className="cemp-filter-icon" />
//           <div className="cemp-search-bar">
//             <img src={search} alt="Search" className="cemp-search-icon" />
//             <input type="text" placeholder="Search" />
//           </div>
//         </div>
//       </div>

//       <table className="cemp-form-table">
//         <thead>
//           <tr>
//             <th>Emp ID</th>
//             <th>Employee Name</th>
//             <th>Designation</th>
//             <th>Role</th>
//             <th>Management Role</th>
//             <th>Reporting Manager</th>
//             <th>Action</th>
//           </tr>
//         </thead>

//         <tbody>
//           {employees.map((emp) => (
//             <tr key={emp.id}>
//               <td>{emp.id}</td>

//               <td>
//                 <span className="cemp-name-cell">
//                   <img src={emp.avatar} alt="" aria-hidden="true" className="cemp-avatar" />
//                   <span className="cemp-name-text">{emp.name}</span>
//                 </span>
//               </td>

//               <td>{emp.designation}</td>
//               <td>{emp.role}</td>
//               <td>{emp.mgmtRole}</td>

//               <td>
//                 <span className="cemp-manager-cell">
//                   <img src={emp.managerAvatar} alt="" aria-hidden="true" className="cemp-avatar" />
//                   <span className="cemp-manager-text">{emp.manager}</span>
//                 </span>
//               </td>

//               <td>
//                 <button className="cemp-action-btn">
//                   <img src={greenicon} alt="Green Action" />
//                 </button>

//                 {/* 🔥 This button opens EmployeeOverview */}
//                 <button
//                   className="cemp-action-btn"
//                   onClick={() => openOverview(emp.id)}
//                 >
//                   <img src={blueicon} alt="Blue Action" />
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default CurrentEmpList;

// (previous commented-out legacy code preserved above this line in original file)

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/current_emp_list.css";
import employeeAPI from "../../integration/employeeAPI";
import Pagination from "../../components/Pagination";
import { getEmployeeImageUrl } from "../../utils/imageUtils";

import filter from "../../assets/icons/filterricon.png";
import search from "../../assets/icons/searchicon.png";
import greenicon from "../../assets/icons/editicon.png";
import blueicon from "../../assets/icons/editblueicon.png";
import tempimg from "../../assets/icons/img.png";

const CurrentEmpList = ({ page = 1, setTotalPages }) => {
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

  // Fetch active employees from the backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeAPI.getAllEmployees(page, 10);
        if (response.success) {
          const filteredEmployees = response.data.employees.filter(
            (emp) => emp.status === "active"
          );

          const transformedEmployees = filteredEmployees.map((emp) => {
            const avatar = getEmployeeImageUrl(emp, tempimg);
            const managerAvatar = emp.ReportTo
              ? getEmployeeImageUrl(emp.ReportTo, tempimg)
              : tempimg;

            return {
              id: emp.id,
              empId: emp.emp_id,
              name: `${emp.first_name} ${emp.last_name || ""}`.trim(),
              designation: emp.designation || "-",
              role: emp.role || "-",
              mgmtRole: emp.management_role || "-",
              manager: emp.ReportTo
                ? `${emp.ReportTo.first_name} ${emp.ReportTo.last_name || ""}`.trim()
                : "-",
              avatar: avatar,
              managerAvatar: managerAvatar,
            };
          });

          setEmployees(transformedEmployees);

          if (setTotalPages && response.data.pagination) {
            setTotalPages(response.data.pagination.pages);
            setTotalPagesState(response.data.pagination.pages);
          } else {
            setTotalPagesState(1);
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

  const clearFilters = () => {
    setFilterDesignation("");
    setFilterRole("");
    setFilterMgmtRole("");
  };

  const hasActiveFilter = filterDesignation || filterRole || filterMgmtRole;

  // Navigate to Employee Overview (GREEN button)
  const openOverview = (empId) => {
    navigate(`/employees/${empId}/overview`);
  };

  // Navigate to Edit Employee (BLUE button)
  const openEdit = (empId) => {
    navigate(`/employees/${empId}/edit`);
  };

  if (loading) {
    return (
      <div className="cemp-section">
        <div className="cemp-header-box">
          <div className="cemp-title-section">
            <h2>Current Employee</h2>
            <p>Loading employees...</p>
          </div>
          <div className="cemp-controls">
            <div className="cemp-filter-wrap">
              <button className="cemp-filter-btn" disabled aria-label="Filter">
                <img src={filter} alt="Filter" className="cemp-filter-icon" />
              </button>
            </div>
            <div className="cemp-search-bar">
              <img src={search} alt="Search" className="cemp-search-icon" />
              <input type="text" placeholder="Search" disabled />
            </div>
          </div>
        </div>
        <div className="loading">Loading employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cemp-section">
        <div className="cemp-header-box">
          <div className="cemp-title-section">
            <h2>Current Employee</h2>
            <p>Error loading employees</p>
          </div>
        </div>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="cemp-section">
      {/* Header Box */}
      <div className="cemp-header-box">
        <div className="cemp-title-section">
          <h2>Current Employee</h2>
          <p>
            {employees.length} of {setTotalPages ? "unknown" : employees.length}{" "}
            employees available
          </p>
        </div>

        <div className="cemp-controls">
          {/* Filter button + dropdown */}
          <div className="cemp-filter-wrap">
            <button
              ref={filterBtnRef}
              className="cemp-filter-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setShowFilter((p) => !p)}
              aria-label="Filter"
              aria-expanded={showFilter}
            >
              <img src={filter} alt="Filter" className="cemp-filter-icon" />
            </button>

            {showFilter && (
              <div ref={filterDropdownRef} className="cemp-filter-dropdown">

                {/* Designation */}
                {designationOptions.length > 0 && (
                  <div className="cemp-filter-section">
                    <p className="cemp-filter-title">Designation</p>
                    {designationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`cemp-filter-row${filterDesignation === opt ? " active" : ""}`}
                        onClick={() => setFilterDesignation((p) => (p === opt ? "" : opt))}
                      >
                        <span className={`cemp-filter-check${filterDesignation === opt ? " active" : ""}`} />
                        <span className="cemp-filter-text">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Role */}
                {roleOptions.length > 0 && (
                  <div className="cemp-filter-section">
                    <p className="cemp-filter-title">Role</p>
                    {roleOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`cemp-filter-row${filterRole === opt ? " active" : ""}`}
                        onClick={() => setFilterRole((p) => (p === opt ? "" : opt))}
                      >
                        <span className={`cemp-filter-check${filterRole === opt ? " active" : ""}`} />
                        <span className="cemp-filter-text">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Management Role */}
                {mgmtRoleOptions.length > 0 && (
                  <div className="cemp-filter-section">
                    <p className="cemp-filter-title">Management Role</p>
                    {mgmtRoleOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`cemp-filter-row${filterMgmtRole === opt ? " active" : ""}`}
                        onClick={() => setFilterMgmtRole((p) => (p === opt ? "" : opt))}
                      >
                        <span className={`cemp-filter-check${filterMgmtRole === opt ? " active" : ""}`} />
                        <span className="cemp-filter-text">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button type="button" className="cemp-filter-clear" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="cemp-search-bar">
            <img src={search} alt="Search" className="cemp-search-icon" />
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
      <div className="cemp-table-container">
        <table className="cemp-form-table">
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Role</th>
              <th>Management Role</th>
              <th>Reporting Manager</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {employees
              .filter((emp) => {
                // Search filter
                if (searchTerm) {
                  const s = searchTerm.toLowerCase();
                  const match =
                    emp.name.toLowerCase().includes(s) ||
                    emp.empId.toLowerCase().includes(s) ||
                    emp.designation.toLowerCase().includes(s) ||
                    emp.role.toLowerCase().includes(s);
                  if (!match) return false;
                }
                // Designation filter
                if (filterDesignation && emp.designation !== filterDesignation) return false;
                // Role filter
                if (filterRole && emp.role !== filterRole) return false;
                // Management Role filter
                if (filterMgmtRole && emp.mgmtRole !== filterMgmtRole) return false;
                return true;
              })
              .map((emp) => (
              <tr key={emp.id}>
                <td>{emp.empId}</td>

                <td>
                  <span className="cemp-name-cell">
                    <img
                      src={emp.avatar}
                      alt=""
                      aria-hidden="true"
                      className="cemp-avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = tempimg; }}
                    />
                    <span className="cemp-name-text">{emp.name}</span>
                  </span>
                </td>

                <td>{emp.designation}</td>
                <td>{emp.role}</td>
                <td>{emp.mgmtRole}</td>

                <td>
                  <span className="cemp-manager-cell">
                    <img
                      src={emp.managerAvatar}
                      alt=""
                      aria-hidden="true"
                      className="cemp-avatar"
                      onError={(e) => { e.target.onerror = null; e.target.src = tempimg; }}
                    />
                    <span className="cemp-manager-text">{emp.manager}</span>
                  </span>
                </td>

                <td>
                  <button className="cemp-action-btn" onClick={() => openOverview(emp.id)}>
                    <img src={greenicon} alt="View Overview" />
                  </button>
                  <button className="cemp-action-btn" onClick={() => openEdit(emp.id)}>
                    <img src={blueicon} alt="Edit Employee" />
                  </button>
                </td>
              </tr>
            ))}

            {employees.filter((emp) => {
              if (searchTerm) {
                const s = searchTerm.toLowerCase();
                if (!(emp.name.toLowerCase().includes(s) || emp.empId.toLowerCase().includes(s) || emp.designation.toLowerCase().includes(s) || emp.role.toLowerCase().includes(s))) return false;
              }
              if (filterDesignation && emp.designation !== filterDesignation) return false;
              if (filterRole && emp.role !== filterRole) return false;
              if (filterMgmtRole && emp.mgmtRole !== filterMgmtRole) return false;
              return true;
            }).length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrentEmpList;