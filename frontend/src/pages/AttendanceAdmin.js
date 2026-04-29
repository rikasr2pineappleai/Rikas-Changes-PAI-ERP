import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchAllAttendanceRecords,
  fetchEmployeeAttendanceRecords,
} from "../integration/attendanceAPI";
import calendarIcon from "../assets/icons/calender.png";
import "../styles/AttendanceAdmin.css";

const PAGE_SIZE = 10;

const normalizeStatus = (status) => {
  if (!status) return "unknown";
  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
};

const getCanonicalStatus = (status) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "on_time" || normalizedStatus === "ontime") {
    return "on_time";
  }

  if (normalizedStatus === "late") {
    return "late";
  }

  if (
    normalizedStatus === "early_arrival" ||
    normalizedStatus === "earlyarrival"
  ) {
    return "early_arrival";
  }

  return normalizedStatus;
};

const getStatusLabel = (status) => {
  const normalizedStatus = getCanonicalStatus(status);

  if (normalizedStatus === "on_time") return "On time";
  if (normalizedStatus === "late") return "Late";
  if (normalizedStatus === "early_arrival") return "Early arrival";
  if (normalizedStatus === "absent") return "Absent";
  if (normalizedStatus === "leave") return "Leave";

  return String(status || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusClassName = (status) => {
  const normalizedStatus = getCanonicalStatus(status);

  if (normalizedStatus === "on_time") return "on-time";
  if (normalizedStatus === "late") return "late";
  if (normalizedStatus === "early_arrival") return "early-arrival";
  if (normalizedStatus === "absent") return "absent";
  if (normalizedStatus === "leave") return "leave";

  return "default";
};

const FILTERABLE_STATUSES = ["on_time", "late"];

const getEmployeeName = (record) => {
  const user = record?.User || {};
  const fullName = `${user.first_name || record?.first_name || ""} ${
    user.last_name || record?.last_name || ""
  }`.trim();

  return (
    fullName ||
    record?.employee_name ||
    record?.employeeName ||
    user.name ||
    "N/A"
  );
};

const getEmployeeId = (record) =>
  String(
    record?.user_id ||
      record?.emp_id ||
      record?.employee_id ||
      record?.User?.id ||
      record?.User?.emp_id ||
      record?.User?.user_id ||
      "",
  );

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeString) => {
  if (!timeString) return "N/A";

  return new Date(timeString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatHours = (hours) => {
  if (hours === null || hours === undefined || hours === "") return "N/A";
  return `${Number(hours).toFixed(2)}h`;
};

const formatBreakDuration = (seconds) => {
  const totalSeconds = Number(seconds || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
};

const toDateValue = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
};

const matchesDateRange = (recordDate, startDate, endDate) => {
  const normalizedDate = toDateValue(recordDate);
  if (!normalizedDate) return false;

  if (startDate && normalizedDate < startDate) return false;
  if (endDate && normalizedDate > endDate) return false;

  return true;
};

function EmployeeFilterModal({ open, onClose, employees, value, onConfirm }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(value ? String(value) : "");

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedId(value ? String(value) : "");
    }
  }, [open, value]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return employees;

    return employees.filter((employee) => {
      const name = (employee.name || "").toLowerCase();
      const employeeCode = (employee.employeeCode || "").toLowerCase();

      return (
        name.includes(normalizedQuery) || employeeCode.includes(normalizedQuery)
      );
    });
  }, [employees, searchQuery]);

  if (!open) return null;

  return (
    <div className="attendance-filter-modal-overlay" onMouseDown={onClose}>
      <div
        className="attendance-filter-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="attendance-filter-modal-header">
          <h3>Employee</h3>
          <button
            type="button"
            className="attendance-filter-modal-close"
            onClick={onClose}
            aria-label="Close employee filter"
          >
            x
          </button>
        </div>

        <div className="attendance-filter-search">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="attendance-filter-list">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee) => {
              const isActive = String(employee.id) === String(selectedId);

              return (
                <button
                  key={employee.id}
                  type="button"
                  className={`attendance-filter-option ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() => setSelectedId(String(employee.id))}
                >
                  <span
                    className={`attendance-filter-checkbox ${
                      isActive ? "checked" : ""
                    }`}
                    aria-hidden="true"
                  />
                  <span className="attendance-filter-avatar" aria-hidden="true">
                    {employee.initials}
                  </span>
                  <span className="attendance-filter-option-text">
                    <span className="attendance-filter-option-name">
                      {employee.name}
                    </span>
                    <span className="attendance-filter-option-role">
                      employee
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="attendance-filter-empty">No employees found.</div>
          )}
        </div>

        <button
          type="button"
          className="attendance-filter-confirm"
          onClick={() => {
            onConfirm(selectedId);
            onClose();
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function AttendanceAdmin() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const isEmployeeView = Boolean(employeeId);
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    employeeName: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    employeeName: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [isEmployeeFilterOpen, setIsEmployeeFilterOpen] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        let records = [];

        if (employeeId) {
          const response = await fetchEmployeeAttendanceRecords(
            employeeId,
            1,
            500,
          );
          records = response?.data?.attendance_records || [];
        } else {
          const firstPageResponse = await fetchAllAttendanceRecords(1, 500);
          const firstPageRecords =
            firstPageResponse?.data?.attendance_records || [];
          const totalPages = firstPageResponse?.data?.pagination?.pages || 1;

          records = firstPageRecords;

          if (totalPages > 1) {
            const remainingResponses = await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                fetchAllAttendanceRecords(index + 2, 500),
              ),
            );

            records = [
              ...firstPageRecords,
              ...remainingResponses.flatMap(
                (response) => response?.data?.attendance_records || [],
              ),
            ];
          }
        }

        setAllAttendanceData(records);
      } catch (err) {
        setError(err.message || "Failed to load attendance data");
        console.error("Error fetching attendance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [employeeId]);

  const filteredAttendanceData = useMemo(() => {
    return allAttendanceData.filter((record) => {
      const currentEmployeeId = getEmployeeId(record);
      const normalizedStatus = getCanonicalStatus(record.status);

      if (
        appliedFilters.employeeName &&
        String(currentEmployeeId) !== String(appliedFilters.employeeName)
      ) {
        return false;
      }

      if (
        appliedFilters.status &&
        normalizedStatus !== getCanonicalStatus(appliedFilters.status)
      ) {
        return false;
      }

      if (appliedFilters.startDate || appliedFilters.endDate) {
        return matchesDateRange(
          record.date,
          appliedFilters.startDate,
          appliedFilters.endDate,
        );
      }

      return true;
    });
  }, [allAttendanceData, appliedFilters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAttendanceData.length / PAGE_SIZE),
  );

  const paginatedAttendanceData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAttendanceData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredAttendanceData]);

  const availableStatuses = useMemo(() => {
    return FILTERABLE_STATUSES;
  }, []);

  const employeeOptions = useMemo(() => {
    const employeeMap = new Map();

    allAttendanceData.forEach((record) => {
      const id = getEmployeeId(record);
      const name = getEmployeeName(record);

      if (!id || !name || employeeMap.has(String(id))) return;

      const nameParts = name
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean);

      const initials = nameParts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

      employeeMap.set(String(id), {
        id: String(id),
        name,
        employeeCode: record?.User?.emp_id || record?.emp_id || "",
        initials: initials || name.charAt(0).toUpperCase(),
      });
    });

    return Array.from(employeeMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [allAttendanceData]);

  const selectedEmployeeOption = useMemo(
    () =>
      employeeOptions.find(
        (employee) => String(employee.id) === String(filters.employeeName),
      ) || null,
    [employeeOptions, filters.employeeName],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilter = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      employeeName: employeeId ? filters.employeeName : "",
      status: "",
      startDate: "",
      endDate: "",
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const handleExport = () => {
    try {
      const csvContent = convertToCSV(filteredAttendanceData);
      downloadCSV(csvContent, "attendance_records.csv");
    } catch (err) {
      setError(err.message || "Failed to export attendance data");
      console.error("Error exporting attendance data:", err);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return "";

    const headers = [
      "ID",
      "Employee ID",
      "Employee Name",
      "Date",
      "Clock In",
      "Clock Out",
      "Status",
      "Working Hours",
      "Total Break Duration",
    ];

    const headerString = headers.join(",");
    const rows = data.map((record) =>
      [
        record.id,
        `"${getEmployeeId(record)}"`,
        `"${getEmployeeName(record)}"`,
        `"${formatDate(record.date)}"`,
        `"${formatTime(record.clock_in)}"`,
        `"${formatTime(record.clock_out)}"`,
        `"${getStatusLabel(record.status)}"`,
        `"${formatHours(record.working_hours)}"`,
        `"${formatBreakDuration(record.total_break_duration)}"`,
      ].join(","),
    );

    return `${headerString}\n${rows.join("\n")}`;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openDatePicker = (inputRef) => {
    if (!inputRef?.current) return;

    inputRef.current.focus();

    if (typeof inputRef.current.showPicker === "function") {
      inputRef.current.showPicker();
    }
  };

  return (
    <div className="attendance-admin-container">
      <div className="attendance-admin-header">
        <h1>{isEmployeeView ? "Employee Attendance" : "Total Attendance"}</h1>
        <p className="attendance-admin-subtitle">
          {isEmployeeView
            ? "Review attendance records for the selected employee with date range and status filters."
            : "Review all employee attendance records with employee, date range, and status filters."}
        </p>
      </div>

      <div className="attendance-records-tab">
        <div className="attendance-controls">
          <div className="filter-section">
            <div className="attendance-filter-row attendance-filter-row-primary">
              {!isEmployeeView ? (
                <button
                  type="button"
                  className={`attendance-employee-picker ${
                    selectedEmployeeOption ? "has-value" : ""
                  }`}
                  onClick={() => setIsEmployeeFilterOpen(true)}
                >
                  <span className="attendance-employee-picker-label">
                    {selectedEmployeeOption
                      ? selectedEmployeeOption.name
                      : "Filter by employee name"}
                  </span>
                </button>
              ) : (
                <div className="employee-specific-notice">
                  <p>
                    Showing attendance records for employee ID: {employeeId}
                  </p>
                </div>
              )}

              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    status: event.target.value,
                  }))
                }
                className="filter-select"
              >
                <option value="">All Statuses</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="attendance-filter-row attendance-filter-row-secondary">
              <div className="attendance-date-field">
                <input
                  ref={startDateRef}
                  type="date"
                  value={filters.startDate}
                  onChange={(event) =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      startDate: event.target.value,
                    }))
                  }
                  className="date-input attendance-date-input"
                />
                <button
                  type="button"
                  className="attendance-date-icon-btn"
                  aria-label="Open start date calendar"
                  onClick={() => openDatePicker(startDateRef)}
                >
                  <img src={calendarIcon} alt="" aria-hidden="true" />
                </button>
              </div>

              <div className="attendance-date-field">
                <input
                  ref={endDateRef}
                  type="date"
                  value={filters.endDate}
                  onChange={(event) =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      endDate: event.target.value,
                    }))
                  }
                  className="date-input attendance-date-input"
                />
                <button
                  type="button"
                  className="attendance-date-icon-btn"
                  aria-label="Open end date calendar"
                  onClick={() => openDatePicker(endDateRef)}
                >
                  <img src={calendarIcon} alt="" aria-hidden="true" />
                </button>
              </div>

              <div className="attendance-filter-actions">
                <button onClick={handleFilter} className="filter-button">
                  Apply Filters
                </button>
                <button onClick={handleClearFilters} className="clear-button">
                  Clear
                </button>
                <button onClick={handleExport} className="export-button">
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="attendance-results-summary">
            Showing {filteredAttendanceData.length} record
            {filteredAttendanceData.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <p>Loading attendance records...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                    <th>Working Hours</th>
                    <th>Break Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAttendanceData.length > 0 ? (
                    paginatedAttendanceData.map((record) => (
                      <tr key={record.id}>
                        <td>{record.id}</td>
                        <td>{getEmployeeName(record)}</td>
                        <td>{getEmployeeId(record) || "N/A"}</td>
                        <td>{formatDate(record.date)}</td>
                        <td>{formatTime(record.clock_in)}</td>
                        <td>{formatTime(record.clock_out)}</td>
                        <td>
                          <span
                            className={`status-badge ${getStatusClassName(
                              record.status,
                            )}`}
                          >
                            {getStatusLabel(record.status)}
                          </span>
                        </td>
                        <td>{formatHours(record.working_hours)}</td>
                        <td>
                          {formatBreakDuration(record.total_break_duration)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="attendance-empty-state">
                        No attendance records matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="attendance-mobile-list">
              {paginatedAttendanceData.length > 0 ? (
                paginatedAttendanceData.map((record) => (
                  <article
                    key={`mobile-${record.id}`}
                    className="attendance-mobile-card"
                  >
                    <div className="attendance-mobile-card-header">
                      <div>
                        <p className="attendance-mobile-card-title">
                          {getEmployeeName(record)}
                        </p>
                        <p className="attendance-mobile-card-subtitle">
                          ID: {getEmployeeId(record) || "N/A"}
                        </p>
                      </div>
                      <span
                        className={`status-badge ${getStatusClassName(
                          record.status,
                        )}`}
                      >
                        {getStatusLabel(record.status)}
                      </span>
                    </div>

                    <div className="attendance-mobile-grid">
                      <div className="attendance-mobile-item">
                        <span>Date</span>
                        <strong>{formatDate(record.date)}</strong>
                      </div>
                      <div className="attendance-mobile-item">
                        <span>Clock In</span>
                        <strong>{formatTime(record.clock_in)}</strong>
                      </div>
                      <div className="attendance-mobile-item">
                        <span>Clock Out</span>
                        <strong>{formatTime(record.clock_out)}</strong>
                      </div>
                      <div className="attendance-mobile-item">
                        <span>Working Hours</span>
                        <strong>{formatHours(record.working_hours)}</strong>
                      </div>
                      <div className="attendance-mobile-item attendance-mobile-item-full">
                        <span>Break Duration</span>
                        <strong>
                          {formatBreakDuration(record.total_break_duration)}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="attendance-mobile-empty">
                  No attendance records matched the selected filters.
                </div>
              )}
            </div>

            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>

              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <EmployeeFilterModal
        open={isEmployeeFilterOpen}
        onClose={() => setIsEmployeeFilterOpen(false)}
        employees={employeeOptions}
        value={filters.employeeName}
        onConfirm={(selectedId) =>
          setFilters((currentFilters) => ({
            ...currentFilters,
            employeeName: selectedId,
          }))
        }
      />
    </div>
  );
}
