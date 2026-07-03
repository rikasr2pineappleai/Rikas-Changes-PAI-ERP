import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchAllAttendanceRecords,
  fetchEmployeeAttendanceRecords,
} from "../integration/attendanceAPI";
import employeeAPI from "../integration/employeeAPI";
import { getEmployeeImageUrl } from "../utils/imageUtils";
import defaultProfile from "../assets/images/default_profile.png";
import totalEmployeesIcon from "../assets/icons/attendance-total-employees.png";
import presentIcon from "../assets/icons/attendance-present.png";
import attendanceActionViewIcon from "../assets/icons/attendance-action-view.png";
import detailDateIcon from "../assets/icons/attendance-detail-date.png";
import detailCheckinIcon from "../assets/icons/attendance-detail-checkin.png";
import detailCheckoutIcon from "../assets/icons/attendance-detail-checkout.png";
import detailWorktypeIcon from "../assets/icons/attendance-detail-worktype.png";
import detailHoursIcon from "../assets/icons/attendance-detail-hours.png";
import detailStatusIcon from "../assets/icons/attendance-detail-status.png";
import attendanceBackIcon from "../assets/icons/attendance-back-vector.png";
import "../styles/AttendanceAdmin.css";

const PAGE_SIZE = 7;

// Fixed option lists requested by user
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "on_time", label: "On Time" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "emergency_leave", label: "Emergency Leave" },
  { value: "hour_permission", label: "Hour Permission" },
  { value: "other", label: "Other" },
];

const DEPARTMENT_OPTIONS = [
  { value: "", label: "All Departments" },
  { value: "QA Department", label: "QA Department" },
  { value: "Designing Department", label: "Designing Department" },
  { value: "Developing Department", label: "Developing Department" },
  {
    value: "Cyber Security & Network Department",
    label: "Cyber Security & Network Department",
  },
  { value: "BA & PM Department", label: "BA & PM Department" },
  { value: "Other", label: "Other" },
];

const KNOWN_DEPARTMENTS = DEPARTMENT_OPTIONS.filter(
  (option) => option.value && option.value !== "Other",
).map((option) => option.value);

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

  if (normalizedStatus === "late") return "late";

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

  if (normalizedStatus === "on_time") return "On Time";
  if (normalizedStatus === "late") return "Late";
  if (normalizedStatus === "early_arrival") return "On Time";
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
  if (normalizedStatus === "early_arrival") return "on-time";
  if (normalizedStatus === "absent") return "absent";
  if (normalizedStatus === "leave") return "absent";

  return "default";
};

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

const normalizeLookupValue = (value) => String(value || "").trim().toLowerCase();

