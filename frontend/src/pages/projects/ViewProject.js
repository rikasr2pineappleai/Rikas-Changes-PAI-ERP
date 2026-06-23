// Import React and required hooks
// React is used to build the component.
// useState is used to store values.
// useEffect is used to run code when page loads or updates.
// useMemo is used to calculate values efficiently.
// useRef is used to directly access input elements.
import React, { useMemo, useState, useEffect, useRef } from "react";

// Import router hooks
// useNavigate is used to move between pages.
// useParams is used to get values from the URL.
import { useNavigate, useParams } from "react-router-dom";

// Import CSS file
// This CSS file contains all styles for this page.
import "./Projects.css";

// Import icons
// Search icon for search input
import searchIcon from "../../assets/icons/searchicon.png";

// Close icon for modal close buttons
import closeIcon from "../../assets/icons/closeicon.png";

// Filter icon for filter button
import filterIconPng from "../../assets/icons/filterricon.png";

// Edit icon for edit task button
import editBlueIcon from "../../assets/icons/editblueicon.png";

// Calendar icon for date fields
import calendarIcon from "../../assets/icons/calender.png";

// Back icon for back button
import backGreenIcon from "../../assets/icons/BackBtn.png";

// Icon for creating a new task
import newTaskBtn from "../../assets/icons/NewTaskIcon.png";

// Dropdown icon for selection fields
import dropDownIcon from "../../assets/icons/DropDownIcon.png";

// Icon for assignee selection
import addPersonIcon from "../../assets/icons/AddPersonIcon.png";

// Import modal components
// Delete confirmation popup
import DeleteConfirmModal from "../../modals/DeleteConfirmModal";

// Toast popup for success / error messages
import ToastModal from "../../modals/ToastModal";

// Import project API functions
// fetchProjectById -> get one project details
// replaceProjectAllocations -> update project members
import {
  fetchProjectById,
  replaceProjectAllocations,
} from "../../integration/projectAPI";

// Import employee API functions
// Used to load employee list
import employeeAPI from "../../integration/employeeAPI";

// Import task API functions
// fetchTasksByProject - get tasks of a project
// createTaskAPI - create new task
// updateTaskAPI - update task
// deleteTaskAPI - delete task
import {
  fetchTasksByProject,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  deleteTask as deleteTaskAPI,
} from "../../integration/taskAPI";

// Trash icon component
// This small component shows a trash icon.
// It is used inside the delete button of each task row.
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 6h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4h8v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6l1 16h10l1-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Reusable modal component
// This common modal is used for both:
// 1. New Task popup
// 2. Update Task popup
function Modal({ title, open, onClose, children }) {
  // If modal is not open, show nothing
  if (!open) return null;

  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      {/* Stop modal from closing when clicking inside modal box */}
      <div className="prj-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="prj-modalHeader">
          <div className="prj-modalTitle">{title}</div>

          {/* Close button */}
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            <img src={closeIcon} alt="close" />
          </button>
        </div>

        {/* Modal content area */}
        <div className="prj-modalBody">{children}</div>
      </div>
    </div>
  );
}

// Badge component
// This component shows a small label badge.
// It is used for task priority and task progress.
function Badge({ variant, children }) {
  return <span className={`prj-badge ${variant}`}>{children}</span>;
}

