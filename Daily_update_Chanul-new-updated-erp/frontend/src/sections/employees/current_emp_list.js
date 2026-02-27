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

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/current_emp_list.css";
import employeeAPI from "../../integration/employeeAPI"; // Import the employee API
import Pagination from "../../components/Pagination"; // Import Pagination component
import { getEmployeeImageUrl } from "../../utils/imageUtils";

import filter from "../../assets/icons/filterricon.png";
import search from "../../assets/icons/searchicon.png";
import greenicon from "../../assets/icons/editicon.png"; // Overview (was Edit)
import blueicon from "../../assets/icons/editblueicon.png"; // Edit (was Overview)
import tempimg from "../../assets/icons/img.png";

const CurrentEmpList = ({ page = 1, setTotalPages }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Use the page prop from parent directly, no local state needed for currentPage
  // const [currentPage, setCurrentPage] = useState(page); // Removed to prevent shadowing parent prop
  const [totalPages, setTotalPagesState] = useState(1); // Local state for total pages

  // Fetch active and inactive employees from the backend (not terminated)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeAPI.getAllEmployees(page, 10); // Use page prop from parent for pagination

        if (response.success) {
          // Filter to show only active employees (inactive and terminated are former employees)
          const filteredEmployees = response.data.employees.filter(
            (emp) => emp.status === "active"
          );

          // Transform the backend response to match the frontend format
          const transformedEmployees = filteredEmployees.map((emp) => {
            const avatar = getEmployeeImageUrl(emp, tempimg);

            // Construct manager avatar URL
            const managerAvatar = emp.ReportTo
              ? getEmployeeImageUrl(emp.ReportTo, tempimg)
              : tempimg;

            return {
              id: emp.id, // Use the actual database user ID
              empId: emp.emp_id, // Store emp_id separately
              name: `${emp.first_name} ${emp.last_name || ""}`.trim(),
              designation: emp.designation || "-",
              role: emp.role || "-",
              mgmtRole: emp.management_role || "-",
              manager: emp.ReportTo
                ? `${emp.ReportTo.first_name} ${
                    emp.ReportTo.last_name || ""
                  }`.trim()
                : "-",
              avatar: avatar,
              managerAvatar: managerAvatar,
            };
          });

          setEmployees(transformedEmployees);

          // Update total pages if provided
          if (setTotalPages && response.data.pagination) {
            // Adjust the total pages to reflect the filtered results
            // This is a simplified approach - in a real app you'd want to make a separate call for filtered counts
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
    // Use the actual database user ID for navigation
    navigate(`/employees/${empId}/overview`);
  };

  // 🔥 Navigate to Edit Employee (BLUE button)
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
            <img src={filter} alt="Filter" className="cemp-filter-icon" />
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
          <img src={filter} alt="Filter" className="cemp-filter-icon" />
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
        {/* Table */}
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
                  <span className="cemp-name-cell">
                    <img
                      src={emp.avatar}
                      alt=""
                      aria-hidden="true"
                      className="cemp-avatar"
                      onError={(e) => {
                        e.target.onerror = null; // prevents looping
                        e.target.src = tempimg; // fallback to default profile
                      }}
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
                      onError={(e) => {
                        e.target.onerror = null; // prevents looping
                        e.target.src = tempimg; // fallback to default profile
                      }}
                    />
                    <span className="cemp-manager-text">{emp.manager}</span>
                  </span>
                </td>

                {/* ACTION BUTTONS */}
                <td>
                  {/* 🟢 GREEN button = Overview */}
                  <button
                    className="cemp-action-btn"
                    onClick={() => openOverview(emp.id)}
                  >
                    <img src={greenicon} alt="View Overview" />
                  </button>

                  {/* 🔵 BLUE button = Edit Employee */}
                  <button
                    className="cemp-action-btn"
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

export default CurrentEmpList;