const getEmployeeObjectName = (employee) =>
  `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
  employee?.name ||
  "";

const getEmployeeDepartmentName = (employee) =>
  employee?.Department?.dept_name ||
  employee?.Department?.name ||
  employee?.department?.dept_name ||
  employee?.department?.name ||
  employee?.department_name ||
  employee?.department ||
  "";

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

const getRecordUserId = (record) =>
  String(record?.user_id || record?.User?.id || record?.User?.user_id || "");

const getRecordEmployeeCode = (record) =>
  String(record?.User?.emp_id || record?.emp_id || record?.employee_id || "");

const getDepartmentName = (
  record,
  employeeDepartmentsById = {},
  employee = {},
) => {
  const user = record?.User || {};
  const userId = getRecordUserId(record);
  const employeeCode = getRecordEmployeeCode(record);

  return (
    getEmployeeDepartmentName(employee) ||
    employeeDepartmentsById[`id:${userId}`] ||
    employeeDepartmentsById[`emp:${employeeCode}`] ||
    employeeDepartmentsById[
      `name:${normalizeLookupValue(getEmployeeName(record))}`
    ] ||
    user?.Department?.dept_name ||
    user?.Department?.name ||
    user?.department?.name ||
    user?.department?.dept_name ||
    user?.department_name ||
    record?.department ||
    "General"
  );
};

const getWorkType = (record) => {
  const method = normalizeStatus(record?.method);
  if (method === "mobile" || method === "remote") return "Remote";
  return "Office";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
};

const formatTime = (timeString) => {
  if (!timeString) return "N/A";

  return new Date(timeString)
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(" ", " ");
};

const matchesDateRange = (recordDate, startDate, endDate) => {
  if (!recordDate) return false;

  const date = new Date(recordDate);
  if (Number.isNaN(date.getTime())) return false;

  const normalizedDate = date.toISOString().split("T")[0];
  if (startDate && normalizedDate < startDate) return false;
  if (endDate && normalizedDate > endDate) return false;

  return true;
};

const isToday = (recordDate) => {
  if (!recordDate) return false;

  const date = new Date(recordDate);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

function StatIcon({ type }) {
  if (type === "total") {
    return <img src={totalEmployeesIcon} alt="" aria-hidden="true" />;
  }

  if (type === "present") {
    return <img src={presentIcon} alt="" aria-hidden="true" />;
  }

  if (type === "late") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (type === "absent") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 18v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
        <circle cx="10" cy="7" r="3" />
        <path d="m18 8 4 4" />
        <path d="m22 8-4 4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 19v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}

function StatCard({ tone, icon, title, value, percent }) {
  return (
    <article className={`attendance-stat-card attendance-stat-${tone}`}>
      <div className="attendance-stat-icon">
        <StatIcon type={icon} />
      </div>
      <div className="attendance-stat-copy">
        <p>{title}</p>
        <strong>{value}</strong>
        {percent !== null && <span>{percent}%</span>}
      </div>
    </article>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V3" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 15v4h14v-4" />
    </svg>
  );
}

function DetailIcon({ type }) {
  const icons = {
    date: detailDateIcon,
    checkin: detailCheckinIcon,
    checkout: detailCheckoutIcon,
    work: detailWorktypeIcon,
    hours: detailHoursIcon,
    status: detailStatusIcon,
  };

  return <img src={icons[type] || detailStatusIcon} alt="" aria-hidden="true" />;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export default function AttendanceAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  const isEmployeeView = Boolean(employeeId);
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [employeeDepartmentsById, setEmployeeDepartmentsById] = useState({});
  const [employeesById, setEmployeesById] = useState({});
  const [totalEmployeesCount, setTotalEmployeesCount] = useState(0);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    employeeName: "",
    status: "",
    department: "",
    startDate: "",
    endDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    employeeName: "",
    status: "",
    department: "",
    startDate: "",
    endDate: "",
  });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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

        const firstEmployeePage = await employeeAPI.getAllEmployees(1, 500);
        const firstEmployees = firstEmployeePage?.data?.employees || [];
        const employeePages = firstEmployeePage?.data?.pagination?.pages || 1;
        let employees = firstEmployees;

        if (employeePages > 1) {
          const remainingEmployeePages = await Promise.all(
            Array.from({ length: employeePages - 1 }, (_, index) =>
              employeeAPI.getAllEmployees(index + 2, 500),
            ),
          );

          employees = [
            ...firstEmployees,
            ...remainingEmployeePages.flatMap(
              (response) => response?.data?.employees || [],
            ),
          ];
        }

        const departmentLookup = {};
        const employeeLookup = {};
        const nameCounts = employees.reduce((counts, employee) => {
          const nameKey = normalizeLookupValue(getEmployeeObjectName(employee));
          if (nameKey) {
            counts[nameKey] = (counts[nameKey] || 0) + 1;
          }
          return counts;
        }, {});

        employees.forEach((employee) => {
          const departmentName = getEmployeeDepartmentName(employee);
          const employeeIds = [employee.id, employee.user_id].filter(
            (value) => value !== null && value !== undefined && value !== "",
          );
          const employeeCodes = [employee.emp_id, employee.employee_id].filter(
            Boolean,
          );
          const nameKey = normalizeLookupValue(getEmployeeObjectName(employee));

          employeeIds.forEach((id) => {
            employeeLookup[`id:${id}`] = employee;
            if (departmentName) {
              departmentLookup[`id:${id}`] = departmentName;
            }
          });

          employeeCodes.forEach((code) => {
            employeeLookup[`emp:${code}`] = employee;
            if (departmentName) {
              departmentLookup[`emp:${code}`] = departmentName;
            }
          });

          if (nameKey && nameCounts[nameKey] === 1) {
            employeeLookup[`name:${nameKey}`] = employee;
            if (departmentName) {
              departmentLookup[`name:${nameKey}`] = departmentName;
            }
          }
        });

        setAllAttendanceData(records);
        setEmployeeDepartmentsById(departmentLookup);
        setEmployeesById(employeeLookup);
        setTotalEmployeesCount(employees.length);
      } catch (err) {
        setError(err.message || "Failed to load attendance data");
        console.error("Error fetching attendance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [employeeId]);

  const todaysAttendanceData = useMemo(
    () => allAttendanceData.filter((record) => isToday(record.date)),
    [allAttendanceData],
  );

  const filteredAttendanceData = useMemo(() => {
    return todaysAttendanceData.filter((record) => {
      const employeeQuery = appliedFilters.employeeName.trim().toLowerCase();
      const employeeName = getEmployeeName(record).toLowerCase();
      const employeeCode = getEmployeeId(record).toLowerCase();
      const normalizedStatus = getCanonicalStatus(record.status);
      const departmentName = getDepartmentName(record, employeeDepartmentsById);

      if (
        employeeQuery &&
        !employeeName.includes(employeeQuery) &&
        !employeeCode.includes(employeeQuery)
      ) {
        return false;
      }

      if (appliedFilters.status) {
        const selectedStatus = getCanonicalStatus(appliedFilters.status);
        const statusMatches =
          normalizedStatus === selectedStatus ||
          (selectedStatus === "on_time" && normalizedStatus === "early_arrival");

        if (!statusMatches) return false;
      }

      if (appliedFilters.department) {
        const departmentMatches =
          appliedFilters.department === "Other"
            ? !KNOWN_DEPARTMENTS.includes(departmentName)
            : departmentName === appliedFilters.department;

        if (!departmentMatches) return false;
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
  }, [todaysAttendanceData, appliedFilters, employeeDepartmentsById]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAttendanceData.length / PAGE_SIZE),
  );

  const paginatedAttendanceData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAttendanceData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredAttendanceData]);

  function CustomSelect({ value, options, onChange, placeholder, ariaLabel }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handleOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };

      document.addEventListener("mousedown", handleOutside);
      return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const selectedLabel =
      options.find((o) => String(o.value) === String(value))?.label ||
      placeholder ||
      "";

    return (
      <div className="custom-select" ref={ref}>
        <button
          type="button"
          className="custom-select-button"
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="custom-select-label">{selectedLabel}</span>
          <ChevronDownIcon />
        </button>

        {open && (
          <ul className="custom-select-menu" role="listbox">
            {options.map((opt) => (
              <li
                key={opt.value || "__all"}
                role="option"
                aria-selected={String(opt.value) === String(value)}
                className={`custom-select-item ${
                  String(opt.value) === String(value) ? "selected" : ""
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const attendanceStats = useMemo(() => {
    const present = todaysAttendanceData.filter((record) => {
      const status = getCanonicalStatus(record.status);
      return status === "on_time" || status === "early_arrival";
    }).length;
    const late = todaysAttendanceData.filter(
      (record) => getCanonicalStatus(record.status) === "late",
    ).length;
    const absent = Math.max(totalEmployeesCount - (present + late), 0);

    const toPercent = (value) =>
      totalEmployeesCount > 0 ? Math.round((value / totalEmployeesCount) * 100) : 0;

    return {
      total: totalEmployeesCount,
      present,
      late,
      absent,
      presentPercent: toPercent(present),
      latePercent: toPercent(late),
      absentPercent: toPercent(absent),
    };
  }, [todaysAttendanceData, totalEmployeesCount]);

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

  const handleDropdownFilterChange = (field, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  // Apply search-as-you-type for employeeName with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (appliedFilters.employeeName !== filters.employeeName) {
        setAppliedFilters((prev) => ({
          ...prev,
          employeeName: filters.employeeName,
        }));
        setCurrentPage(1);
      }
    }, 350);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.employeeName]);

  const handleClearFilters = () => {
    const emptyFilters = {
      employeeName: "",
      status: "",
      department: "",
      startDate: "",
      endDate: "",
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const getEmployeeLookup = (record) => {
    const userId = getRecordUserId(record);
    const employeeCode = getRecordEmployeeCode(record);
    const nameKey = normalizeLookupValue(getEmployeeName(record));
    return (
      employeesById[`id:${userId}`] ||
      employeesById[`emp:${employeeCode}`] ||
      employeesById[`name:${nameKey}`] ||
      {}
    );
  };

  const getModalEmployeeEmail = (record) => {
    const lookup = getEmployeeLookup(record);
    return record?.User?.email || record?.email || lookup.email || "N/A";
  };

  const getModalEmployeeId = (record) => {
    const lookup = getEmployeeLookup(record);
    return (
      record?.User?.emp_id ||
      record?.emp_id ||
      lookup.emp_id ||
      getEmployeeId(record) ||
      "N/A"
    );
  };

  const formatWorkingHours = (hours) => {
    const numericHours = Number(hours);
    if (!Number.isFinite(numericHours) || numericHours <= 0) return "N/A";

    const wholeHours = Math.floor(numericHours);
    const minutes = Math.round((numericHours - wholeHours) * 60);
    const hourText = String(wholeHours).padStart(2, "0");

    return minutes > 0
      ? `${hourText}:${String(minutes).padStart(2, "0")} hr`
      : `${hourText} hr`;
  };

  const getExportRows = (data) =>
    (data || []).map((record) => {
      const lookup = getEmployeeLookup(record);
      return {
        employeeId: getModalEmployeeId(record),
        employeeName: getEmployeeName(record),
        email: getModalEmployeeEmail(record),
        designation: record?.User?.designation || lookup.designation || "N/A",
        department: getDepartmentName(record, employeeDepartmentsById, lookup),
        date: formatDate(record.date),
        checkIn: formatTime(record.clock_in),
        checkOut: formatTime(record.clock_out),
        workType: getWorkType(record),
        totalWorkingHours: formatWorkingHours(record.working_hours),
        status: getStatusLabel(record.status),
      };
    });

  const exportColumns = [
    { key: "employeeId", label: "Employee ID" },
    { key: "employeeName", label: "Employee Name" },
    { key: "email", label: "Email" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "date", label: "Date" },
    { key: "checkIn", label: "Check In" },
    { key: "checkOut", label: "Check Out" },
    { key: "workType", label: "Work Type" },
    { key: "totalWorkingHours", label: "Total Working Hours" },
    { key: "status", label: "Status" },
  ];

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const createReportTableHtml = (rows) => `
    <table>
      <thead>
        <tr>
          ${exportColumns
            .map((column) => `<th>${escapeHtml(column.label)}</th>`)
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) => `
                    <tr>
                      ${exportColumns
                        .map(
                          (column) =>
                            `<td>${escapeHtml(row[column.key] || "N/A")}</td>`,
                        )
                        .join("")}
                    </tr>
                  `,
                )
                .join("")
            : `<tr><td colspan="${exportColumns.length}">No attendance records found.</td></tr>`
        }
      </tbody>
    </table>
  `;

  const createExcelReportHtml = (rows) => `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background: #00a73c; color: #ffffff; font-weight: 700; }
          th, td { border: 1px solid #b7b7b7; padding: 8px 10px; text-align: left; white-space: nowrap; }
          td { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        ${createReportTableHtml(rows)}
      </body>
    </html>
  `;

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
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

  const createAttendancePdfBlob = (rows) => {
    const pageWidth = 842;
    const pageHeight = 595;
    const margin = 24;
    const titleY = pageHeight - 34;
    const tableTopY = pageHeight - 66;
    const rowHeight = 22;
    const headerHeight = 24;
    const bottomY = 36;
    const usableRows = Math.max(
      1,
      Math.floor((tableTopY - headerHeight - bottomY) / rowHeight),
    );
    const columnWidths = [54, 78, 120, 76, 88, 54, 54, 54, 58, 78, 52];
    const bodyRows = rows.length ? rows : [{}];
    const pages = [];

    const pdfText = (value) =>
      String(value || "N/A")
        .replace(/[^\x20-\x7e]/g, " ")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .trim();

    const truncateText = (value, width, fontSize) => {
      const text = pdfText(value);
      const maxChars = Math.max(4, Math.floor(width / (fontSize * 0.48)));
      return text.length > maxChars
        ? `${text.slice(0, Math.max(1, maxChars - 3))}...`
        : text;
    };

    const drawText = (text, x, y, fontSize = 7, bold = false) =>
      `BT /${bold ? "F2" : "F1"} ${fontSize} Tf ${x.toFixed(2)} ${y.toFixed(
        2,
      )} Td (${truncateText(text, 1000, fontSize)}) Tj ET\n`;

    const drawCellText = (text, x, y, width, fontSize = 6.4, bold = false) =>
      `BT /${bold ? "F2" : "F1"} ${fontSize} Tf ${(x + 4).toFixed(
        2,
      )} ${(y + 8).toFixed(2)} Td (${truncateText(
        text,
        width - 8,
        fontSize,
      )}) Tj ET\n`;

    for (let start = 0; start < bodyRows.length; start += usableRows) {
      const pageRows = bodyRows.slice(start, start + usableRows);
      let stream = "";

      stream += "0.00 0.66 0.24 rg\n";
      stream += drawText("Attendance Report", margin, titleY, 16, true);
      stream += "0 0 0 RG\n";
      stream += drawText(
        `Generated records: ${rows.length}`,
        margin,
        titleY - 18,
        8,
      );

      let x = margin;
      let y = tableTopY - headerHeight;
      stream += "0.00 0.66 0.24 rg\n";
      stream += `${margin} ${y} ${columnWidths.reduce(
        (sum, width) => sum + width,
        0,
      )} ${headerHeight} re f\n`;
      stream += "1 1 1 rg\n";
      exportColumns.forEach((column, index) => {
        stream += drawCellText(
          column.label,
          x,
          y + 2,
          columnWidths[index],
          6.6,
          true,
        );
        x += columnWidths[index];
      });

      y -= rowHeight;
      pageRows.forEach((row, rowIndex) => {
        x = margin;
        stream += rowIndex % 2 === 0 ? "1 1 1 rg\n" : "0.96 0.96 0.96 rg\n";
        stream += `${margin} ${y} ${columnWidths.reduce(
          (sum, width) => sum + width,
          0,
        )} ${rowHeight} re f\n`;
        stream += "0.72 0.72 0.72 RG\n";
        stream += `${margin} ${y} ${columnWidths.reduce(
          (sum, width) => sum + width,
          0,
        )} ${rowHeight} re S\n`;
        stream += "0 0 0 rg\n";

        exportColumns.forEach((column, index) => {
          stream += drawCellText(
            row[column.key],
            x,
            y,
            columnWidths[index],
            6.2,
          );
          x += columnWidths[index];
        });
        y -= rowHeight;
      });

      pages.push(stream);
    }

    const encoder = new TextEncoder();
    const objects = [];
    const addObject = (content) => {
      objects.push(content);
      return objects.length;
    };

    const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = addObject("");
    const fontId = addObject(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    );
    const boldFontId = addObject(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    );
    const pageIds = [];

    pages.forEach((streamContent) => {
      const streamBytes = encoder.encode(streamContent);
      const contentId = addObject(
        `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}endstream`,
      );
      const pageId = addObject(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      );
      pageIds.push(pageId);
    });

    objects[pagesId - 1] =
      `<< /Type /Pages /Kids [${pageIds
        .map((id) => `${id} 0 R`)
        .join(" ")}] /Count ${pageIds.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((content, index) => {
      offsets.push(encoder.encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
    });

    const xrefOffset = encoder.encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${
      objects.length + 1
    } /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  };

  const handleExportXLS = () => {
    try {
      const rows = getExportRows(filteredAttendanceData);
      downloadBlob(
        createExcelReportHtml(rows),
        "attendance_records.xls",
        "application/vnd.ms-excel;charset=utf-8;",
      );
    } catch (err) {
      setError(err.message || "Failed to export attendance data");
      console.error("Error exporting attendance data:", err);
    }
  };

  const handleExportPDF = () => {
    try {
      const rows = getExportRows(filteredAttendanceData);
      const pdfBlob = createAttendancePdfBlob(rows);
      const link = document.createElement("a");
      const url = URL.createObjectURL(pdfBlob);

      link.href = url;
      link.download = "attendance_records.pdf";
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to export attendance data");
      console.error("Error exporting attendance data:", err);
    }
  };

  const showingStart =
    filteredAttendanceData.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(
    currentPage * PAGE_SIZE,
    filteredAttendanceData.length,
  );
  const visiblePages = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const startPage = Math.min(Math.max(currentPage - 1, 1), totalPages - 2);
    return Array.from({ length: 3 }, (_, index) => startPage + index);
  }, [currentPage, totalPages]);

  const shouldShowLastPage =
    totalPages > 4 && !visiblePages.includes(totalPages);
  const shouldShowEllipsis =
    shouldShowLastPage && visiblePages[visiblePages.length - 1] < totalPages - 1;

  return (
    <div className="attendance-view-page">
      <div className="attendance-page-heading">
        <button
          type="button"
          className="attendance-back-button"
          aria-label="Go back"
          onClick={() => navigate("/dashboard")}
        >
          <img src={attendanceBackIcon} alt="" aria-hidden="true" />
        </button>
        <div>
          <h1>{isEmployeeView ? "Employee Attendance" : "Attendance"}</h1>
          <div className="attendance-breadcrumb">
            <span>Dashboard</span>
            <span className="attendance-breadcrumb-separator">&gt;</span>
            <span>Attendance</span>
          </div>
        </div>
      </div>

      <section
        className="attendance-stats-grid"
        aria-label="Attendance summary"
      >
        <StatCard
          tone="total"
          icon="total"
          title="Total Employees"
          value={attendanceStats.total}
          percent={null}
        />
        <StatCard
          tone="present"
          icon="present"
          title="Present"
          value={attendanceStats.present}
          percent={attendanceStats.presentPercent}
        />
        <StatCard
          tone="late"
          icon="late"
          title="Late"
          value={attendanceStats.late}
          percent={attendanceStats.latePercent}
        />
        <StatCard
          tone="absent"
          icon="absent"
          title="Absent"
          value={attendanceStats.absent}
          percent={attendanceStats.absentPercent}
        />
      </section>

      <section
        className="attendance-filter-panel"
        aria-label="Attendance filters"
      >
        <div className="attendance-filter-top">
          <label className="attendance-select-field">
            <CustomSelect
              ariaLabel="Filter by status"
              value={filters.status}
              placeholder="All Status"
              options={STATUS_OPTIONS}
              onChange={(val) => handleDropdownFilterChange("status", val)}
            />
          </label>

          <label className="attendance-select-field">
            <CustomSelect
              ariaLabel="Filter by department"
              value={filters.department}
              placeholder="All Departments"
              options={DEPARTMENT_OPTIONS}
              onChange={(val) => handleDropdownFilterChange("department", val)}
            />
          </label>

          <div className="attendance-filter-buttons">
            <button
              type="button"
              className="attendance-clear-button"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>

            <div
              className={`attendance-export-dropdown ${
                isExportOpen ? "open" : ""
              }`}
              ref={exportDropdownRef}
            >
              <button
                type="button"
                className="attendance-export-button"
                aria-haspopup="true"
                aria-expanded={isExportOpen}
                onClick={() => setIsExportOpen((open) => !open)}
              >
                <UploadIcon />
                <span>Export</span>
                <ChevronDownIcon />
              </button>

              {isExportOpen && (
                <ul className="export-dropdown-menu">
                  <li
                    className="export-dropdown-item export-dropdown-item-primary"
                    role="menuitem"
                    onClick={() => {
                      handleExportPDF();
                      setIsExportOpen(false);
                    }}
                  >
                    .PDF
                  </li>
                  <li
                    className="export-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      handleExportXLS();
                      setIsExportOpen(false);
                    }}
                  >
                    .xls
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="attendance-filter-bottom">
          <label className="attendance-search-field">
            <input
              type="search"
              placeholder="Search Employee"
              value={filters.employeeName}
              onChange={(event) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  employeeName: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") handleFilter();
              }}
            />
            <SearchIcon />
          </label>
        </div>
      </section>

      <section className="attendance-list-card" aria-label="Attendance list">
        <h2>Attendance List</h2>

        {loading && (
          <div className="attendance-state-message">
            <p>Loading attendance records...</p>
          </div>
        )}

        {error && (
          <div className="attendance-state-message attendance-state-error">
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="attendance-list-table-wrap">
              <table className="attendance-list-table">
                <thead>
                  <tr>
                    <th>
                      Employee Name
                      <span
                        className="attendance-sort-icon"
                        aria-hidden="true"
                      />
                    </th>
                    <th>Designation</th>
                    <th>
                      Date
                      <span
                        className="attendance-sort-arrows"
                        aria-hidden="true"
                      />
                    </th>
                    <th>Check in Time</th>
                    <th>Work Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAttendanceData.length > 0 ? (
                    paginatedAttendanceData.map((record) => {
                      const user = record?.User || {};

                      return (
                        <tr key={record.id}>
                          <td data-label="Employee Name">
                            <div className="attendance-employee-cell">
                              <img
                                src={getEmployeeImageUrl(user, defaultProfile)}
                                alt=""
                                aria-hidden="true"
                              />
                              <span>{getEmployeeName(record)}</span>
                            </div>
                          </td>
                          <td data-label="Designation">
                            {user.designation || "N/A"}
                          </td>
                          <td data-label="Date">{formatDate(record.date)}</td>
                          <td data-label="Check in Time">
                            {formatTime(record.clock_in)}
                          </td>
                          <td data-label="Work Type">{getWorkType(record)}</td>
                          <td data-label="Status">
                            <span
                              className={`attendance-status-pill ${getStatusClassName(
                                record.status,
                              )}`}
                            >
                              {getStatusLabel(record.status)}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <button
                              type="button"
                              className="attendance-action-button"
                              aria-label={`View attendance for ${getEmployeeName(
                                record,
                              )}`}
                              onClick={() => setSelectedAttendanceRecord(record)}
                            >
                              <img
                                src={attendanceActionViewIcon}
                                alt=""
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="attendance-empty-state">
                        No attendance records matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="attendance-list-footer">
              <p>
                Showing {showingStart} to {showingEnd} of{" "}
                {filteredAttendanceData.length} entries
              </p>
              <nav
                className="attendance-pagination"
                aria-label="Attendance pagination"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <BackIcon />
                </button>

                {visiblePages.map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={pageNumber === currentPage ? "active" : ""}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}

                {shouldShowEllipsis && <span>...</span>}
                {shouldShowLastPage && (
                  <button
                    type="button"
                    className={totalPages === currentPage ? "active" : ""}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  type="button"
                  className="attendance-next-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <BackIcon />
                </button>
              </nav>
            </div>
          </>
        )}
      </section>

      {selectedAttendanceRecord &&
        (() => {
          const record = selectedAttendanceRecord;
          const user = record?.User || {};
          const lookup = getEmployeeLookup(record);
          const employeeImage = getEmployeeImageUrl(
            user?.id ? user : lookup,
            defaultProfile,
          );
          const employeeName = getEmployeeName(record);
          const designation = user.designation || lookup.designation || "N/A";
          const departmentName = getDepartmentName(
            record,
            employeeDepartmentsById,
            lookup,
          );
          const statusLabel = getStatusLabel(record.status);
          const statusClass = getStatusClassName(record.status);

          return (
            <div
              className="attendance-details-overlay"
              role="presentation"
              onMouseDown={() => setSelectedAttendanceRecord(null)}
            >
              <div
                className="attendance-details-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="attendance-details-title"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <h2 id="attendance-details-title">Attendance Details</h2>

                <div className="attendance-details-content">
                  <aside className="attendance-details-profile">
                    <img src={employeeImage} alt="" aria-hidden="true" />
                    <h3>{employeeName}</h3>
                    <p>{designation}</p>
                    <a href={`mailto:${getModalEmployeeEmail(record)}`}>
                      {getModalEmployeeEmail(record)}
                    </a>

                    <div className="attendance-details-profile-meta">
                      <div>
                        <span>Employee ID</span>
                        <strong>{getModalEmployeeId(record)}</strong>
                      </div>
                      <div>
                        <span>Department</span>
                        <strong>{departmentName}</strong>
                      </div>
                    </div>
                  </aside>

                  <div className="attendance-details-info">
                    <div className="attendance-details-grid">
                      <div className="attendance-details-item">
                        <span className="attendance-detail-icon detail-date">
                          <DetailIcon type="date" />
                        </span>
                        <div>
                          <p>Date</p>
                          <strong>{formatDate(record.date)}</strong>
                        </div>
                      </div>

                      <div className="attendance-details-item">
                        <span className="attendance-detail-icon detail-checkin">
                          <DetailIcon type="checkin" />
                        </span>
                        <div>
                          <p>Check in</p>
                          <strong>{formatTime(record.clock_in)}</strong>
                        </div>
                      </div>

                      <div className="attendance-details-item">
                        <span className="attendance-detail-icon detail-checkout">
                          <DetailIcon type="checkout" />
                        </span>
                        <div>
                          <p>Check Out</p>
                          <strong>{formatTime(record.clock_out)}</strong>
                        </div>
                      </div>

                      <div className="attendance-details-item">
                        <span className="attendance-detail-icon detail-work">
                          <DetailIcon type="work" />
                        </span>
                        <div>
                          <p>Work Type</p>
                          <strong>{getWorkType(record)}</strong>
                        </div>
                      </div>

                      <div className="attendance-details-item">
                        <span className="attendance-detail-icon detail-hours">
                          <DetailIcon type="hours" />
                        </span>
                        <div>
                          <p>Total Working Hours</p>
                          <strong>{formatWorkingHours(record.working_hours)}</strong>
                        </div>
                      </div>

                      <div className="attendance-details-item">
                        <span className="attendance-detail-icon detail-status">
                          <DetailIcon type="status" />
                        </span>
                        <div>
                          <p>Status</p>
                          <strong
                            className={`attendance-detail-status ${statusClass}`}
                          >
                            {statusLabel}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="attendance-details-close"
                      onClick={() => setSelectedAttendanceRecord(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