function TaskFilterDropdown({
  open,
  onClose,
  filters,
  onFiltersChange,
  people,
  statusOptions,
  priorityOptions,
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (event.target.closest(".prj-filterWrap")) return;

      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, onClose]);

  if (!open) return null;

  const toggleFilter = (key, value) => {
    onFiltersChange((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "" : value,
    }));
  };

  const clearFilters = () => {
    onFiltersChange({ status: "", priority: "", assignedTo: "" });
  };

  return (
    <div
      ref={dropdownRef}
      className="prj-filterDropdown"
      role="dialog"
      aria-label="Filter tasks"
    >
      <div className="prj-filterDropdownSection">
        <p className="prj-filterDropdownTitle">Status</p>
        {statusOptions.map((option) => {
          const active = filters.status === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={`prj-filterDropdownRow ${active ? "active" : ""}`}
              onClick={() => toggleFilter("status", option.value)}
            >
              <span
                className={`prj-filterDropdownCheck ${active ? "active" : ""}`}
                aria-hidden="true"
              />
              <span className="prj-filterDropdownText">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="prj-filterDropdownSection">
        <p className="prj-filterDropdownTitle">Priority</p>
        {priorityOptions.map((option) => {
          const active = filters.priority === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={`prj-filterDropdownRow ${active ? "active" : ""}`}
              onClick={() => toggleFilter("priority", option.value)}
            >
              <span
                className={`prj-filterDropdownCheck ${active ? "active" : ""}`}
                aria-hidden="true"
              />
              <span className="prj-filterDropdownText">{option.label}</span>
            </button>
          );
        })}
      </div>

      {!!people?.length && (
        <div className="prj-filterDropdownSection">
          <p className="prj-filterDropdownTitle">Assigned To</p>
          {people.map((person) => {
            const active = String(filters.assignedTo) === String(person.id);

            return (
              <button
                key={person.id}
                type="button"
                className={`prj-filterDropdownRow ${active ? "active" : ""}`}
                onClick={() => toggleFilter("assignedTo", String(person.id))}
              >
                <span
                  className={`prj-filterDropdownCheck ${active ? "active" : ""}`}
                  aria-hidden="true"
                />
                <span className="prj-filterDropdownText">{person.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="prj-filterDropdownClear"
        onClick={clearFilters}
      >
        Clear all
      </button>
    </div>
  );
}

// Format a "YYYY-MM-DD" (or any Date-parseable) string as "DD MMM YYYY", e.g. "21 Jan 2026"
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatDisplayDate = (value) => {
  if (!value || value === "—") return "—";
  // Prefer manual parse of YYYY-MM-DD to avoid timezone shifts
  const ymdMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    if (m >= 1 && m <= 12) {
      return `${String(d).padStart(2, "0")} ${MONTH_SHORT[m - 1]} ${y}`;
    }
  }
  const dt = new Date(value);
  if (isNaN(dt.getTime())) return value;
  return `${String(dt.getDate()).padStart(2, "0")} ${MONTH_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
};

// Convert API task data into UI-friendly format
// This function changes backend task data into a structure
// that is easier to use in the frontend UI.
const mapTaskFromApi = (t) => ({
  id: t.id,
  name: t.title || "Task",
  description: t.description || "",
  assignedTo: t.assigned_to ?? "",
  priority: t.priority || "medium",
  progress: (t.status || "to_do").toLowerCase(),
  startDate: t.assigned_at ? String(t.assigned_at).slice(0, 10) : "—",
  dueDate: t.deadline ? String(t.deadline).slice(0, 10) : "—",

  // Hidden helper values used for sorting tasks
  _sortTime: t.assigned_at ? new Date(t.assigned_at).getTime() : 0,
  _sortId: t.id || 0,

  // This will be assigned later after sorting
  taskNo: 0,
});

// Status label mapper - converts backend status keys to display labels
const STATUS_LABELS = {
  // Standard keys
  to_do: "To Do",
  in_progress: "In Progress",
  testing: "In Review",
  blocked: "CTO Review",
  done: "Completed",
  // Actual backend values observed in API
  review: "In Review",
  cto_review: "CTO Review",
  completed: "Completed",
  pending: "To Do",
  inprogress: "In Progress",
  in_review: "In Review",
};

// Helper: get badge CSS variant from progress value
const getProgressVariant = (progress) => {
  if (!progress) return "notstarted";
  const p = progress.toLowerCase();
  if (p === "done" || p === "completed") return "done";
  if (p === "in_progress" || p === "inprogress") return "progress";
  if (p === "testing" || p === "review" || p === "in_review") return "testing";
  if (p === "blocked" || p === "cto_review") return "blocked";
  return "notstarted";
};

const normalizeTaskStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (value === "testing" || value === "in_review") return "review";
  if (value === "blocked") return "cto_review";
  if (value === "completed") return "done";
  if (value === "pending") return "to_do";
  if (value === "inprogress") return "in_progress";
  return value;
};

// Assignee picker modal
// This modal lets user choose one employee as task assignee.
function AssigneePickerModal({ open, onClose, people, value, onConfirm }) {
  // Search text entered by user
  const [q, setQ] = useState("");

  // Temporary selected employee id
  const [temp, setTemp] = useState(value ? String(value) : "");

  // Reset search and selected value whenever modal opens
  useEffect(() => {
    if (open) {
      setQ("");
      setTemp(value ? String(value) : "");
    }
  }, [open, value]);

  // Filter people list using search text
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return people;

    return (people || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const role = (p.role || "").toLowerCase();
      return name.includes(query) || role.includes(query);
    });
  }, [q, people]);

  // If modal is closed, render nothing
  if (!open) return null;

  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div
        className="prj-assigneeModal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="prj-modalHeader">
          <div className="prj-modalTitle">Assignee</div>

          {/* Close button */}
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            <img src={closeIcon} alt="close" />
          </button>
        </div>

        <div className="prj-modalBody">
          {/* Search input */}
          <div className="prj-assigneeSearch">
            <span className="prj-assigneeSearchIcon" aria-hidden="true">
              🔍
            </span>
            <input
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* List of employees */}
          <div className="prj-assigneeList">
            {(filtered || []).map((p) => {
              const active = String(p.id) === String(temp);

              return (
                <div
                  key={p.id}
                  className={`prj-assigneeRow ${active ? "active" : ""}`}
                  onClick={() => setTemp(String(p.id))}
                  role="button"
                  tabIndex={0}
                >
                  {/* Custom checkbox */}
                  <div className={`prj-cb ${active ? "checked" : ""}`} />

                  {/* Avatar: profile photo or initial fallback */}
                  {p.profile_pic ? (
                    <img
                      className="prj-assigneeAvatar"
                      src={p.profile_pic}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="prj-assigneeAvatar"
                    aria-hidden="true"
                    style={{
                      display: p.profile_pic ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#d7f5de",
                      color: "#2f7d3e",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {p.name ? p.name.charAt(0).toUpperCase() : "?"}
                  </div>

                  {/* Employee name and role */}
                  <div className="prj-assigneeText">
                    <div className="prj-assigneeName">{p.name}</div>
                    <div className="prj-assigneeRole">
                      {p.role || "Employee"}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show message if no employee found */}
            {!filtered?.length && (
              <div className="prj-empty" style={{ padding: 14 }}>
                No employees found.
              </div>
            )}
          </div>

          {/* Confirm selected employee */}
          <button
            className="prj-primaryBtn prj-primaryBtnFull"
            type="button"
            onClick={() => {
              if (!temp) return;
              onConfirm(temp);
              onClose();
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Project members modal
// This modal is used to select multiple employees
// and add them as project members.
function ProjectMembersModal({
  open,
  onClose,
  people,
  selectedIds = [],
  onConfirm,
}) {
  // Search text
  const [q, setQ] = useState("");

  // Temporary selected member ids
  const [temp, setTemp] = useState([]);

  // Show more / show less toggle for the members list
  const [showAll, setShowAll] = useState(false);
  const INITIAL_VISIBLE = 7;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setQ("");
      setTemp((selectedIds || []).map(String));
      setShowAll(false);
    }
  }, [open, selectedIds]);

  // Filter employee list by search
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return people || [];

    return (people || []).filter(
      (p) =>
        (p.name || "").toLowerCase().includes(s) ||
        (p.role || "").toLowerCase().includes(s),
    );
  }, [q, people]);

  // If modal is closed, render nothing
  if (!open) return null;

  // Toggle member selection
  const toggle = (id) => {
    setTemp((prev) => {
      const sid = String(id);

      // Remove if already selected
      if (prev.includes(sid)) return prev.filter((x) => x !== sid);

      // Add if not selected
      return [...prev, sid];
    });
  };

  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div className="prj-memberModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="prj-memberHeader">
          <div className="prj-memberTitle">Add Members</div>

          {/* Close button */}
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="prj-memberBody">
          {/* Search input */}
          <div className="prj-memberSearch">
            <span className="prj-memberSearchIcon" aria-hidden="true">
              <img src={searchIcon} alt="" />
            </span>
            <input
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Members list */}
          <div className={`prj-memberList ${showAll ? "expanded" : ""}`}>
            {(showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE)).map((p) => {
              const active = temp.includes(String(p.id));

              return (
                <div
                  key={p.id}
                  className={`prj-memberRow ${active ? "active" : ""}`}
                  onClick={() => toggle(p.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`prj-cb ${active ? "checked" : ""}`} />

                  {/* Avatar: profile photo or initial fallback */}
                  {p.profile_pic ? (
                    <img
                      className="prj-assigneeAvatar"
                      src={p.profile_pic}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="prj-assigneeAvatar"
                    aria-hidden="true"
                    style={{
                      display: p.profile_pic ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#d7f5de",
                      color: "#2f7d3e",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {p.name ? p.name.charAt(0).toUpperCase() : "?"}
                  </div>

                  <div className="prj-memberInfo">
                    <div className="prj-memberName">{p.name}</div>
                    <div className="prj-memberRole">{p.role || "Employee"}</div>
                  </div>
                </div>
              );
            })}

            {/* Empty message */}
            {!filtered.length && (
              <div className="prj-memberEmpty">No members found.</div>
            )}
          </div>

          {/* Show more / Show less toggle */}
          {filtered.length > INITIAL_VISIBLE && (
            <div className="prj-memberShowMoreRow">
              <button
                type="button"
                className="prj-memberShowMore"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Show less" : "Show more"}
              </button>
            </div>
          )}

          {/* Confirm selected members */}
          <button
            type="button"
            className="prj-primaryBtn prj-primaryBtnFull"
            onClick={() => {
              onConfirm(temp.map(Number));
              onClose();
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Option picker modal
// This reusable modal is used for selecting:
// 1. Priority
// 2. Status
function OptionPickerModal({
  open,
  onClose,
  title,
  options = [],
  value,
  onConfirm,
}) {
  // Temporary selected option
  const [temp, setTemp] = useState(value ? String(value) : "");

  // Reset selected option when modal opens
  useEffect(() => {
    if (open) setTemp(value ? String(value) : "");
  }, [open, value]);

  // If modal is closed, render nothing
  if (!open) return null;

  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div className="prj-optionModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="prj-modalHeader">
          <div className="prj-modalTitle">{title}</div>

          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            <img src={closeIcon} alt="close" />
          </button>
        </div>

        <div className="prj-modalBody">
          {/* Option list */}
          <div className="prj-optionList">
            {options.map((opt) => {
              const active = String(opt.value) === String(temp);

              return (
                <div
                  key={opt.value}
                  className={`prj-optionRow ${active ? "active" : ""}`}
                  onClick={() => setTemp(String(opt.value))}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`prj-cb ${active ? "checked" : ""}`} />
                  <div className="prj-optionText">
                    <div className="prj-optionLabel">{opt.label}</div>
                    {opt.subLabel ? (
                      <div className="prj-optionSub">{opt.subLabel}</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm option */}
          <button
            className="prj-primaryBtn prj-primaryBtnFull"
            type="button"
            onClick={() => {
              if (!temp) return;
              onConfirm(temp);
              onClose();
            }}
            disabled={!temp}
            style={{
              opacity: !temp ? 0.6 : 1,
              cursor: !temp ? "not-allowed" : "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Main ViewProject component
// This page shows:
// 1. Project details
// 2. Project tasks
// 3. Project members
// 4. Create / update / delete tasks
export default function ViewProject() {
  // Get project id from URL
  const { projectId } = useParams();

  // Hook used to go back or navigate to other pages
  const navigate = useNavigate();

  // Project details state
  const [project, setProject] = useState(null);

  // Task list state
  const [tasks, setTasks] = useState([]);

  // Employee list state
  const [people, setPeople] = useState([]);

  // Project members state
  const [members, setMembers] = useState([]);

  // Controls member modal open/close
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  // Search input value
  const [search, setSearch] = useState("");

  // Task filter state
  const [taskFilterOpen, setTaskFilterOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    status: "",
    priority: "",
    assignedTo: "",
  });

  // Loading state
  const [loading, setLoading] = useState(false);

  // Error message state
  const [error, setError] = useState("");

  // Toast popup state
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  // Task modal states
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);

  // Currently editing task
  const [editingTask, setEditingTask] = useState(null);

  // Delete confirmation state
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);

  // Member delete confirmation state
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);

  // Picker modal states
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Task form state
  const [taskForm, setTaskForm] = useState({
    name: "",
    assignedTo: "",
    priority: "",
    status: "to_do", // ✅ FIX: default status
    startDate: "",
    dueDate: "",
    description: "",
  });

  // Task form validation errors
  const [taskFieldErrors, setTaskFieldErrors] = useState({
    name: "",
    assignedTo: "",
    priority: "",
    status: "",
    startDate: "",
    dueDate: "",
    description: "",
  });

  // Refs for date inputs
  // These are used to open browser date picker using calendar icon click
  const startDateRefNew = useRef(null);
  const dueDateRefNew = useRef(null);
  const startDateRefEdit = useRef(null);
  const dueDateRefEdit = useRef(null);

  // Function to open date picker using input ref
  const openDatePicker = (ref) => {
    const el = ref?.current;
    if (!el) return;

    // Best support for Chrome / Edge
    if (typeof el.showPicker === "function") {
      el.showPicker();
      return;
    }

    // Fallback for Safari / iPhone
    el.focus();
    el.click();
  };

  // Clear one validation error only
  const clearTaskFieldError = (key) =>
    setTaskFieldErrors((prev) => ({ ...prev, [key]: "" }));

  // Load all page data when projectId changes
  useEffect(() => {
    loadAll();
  }, [projectId]);

  // Normalize tasks for frontend display
  const normalizeTasksForView = (rawTasks) => {
    const mapped = (rawTasks || []).map(mapTaskFromApi);

    // Sort by assigned time (oldest first), then by id (smallest first)
    // This ensures the first created task gets Task No 1
    mapped.sort((a, b) => {
      if (a._sortTime !== b._sortTime) return a._sortTime - b._sortTime;
      return (a._sortId || 0) - (b._sortId || 0);
    });

    // Add running task number
    return mapped.map((t, idx) => ({ ...t, taskNo: idx + 1 }));
  };

  // Convert allocations to member display format
  const allocationsToMembers = (allocations, allPeople) => {
    const list = allocations || [];

    const mapped = list.map((a) => {
      const u = a.User || {};
      const id = a.user_id || u.id;

      const fallback = (allPeople || []).find(
        (p) => String(p.id) === String(id),
      );

      return {
        id,
        name:
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
          fallback?.name ||
          u.email ||
          `User ${id}`,
        role: u.designation || fallback?.designation || "Employee",
        designation: u.designation || fallback?.designation || "",
        projectRole: a.role_in_project || "",
        profile_pic: u.profile_pic || fallback?.profile_pic || "",
      };
    });

    // Remove duplicate members
    const seen = new Set();
    return mapped.filter((m) => {
      const k = String(m.id);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  // Load project, employees, and tasks
  const loadAll = async () => {
    setLoading(true);
    setError("");

    try {
      // Load single project details
      const pres = await fetchProjectById(projectId);
      if (!pres?.success)
        throw new Error(pres?.message || "Failed to load project");

      setProject(pres.project);

      // Load employees
      try {
        const eres = await employeeAPI.getAllEmployees(1, 200);
        const list =
          eres?.data?.employees ||
          eres?.employees ||
          eres?.data ||
          eres?.rows ||
          [];

        // Base URL for profile images
        const BASE_URL = "http://localhost:5001";

        // Build avatar URL helper
        const buildAvatar = (u) => {
          const raw = u.profile_image || u.EmployeeDetail?.image_path || u.profile_pic || u.avatar || u.image || null;
          if (!raw) return "";
          if (raw.startsWith("http")) return raw;
          return `${BASE_URL}/${raw.replace(/^\/+/, "")}`;
        };

        // Convert employee list into frontend friendly format
        const normalized = (list || []).map((u) => ({
          id: u.id,
          name:
            [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
            u.fullname ||
            u.email ||
            `User ${u.id}`,
          profile_pic: buildAvatar(u),
          role: u.designation || "",
          designation: u.designation || "",
          loginRole: u.role || "",
        }));

        setPeople(normalized);

        // Build project member list from allocations
        setMembers(allocationsToMembers(pres.allocations || [], normalized));
      } catch (e) {
        // If employee API fails, still try to build members from project data
        setPeople([]);
        setMembers(allocationsToMembers(pres.allocations || [], []));
      }

      // Load tasks
      const tres = await fetchTasksByProject(projectId);
      if (tres?.success) setTasks(normalizeTasksForView(tres.tasks));
      else setTasks([]);
    } catch (err) {
      setError(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  // Search filter for tasks
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks
      .filter((t) => {
        if (
          taskFilters.status &&
          normalizeTaskStatus(t.progress) !== normalizeTaskStatus(taskFilters.status)
        )
          return false;
        if (
          taskFilters.priority &&
          String(t.priority).toLowerCase() !==
            String(taskFilters.priority).toLowerCase()
        )
          return false;
        if (
          taskFilters.assignedTo &&
          String(t.assignedTo) !== String(taskFilters.assignedTo)
        )
          return false;
        return true;
      })
      .filter((t) => {
        if (!q) return true;
        return (
          String(t.taskNo).includes(q) ||
          String(t.id).includes(q) ||
          (t.name || "").toLowerCase().includes(q) ||
          String(t.assignedTo || "")
            .toLowerCase()
            .includes(q) ||
          (t.priority || "").toLowerCase().includes(q) ||
          (t.progress || "").toLowerCase().includes(q)
        );
      });
  }, [search, tasks, taskFilters]);

  // Reset task form
  const resetForm = () => {
    setTaskForm({
      name: "",
      assignedTo: "",
      priority: "",
      status: "to_do", // ✅ FIX here also
      startDate: "",
      dueDate: "",
      description: "",
    });

    setTaskFieldErrors({
      name: "",
      assignedTo: "",
      priority: "",
      status: "",
      startDate: "",
      dueDate: "",
      description: "",
    });
  };

  // Validate task form
  const validateTaskForm = () => {
    const next = {
      name: "",
      assignedTo: "",
      priority: "",
      status: "",
      startDate: "",
      dueDate: "",
      description: "",
    };

    if (!taskForm.name.trim()) next.name = "Task name is required.";
    if (!taskForm.assignedTo) next.assignedTo = "Assignee is required.";
    if (!taskForm.priority) next.priority = "Priority is required.";
    // if (!taskForm.status) next.status = "Status is required.";
    if (!taskForm.startDate) next.startDate = "Start date is required.";
    if (!taskForm.dueDate) next.dueDate = "Due date is required.";
    if (!taskForm.description.trim())
      next.description = "Description is required.";

    setTaskFieldErrors(next);

    return (
      !next.name &&
      !next.assignedTo &&
      !next.priority &&
      // !next.status &&
      !next.startDate &&
      !next.dueDate &&
      !next.description
    );
  };

  // Open edit task modal with selected task data
  const openEdit = (task) => {
    setEditingTask(task);

    setTaskForm({
      name: task.name || "",
      assignedTo: task.assignedTo ? String(task.assignedTo) : "",
      priority: task.priority || "",
      status: task.progress || "",
      startDate: task.startDate === "—" ? "" : task.startDate,
      dueDate: task.dueDate === "—" ? "" : task.dueDate,
      description: task.description || "",
    });

    setTaskFieldErrors({
      name: "",
      assignedTo: "",
      priority: "",
      status: "",
      startDate: "",
      dueDate: "",
      description: "",
    });

    setEditTaskOpen(true);
  };

  // Get selected assignee details
  const selectedAssignee = useMemo(() => {
    if (!taskForm.assignedTo) return null;
    return people.find((p) => String(p.id) === String(taskForm.assignedTo));
  }, [taskForm.assignedTo, people]);

  // Priority options
  const priorityOptions = useMemo(
    () => [
      { value: "Low", label: "Low" },
      { value: "Medium", label: "Medium" },
      { value: "High", label: "High" },
      // { value: "critical", label: "Critical" },
    ],
    [],
  );

  // Status options
  const statusOptions = useMemo(
    () => [
      { value: "to_do", label: "To Do" },
      { value: "in_progress", label: "In Progress" },
      { value: "review", label: "In Review" },
      { value: "blocked", label: "CTO Review" },
      { value: "done", label: "Completed" },
    ],
    [],
  );

  // Get selected label values for UI display
  const priorityLabel =
    priorityOptions.find((o) => o.value === taskForm.priority)?.label || "";

  const statusLabel =
    statusOptions.find((o) => o.value === taskForm.status)?.label || "";

  // Create new task
  const submitNewTask = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateTaskForm()) return;

    try {
      // Get logged-in user from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const assigned_by = user?.id;

      if (!assigned_by) {
        setError("Login required (assigned_by missing)");
        return;
      }

      // Prepare request payload
      const payload = {
        project_id: Number(projectId),
        title: taskForm.name.trim(),
        description: taskForm.description.trim(),
        assigned_to: Number(taskForm.assignedTo),
        assigned_by: Number(assigned_by),
        priority: taskForm.priority,
        status: taskForm.status,
        assigned_at: taskForm.startDate
          ? `${taskForm.startDate}T00:00:00.000Z`
          : null,
        deadline: taskForm.dueDate ? `${taskForm.dueDate}T00:00:00.000Z` : null,
      };

      // API call
      const res = await createTaskAPI(payload);
      if (!res?.success) throw new Error(res?.message || "Create task failed");

      // Close modal and reload data
      setNewTaskOpen(false);
      resetForm();
      await loadAll();

      // Show success toast
      setToast({
        open: true,
        message: "Task created successfully.",
        type: "success",
      });
    } catch (err) {
      setError(err?.message || "Server error");
    }
  };

  // Update existing task
  const submitEditTask = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateTaskForm()) return;

    try {
      if (!editingTask?.id) return;

      // NOTE: `status` is intentionally NOT sent here.
      // The Status field has been removed from the Update Task modal — the
      // task's status is now owned by the assigned user via the user-side
      // TaskPage board (moveTaskByEmployee). Admin editing the task must not
      // overwrite the user's current board status.
      const payload = {
        title: taskForm.name.trim(),
        description: taskForm.description.trim(),
        assigned_to: Number(taskForm.assignedTo),
        priority: taskForm.priority,
        assigned_at: taskForm.startDate
          ? `${taskForm.startDate}T00:00:00.000Z`
          : null,
        deadline: taskForm.dueDate ? `${taskForm.dueDate}T00:00:00.000Z` : null,
      };

      const res = await updateTaskAPI(editingTask.id, payload);
      if (!res?.success) throw new Error(res?.message || "Update task failed");

      setEditTaskOpen(false);
      setEditingTask(null);
      resetForm();
      await loadAll();

      setToast({
        open: true,
        message: "Task updated successfully.",
        type: "success",
      });
    } catch (err) {
      setError(err?.message || "Server error");
    }
  };

  // Delete task
  const deleteTask = async (task) => {
    setError("");

    try {
      const res = await deleteTaskAPI(task.id);
      if (!res?.success) throw new Error(res?.message || "Delete task failed");

      setConfirmDeleteTask(null);
      await loadAll();

      setToast({
        open: true,
        message: "Task is successfully deleted.",
        type: "error",
      });
    } catch (err) {
      setError(err?.message || "Server error");
    }
  };

  // Save project members
  const saveMembers = async (nextUserIds) => {
    setError("");

    try {
      const res = await replaceProjectAllocations(projectId, nextUserIds);
      if (!res?.success)
        throw new Error(res?.message || "Members update failed");

      const fresh = allocationsToMembers(res.allocations || [], people);
      setMembers(fresh);

      setToast({
        open: true,
        message: res.message || "Members updated.",
        type: "success",
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Server error");
    }
  };

  // Member ids only
  const memberIds = useMemo(
    () => members.map((m) => Number(m.id)).filter(Boolean),
    [members],
  );

  // Combine actual project members + task assignees for display
  const membersForPanel = useMemo(() => {
    const map = new Map();

    // Real allocated members
    (members || []).forEach((m) => {
      const id = String(m.id);
      map.set(id, { ...m, _isAllocated: true });
    });

    // Task assignees only for display
    (tasks || []).forEach((t) => {
      const uid = t?.assignedTo ? String(t.assignedTo) : "";
      if (!uid) return;

      if (!map.has(uid)) {
        const p = (people || []).find((x) => String(x.id) === uid);

        map.set(uid, {
          id: Number(uid),
          name: p?.name || `User ${uid}`,
          role: p?.designation || p?.role || "Employee",
          designation: p?.designation || "",
          profile_pic: p?.profile_pic || "",
          _isAllocated: false,
        });
      }
    });

    // Pin the Project Manager to the FIRST position in the grid.
    // Everyone else keeps their existing relative order (stable sort).
    const list = Array.from(map.values());
    const managerIdStr = String(project?.managerId ?? "");
    if (managerIdStr) {
      list.sort((a, b) => {
        const aIsPM = String(a.id) === managerIdStr ? 1 : 0;
        const bIsPM = String(b.id) === managerIdStr ? 1 : 0;
        return bIsPM - aIsPM; // PM (1) before non-PM (0)
      });
    }
    return list;
  }, [members, tasks, people, project?.managerId]);

  // Remove a member from project
  const removeMember = async (userId) => {
    const next = memberIds.filter((id) => String(id) !== String(userId));

    // If removing the project manager, also delete all their tasks in this project
    if (String(userId) === String(project?.managerId)) {
      const managerTasks = tasks.filter(
        (t) => String(t.assignedTo) === String(userId)
      );

      for (const task of managerTasks) {
        try {
          await deleteTaskAPI(task.id);
        } catch (err) {
          console.warn("Failed to delete task:", task.id, err?.message);
        }
      }
    }

    await saveMembers(next);

    setToast({
      open: true,
      message:
        String(userId) === String(project?.managerId)
          ? "Project Manager and their tasks deleted successfully."
          : "Member deleted successfully.",
      type: "error",
    });
  };

  // Selected assignee name for showing in input UI
  const assigneeLabel = selectedAssignee?.name || "";

  // Render UI
  return (
    <div className="prj-page">
      {/* Top header section */}
      <div className="prj-topCard">
        <div className="prj-viewTopRow">
          {/* Back button */}
          <button
            type="button"
            className="prj-backBtn prj-backBtnIcon"
            onClick={() => navigate("/projects")}
            aria-label="Back"
          >
            <img src={backGreenIcon} alt="Back" />
          </button>

          {/* Project name */}
          <div className="prj-viewTitle">
            {project?.project_name || "Project"}
          </div>

          {/* Open new task modal */}
          <button
            type="button"
            className="prj-newTaskBtn"
            onClick={() => {
              setNewTaskOpen(true);
              setError("");
              resetForm();
            }}
            aria-label="New Task"
          >
            <img src={newTaskBtn} alt="New Task" className="prj-newTaskImg" />
          </button>
        </div>
      </div>

      {/* Loading and error messages */}
      {loading && <div style={{ padding: 8 }}>Loading...</div>}
      {error && <div style={{ padding: 8, color: "red" }}>{error}</div>}

      {/* Task list section */}
      <div className="prj-sectionCard">
        <div className="prj-sectionHeader">
          <div className="prj-sectionTitle">Task List</div>

          {/* Search and filter area */}
          <div className="prj-toolbar">
            <div className="prj-filterWrap">
              <button
                className="prj-filterBtn"
                type="button"
                aria-label="Filter"
                aria-expanded={taskFilterOpen}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setTaskFilterOpen((prev) => !prev)}
              >
                <img src={filterIconPng} alt="" aria-hidden="true" />
              </button>

              <TaskFilterDropdown
                open={taskFilterOpen}
                onClose={() => setTaskFilterOpen(false)}
                filters={taskFilters}
                onFiltersChange={setTaskFilters}
                people={people}
                statusOptions={statusOptions}
                priorityOptions={priorityOptions}
              />
            </div>

            <div className="prj-searchWrap">
              <img className="prj-searchIcon" src={searchIcon} alt="" />
              <input
                className="prj-searchInput"
                placeholder="Search tasks"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Task table */}
        <div className="prj-tableWrap">
          <table className="prj-table">
            <thead>
              <tr>
                <th>Task No</th>
                <th>Task Name</th>
                <th>Start Date</th>
                <th>Assigned</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Progress</th>
                <th className="prj-actionsCol">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td data-label="Task No">{t.taskNo}</td>
                  <td data-label="Task Name">{t.name}</td>
                  <td data-label="Start Date">{formatDisplayDate(t.startDate)}</td>

                  <td data-label="Assigned">
                    <div className="prj-assignedCell">
                      {(() => {
                        const person = people.find(
                          (p) => String(p.id) === String(t.assignedTo)
                        );
                        return (
                          <>
                            {person?.profile_pic ? (
                              <img
                                className="prj-assignAvatarImg"
                                src={person.profile_pic}
                                alt={person.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="prj-assignAvatarImg"
                              aria-hidden="true"
                              style={{
                                display: person?.profile_pic ? "none" : "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "#d7f5de",
                                color: "#2f7d3e",
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            >
                              {person?.name
                                ? person.name.charAt(0).toUpperCase()
                                : t.assignedTo
                                ? String(t.assignedTo).charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <div className="prj-assignName">
                              {person?.name || t.assignedTo || "—"}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </td>

                  <td data-label="Due Date">{formatDisplayDate(t.dueDate)}</td>

                  <td data-label="Priority">
                    <Badge
                      variant={
                        String(t.priority).toLowerCase() === "high"
                          ? "high"
                          : String(t.priority).toLowerCase() === "low"
                            ? "low"
                            : "medium"
                      }
                    >
                      {t.priority}
                    </Badge>
                  </td>

                  {/* Progress column reflects the assigned user's CURRENT status
                      from the user-side TaskPage board. `t.progress` is derived
                      from the backend task.status (see mapTaskFromApi above), so
                      whenever the user moves the task on their kanban board
                      (to_do -> in_progress -> review -> cto_review -> done) the
                      new status shows up here on the next loadAll(). */}
                  <td data-label="Progress">
                    <Badge variant={getProgressVariant(t.progress)}>
                      {STATUS_LABELS[t.progress] || t.progress}
                    </Badge>
                  </td>

                  <td data-label="Actions" className="prj-actionsCell">
                    {/* Delete button */}
                    <button
                      className="prj-actionBtn danger"
                      title="Delete"
                      onClick={() => setConfirmDeleteTask(t)}
                    >
                      <TrashIcon />
                    </button>

                    {/* Edit button */}
                    <button
                      className="prj-actionBtn edit"
                      title="Edit"
                      onClick={() => openEdit(t)}
                    >
                      <img src={editBlueIcon} alt="" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Show message if no tasks */}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="prj-empty">
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project members section */}
      <div className="prj-sectionCard">
        <div className="prj-sectionHeader">
          <div className="prj-sectionTitle">Project Members</div>
        </div>

        <div className="prj-membersWrap">
          <div className="prj-membersRow">
            {membersForPanel.map((m) => (
              <div key={m.id} className="prj-memberChip">
                <div className="prj-memberAvatarWrap">
                  {m.profile_pic ? (
                    <img
                      className="prj-memberAvatarImg"
                      src={m.profile_pic}
                      alt={m.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="prj-memberAvatarImg"
                    aria-hidden="true"
                    style={{
                      display: m.profile_pic ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#d7f5de",
                      color: "#2f7d3e",
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {m.name ? m.name.charAt(0).toUpperCase() : "?"}
                  </div>

                  {/* Only actual project members can be removed.
                      Figma: pink circular badge with a white trash icon,
                      sitting at the bottom-right of the avatar. */}
                  {m._isAllocated ? (
                    <button
                      className="prj-memberRemoveBtn"
                      type="button"
                      title="Remove"
                      onClick={() => setConfirmDeleteMember(m)}
                      aria-label={`Remove ${m.name}`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 6h18"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 11v6M14 11v6"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>

                <div className="prj-memberText">
                  <div className="prj-memberChipName">{m.name}</div>
                  <div className="prj-memberChipRole">
                    {m.designation || m.role || "Employee"}
                  </div>
                </div>
              </div>
            ))}

            {/* Add member button — Figma: dashed circle ring + user-with-plus glyph */}
            <button
              type="button"
              className="pm-addBtn"
              onClick={() => setMembersModalOpen(true)}
            >
              <span className="pm-addIcon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  {/* Head */}
                  <circle
                    cx="10"
                    cy="8"
                    r="3.2"
                    stroke="#111827"
                    strokeWidth="1.6"
                  />
                  {/* Shoulders */}
                  <path
                    d="M4.5 18c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
                    stroke="#111827"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  {/* Plus */}
                  <path
                    d="M18.5 6v5M16 8.5h5"
                    stroke="#111827"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="pm-addText">Add member</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      <Modal
        title="New Task"
        open={newTaskOpen}
        onClose={() => {
          setNewTaskOpen(false);
          resetForm();
        }}
      >
        <form className="prj-form prj-formGrid" onSubmit={submitNewTask}>
          {/* Task name */}
          <label className="prj-label">Task Name</label>
          <input
            className={`prj-input ${
              taskFieldErrors.name ? "prj-inputError" : ""
            }`}
            placeholder="Enter your task"
            value={taskForm.name}
            onChange={(e) => {
              setTaskForm((s) => ({ ...s, name: e.target.value }));
              if (taskFieldErrors.name) clearTaskFieldError("name");
            }}
          />
          {taskFieldErrors.name && (
            <div className="prj-fieldError">{taskFieldErrors.name}</div>
          )}

          {/* Assignee and Priority */}
          <div className="prj-twoCol">
            <div>
              <label className="prj-label">Assignee</label>
              <button
                type="button"
                className={`prj-assigneeField ${
                  taskFieldErrors.assignedTo ? "prj-inputError" : ""
                } ${taskForm.assignedTo ? "prj-hasValue" : ""}`}
                onClick={() => setAssigneeModalOpen(true)}
              >
                <span
                  className={`prj-assigneePlaceholder ${
                    assigneeLabel ? "has" : ""
                  }`}
                >
                  {assigneeLabel || "Choose a person"}
                </span>
                <img
                  className="prj-assigneeIcon"
                  src={addPersonIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              {taskFieldErrors.assignedTo && (
                <div className="prj-fieldError">
                  {taskFieldErrors.assignedTo}
                </div>
              )}
            </div>

            <div>
              <label className="prj-label">Priority</label>
              <button
                type="button"
                className={`prj-assigneeField ${
                  taskFieldErrors.priority ? "prj-inputError" : ""
                } ${taskForm.priority ? "prj-hasValue" : ""}`}
                onClick={() => setPriorityModalOpen(true)}
              >
                <span
                  className={`prj-assigneePlaceholder ${
                    priorityLabel ? "has" : ""
                  }`}
                >
                  {priorityLabel || "Choose one"}
                </span>
                <img
                  className="prj-assigneeIcon"
                  src={dropDownIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>
              {taskFieldErrors.priority && (
                <div className="prj-fieldError">{taskFieldErrors.priority}</div>
              )}
            </div>
          </div>

          {/* Start Date and Due Date */}
          <div className="prj-twoCol">
            <div>
              <label className="prj-label">Start Date</label>
              <div className="prj-dateField">
                <input
                  ref={startDateRefNew}
                  type="date"
                  className={`prj-input prj-inputWithIcon prj-dateInput ${
                    taskFieldErrors.startDate ? "prj-inputError" : ""
                  } ${taskForm.startDate ? "prj-hasValue" : ""}`}
                  value={taskForm.startDate}
                  onChange={(e) => {
                    setTaskForm((s) => ({ ...s, startDate: e.target.value }));
                    if (taskFieldErrors.startDate)
                      clearTaskFieldError("startDate");
                  }}
                />
                <button
                  type="button"
                  className="prj-dateIconBtn"
                  aria-label="Open calendar"
                  onClick={() => openDatePicker(startDateRefNew)}
                >
                  <img
                    className="prj-fieldIconImg"
                    src={calendarIcon}
                    alt=""
                    aria-hidden="true"
                  />
                </button>
              </div>

              {taskFieldErrors.startDate && (
                <div className="prj-fieldError">
                  {taskFieldErrors.startDate}
                </div>
              )}
            </div>

            <div>
              <label className="prj-label">Due Date</label>
              <div className="prj-dateField">
                <input
                  ref={dueDateRefNew}
                  type="date"
                  className={`prj-input prj-inputWithIcon prj-dateInput ${
                    taskFieldErrors.dueDate ? "prj-inputError" : ""
                  } ${taskForm.dueDate ? "prj-hasValue" : ""}`}
                  value={taskForm.dueDate}
                  onChange={(e) => {
                    setTaskForm((s) => ({ ...s, dueDate: e.target.value }));
                    if (taskFieldErrors.dueDate) clearTaskFieldError("dueDate");
                  }}
                />
                <button
                  type="button"
                  className="prj-dateIconBtn"
                  aria-label="Open calendar"
                  onClick={() => openDatePicker(dueDateRefNew)}
                >
                  <img
                    className="prj-fieldIconImg"
                    src={calendarIcon}
                    alt=""
                    aria-hidden="true"
                  />
                </button>
              </div>

              {taskFieldErrors.dueDate && (
                <div className="prj-fieldError">{taskFieldErrors.dueDate}</div>
              )}
            </div>
          </div>

          {/* Status */}
          {/* <div className="prj-twoCol">
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="prj-label">Status</label>
              <button
                type="button"
                className={`prj-assigneeField ${
                  taskFieldErrors.status ? "prj-inputError" : ""
                } ${taskForm.status ? "prj-hasValue" : ""}`}
                onClick={() => setStatusModalOpen(true)}
              >
                <span
                  className={`prj-assigneePlaceholder ${
                    statusLabel ? "has" : ""
                  }`}
                >
                  {statusLabel || "Select status"}
                </span>
                <img
                  className="prj-assigneeIcon"
                  src={dropDownIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              {taskFieldErrors.status && (
                <div className="prj-fieldError">{taskFieldErrors.status}</div>
              )}
            </div>
          </div> */}

          {/* Description */}
          <label className="prj-label">Description</label>
          <textarea
            className={`prj-textarea ${
              taskFieldErrors.description ? "prj-inputError" : ""
            }`}
            placeholder="Write a description"
            value={taskForm.description}
            onChange={(e) => {
              setTaskForm((s) => ({ ...s, description: e.target.value }));
              if (taskFieldErrors.description)
                clearTaskFieldError("description");
            }}
          />
          {taskFieldErrors.description && (
            <div className="prj-fieldError">{taskFieldErrors.description}</div>
          )}

          {/* Submit button
              Label switches based on the selected Start Date:
              - Start Date is in the future (> today) -> "Schedule Task"
              - Otherwise (today or empty) -> "Create Task"
              Comparing YYYY-MM-DD strings is safe and avoids timezone issues
              because <input type="date"> already gives us a local YYYY-MM-DD. */}
          {(() => {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(
              today.getMonth() + 1
            ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            const isFutureStart =
              !!taskForm.startDate && taskForm.startDate > todayStr;
            return (
              <button
                className="prj-primaryBtn prj-primaryBtnFull"
                type="submit"
              >
                {isFutureStart ? "Schedule Task" : "Create Task"}
              </button>
            );
          })()}
        </form>
      </Modal>

      {/* Update Task Modal */}
      <Modal
        title="Update Task"
        open={editTaskOpen}
        onClose={() => {
          setEditTaskOpen(false);
          setEditingTask(null);
          resetForm();
        }}
      >
        <form className="prj-form prj-formGrid" onSubmit={submitEditTask}>
          <label className="prj-label">Task Name</label>
          <input
            className={`prj-input ${
              taskFieldErrors.name ? "prj-inputError" : ""
            }`}
            value={taskForm.name}
            onChange={(e) => {
              setTaskForm((s) => ({ ...s, name: e.target.value }));
              if (taskFieldErrors.name) clearTaskFieldError("name");
            }}
          />
          {taskFieldErrors.name && (
            <div className="prj-fieldError">{taskFieldErrors.name}</div>
          )}

          <div className="prj-twoCol">
            <div>
              <label className="prj-label">Assignee</label>
              <button
                type="button"
                className={`prj-assigneeField ${
                  taskFieldErrors.assignedTo ? "prj-inputError" : ""
                } ${taskForm.assignedTo ? "prj-hasValue" : ""}`}
                onClick={() => setAssigneeModalOpen(true)}
              >
                <span
                  className={`prj-assigneePlaceholder ${
                    assigneeLabel ? "has" : ""
                  }`}
                >
                  {assigneeLabel || "Choose a person"}
                </span>
                <img
                  className="prj-assigneeIcon"
                  src={addPersonIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              {taskFieldErrors.assignedTo && (
                <div className="prj-fieldError">
                  {taskFieldErrors.assignedTo}
                </div>
              )}

              {/* {selectedAssignee && (
                <div className="prj-selectedPerson">
                  <div className="prj-selectedAvatar" aria-hidden="true" />
                  <div className="prj-selectedText">
                    <div className="prj-selectedName">
                      {selectedAssignee.name}
                    </div>
                    <div className="prj-selectedRole">
                      {selectedAssignee.role || "Assignee"}
                    </div>
                  </div>
                </div>
              )} */}
            </div>

            <div>
              <label className="prj-label">Priority</label>
              <button
                type="button"
                className={`prj-assigneeField ${
                  taskFieldErrors.priority ? "prj-inputError" : ""
                } ${taskForm.priority ? "prj-hasValue" : ""}`}
                onClick={() => setPriorityModalOpen(true)}
              >
                <span
                  className={`prj-assigneePlaceholder ${
                    priorityLabel ? "has" : ""
                  }`}
                >
                  {priorityLabel || "Choose one"}
                </span>
                <img
                  className="prj-assigneeIcon"
                  src={dropDownIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              {taskFieldErrors.priority && (
                <div className="prj-fieldError">{taskFieldErrors.priority}</div>
              )}
            </div>
          </div>

          <div className="prj-twoCol">
            <div>
              <label className="prj-label">Start Date</label>
              <div className="prj-dateField">
                <input
                  ref={startDateRefEdit}
                  type="date"
                  className={`prj-input prj-inputWithIcon prj-dateInput ${
                    taskFieldErrors.startDate ? "prj-inputError" : ""
                  } ${taskForm.startDate ? "prj-hasValue" : ""}`}
                  value={taskForm.startDate}
                  onChange={(e) => {
                    setTaskForm((s) => ({ ...s, startDate: e.target.value }));
                    if (taskFieldErrors.startDate)
                      clearTaskFieldError("startDate");
                  }}
                />
                <button
                  type="button"
                  className="prj-dateIconBtn"
                  aria-label="Open calendar"
                  onClick={() => openDatePicker(startDateRefEdit)}
                >
                  <img
                    className="prj-fieldIconImg"
                    src={calendarIcon}
                    alt=""
                    aria-hidden="true"
                  />
                </button>
              </div>

              {taskFieldErrors.startDate && (
                <div className="prj-fieldError">
                  {taskFieldErrors.startDate}
                </div>
              )}
            </div>

            <div>
              <label className="prj-label">Due Date</label>
              <div className="prj-dateField">
                <input
                  ref={dueDateRefEdit}
                  type="date"
                  className={`prj-input prj-inputWithIcon prj-dateInput ${
                    taskFieldErrors.dueDate ? "prj-inputError" : ""
                  } ${taskForm.dueDate ? "prj-hasValue" : ""}`}
                  value={taskForm.dueDate}
                  onChange={(e) => {
                    setTaskForm((s) => ({ ...s, dueDate: e.target.value }));
                    if (taskFieldErrors.dueDate) clearTaskFieldError("dueDate");
                  }}
                />
                <button
                  type="button"
                  className="prj-dateIconBtn"
                  aria-label="Open calendar"
                  onClick={() => openDatePicker(dueDateRefEdit)}
                >
                  <img
                    className="prj-fieldIconImg"
                    src={calendarIcon}
                    alt=""
                    aria-hidden="true"
                  />
                </button>
              </div>

              {taskFieldErrors.dueDate && (
                <div className="prj-fieldError">{taskFieldErrors.dueDate}</div>
              )}
            </div>
          </div>

          {/* Status field removed from Update Task modal — the task's status is
              driven by the user from the user-side TaskPage board (drag/drop).
              Admin no longer edits it from this modal. */}

          <label className="prj-label">Description</label>
          <textarea
            className={`prj-textarea ${
              taskFieldErrors.description ? "prj-inputError" : ""
            }`}
            value={taskForm.description}
            onChange={(e) => {
              setTaskForm((s) => ({ ...s, description: e.target.value }));
              if (taskFieldErrors.description)
                clearTaskFieldError("description");
            }}
          />
          {taskFieldErrors.description && (
            <div className="prj-fieldError">{taskFieldErrors.description}</div>
          )}

          <button className="prj-primaryBtn prj-primaryBtnFull" type="submit">
            Update Task
          </button>
        </form>
      </Modal>

      {/* Assignee picker modal */}
      <AssigneePickerModal
        open={assigneeModalOpen}
        onClose={() => setAssigneeModalOpen(false)}
        people={people}
        value={taskForm.assignedTo}
        onConfirm={(id) => {
          setTaskForm((s) => ({ ...s, assignedTo: String(id) }));
          if (taskFieldErrors.assignedTo) clearTaskFieldError("assignedTo");
        }}
      />

      {/* Priority picker modal */}
      <OptionPickerModal
        open={priorityModalOpen}
        onClose={() => setPriorityModalOpen(false)}
        title="Priority"
        options={priorityOptions}
        value={taskForm.priority}
        onConfirm={(val) => {
          setTaskForm((s) => ({ ...s, priority: String(val) }));
          if (taskFieldErrors.priority) clearTaskFieldError("priority");
        }}
      />

      {/* Status picker modal */}
      <OptionPickerModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Status"
        options={statusOptions}
        value={taskForm.status}
        onConfirm={(val) => {
          setTaskForm((s) => ({ ...s, status: String(val) }));
          if (taskFieldErrors.status) clearTaskFieldError("status");
        }}
      />

      {/* Project members modal */}
      <ProjectMembersModal
        open={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        people={people}
        selectedIds={memberIds}
        onConfirm={async (selected) => {
          const setAll = new Set([
            ...memberIds.map(String),
            ...(selected || []).map(String),
          ]);
          const next = [...setAll].map(Number).filter(Boolean);
          await saveMembers(next);
        }}
      />

      {/* Delete confirm modal */}
      {confirmDeleteTask && (
        <DeleteConfirmModal
          isOpen={!!confirmDeleteTask}
          onClose={() => setConfirmDeleteTask(null)}
          itemName="this task"
          onConfirm={() => deleteTask(confirmDeleteTask)}
        />
      )}

      {/* Delete member confirm modal */}
      {confirmDeleteMember && (
        <DeleteConfirmModal
          isOpen={!!confirmDeleteMember}
          onClose={() => setConfirmDeleteMember(null)}
          itemName="this member"
          onConfirm={() => {
            removeMember(confirmDeleteMember.id);
            setConfirmDeleteMember(null);
          }}
        />
      )}

      {/* Toast popup */}
      {toast.open && (
        <ToastModal
          isOpen={toast.open}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((s) => ({ ...s, open: false }))}
        />
      )}
    </div>
  );
}
