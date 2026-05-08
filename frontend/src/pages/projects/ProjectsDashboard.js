// Import React and required hooks
// React is needed to create the component.
// useState is used to store values.
// useEffect is used to run code when component loads or updates.
// useMemo is used to avoid unnecessary recalculations.
import React, { useMemo, useState, useEffect, useRef } from "react";

// Import navigation hook
// useNavigate helps move to another page in the app.
import { useNavigate } from "react-router-dom";

// Import CSS file
// This CSS file contains the styles for this page.
import "./Projects.css";

// Import images and modal component
// Icon for creating a new project
import newProjectIcon from "../../assets/icons/new_project_plus.png";

// Reusable modal component for popup window
import BaseModal from "../../modals/projects/BaseModel";

// Search icon image
import searchIcon from "../../assets/icons/searchicon.png";

// Filter icon image
import filterIconPng from "../../assets/icons/filterricon.png";

// Dropdown arrow icon image
import dropDownIcon from "../../assets/icons/DropDownIcon.png";

// Import API functions
// fetchProjectsDashboard - gets all projects and dashboard stats
// createProjectAPI - sends new project data to backend
import {
  fetchProjectsDashboard,
  createProject as createProjectAPI,
} from "../../integration/projectAPI";

// employeeAPI - used to get employee list from backend
import employeeAPI from "../../integration/employeeAPI";

// Small external link icon component
// This SVG icon is shown on each project card.
// When clicked, it opens the selected project page.
function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"
      />
    </svg>
  );
}

// MemberPickerModal Component
// This modal is used to select a project member / manager.
// It shows a search box and list of employees.
function MemberPickerModal({ open, onClose, people, value, onConfirm }) {
  // q = search text typed by the user
  const [q, setQ] = useState("");

  // temp = temporarily selected member id inside the modal
  const [temp, setTemp] = useState("");

  // When modal opens, reset search field and set current selected value
  useEffect(() => {
    if (open) {
      setQ("");
      setTemp(value ? String(value) : "");
    }
  }, [open, value]);

  // Filter employee list based on search text
  const filtered = useMemo(() => {
    // Remove extra spaces and convert to lowercase for easier search
    const s = q.trim().toLowerCase();

    // If search box is empty, return all people
    if (!s) return people || [];

    // Return only people whose name includes the search text
    return (people || []).filter((p) =>
      String(p.name || "")
        .toLowerCase()
        .includes(s),
    );
  }, [q, people]);

  // If modal is not open, show nothing
  if (!open) return null;

  // UI of member picker modal
  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div className="prj-memberModal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header section of modal */}
        <div className="prj-memberHeader">
          <div className="prj-memberTitle">Project Members</div>

          {/* Close button */}
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Body content of modal */}
        <div className="prj-memberBody">
          {/* Search bar */}
          <div className="prj-memberSearch">
            <span className="prj-memberSearchIcon" aria-hidden="true">
              🔍
            </span>

            <input
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Employee list */}
          <div className="prj-memberList">
            {filtered.map((p) => {
              // Check whether this employee is currently selected
              const active = String(p.id) === String(temp);

              return (
                <div
                  key={p.id}
                  className={`prj-memberRow ${active ? "active" : ""}`}
                  onClick={() => setTemp(String(p.id))}
                  role="button"
                  tabIndex={0}
                >
                  {/* Custom checkbox box */}
                  <div className={`prj-cb ${active ? "checked" : ""}`} />

                  {/* Avatar: show profile photo if available, else grey circle */}
                  {p.avatar ? (
                    <img
                      className="prj-memberAvatar"
                      src={p.avatar}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="prj-memberAvatar"
                    aria-hidden="true"
                    style={{
                      display: p.avatar ? "none" : "flex",
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

                  {/* Employee info */}
                  <div className="prj-memberInfo">
                    <div className="prj-memberName">{p.name}</div>
                    <div className="prj-memberRole">Employee</div>
                  </div>
                </div>
              );
            })}

            {/* If no employee matches search */}
            {!filtered.length && (
              <div className="prj-memberEmpty">No members found.</div>
            )}
          </div>

          {/* Confirm selection button */}
          <button
            type="button"
            className="prj-primaryBtn prj-primaryBtnFull"
            disabled={!temp}
            style={{
              opacity: !temp ? 0.6 : 1,
              cursor: !temp ? "not-allowed" : "pointer",
            }}
            onClick={() => {
              // Do nothing if no employee is selected
              if (!temp) return;

              // Send selected employee id back to parent component
              onConfirm(temp);

              // Close modal
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

// FilterModal Component
// This modal allows filtering projects by status only
function FilterModal({ open, onClose, filters, onFiltersChange }) {
  // Local state for filter values
  const [localFilters, setLocalFilters] = useState(filters);

  // Update local filters when modal opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // If modal is not open, show nothing
  if (!open) return null;

  // Apply filters and close modal
  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  // Clear all filters
  const handleClear = () => {
    const cleared = { status: "" };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    onClose();
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "upcoming", label: "Upcoming" },
    { value: "on-hold", label: "On Hold" },
  ];

  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div className="prj-memberModal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header section of modal */}
        <div className="prj-memberHeader">
          <div className="prj-memberTitle">Filter Projects</div>
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Body content of modal */}
        <div className="prj-memberBody">
          {/* Status filter */}
          <div className="prj-filterSection">
            <label className="prj-filterLabel">Status</label>
            <div className="prj-filterChips">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`prj-filterOption ${
                    localFilters.status === option.value ? "active" : ""
                  }`}
                  aria-pressed={localFilters.status === option.value}
                  onClick={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      status: option.value,
                    }))
                  }
                >
                  <span className="prj-filterCheck" aria-hidden="true">
                    ✓
                  </span>
                  <span className="prj-filterText">{option.label}</span>
                </button>
              ))}
            </div>
          </div>


          {/* Action buttons */}
          <div className="prj-filterActions">
            <button
              type="button"
              className="prj-secondaryBtn"
              onClick={handleClear}
            >
              Clear All
            </button>
            <button
              type="button"
              className="prj-primaryBtn"
              onClick={handleApply}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectFilterDropdown({ open, onClose, filters, onFiltersChange }) {
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "upcoming", label: "Upcoming" },
    { value: "on-hold", label: "On Hold" },
  ];

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

  const toggleStatus = (value) => {
    onFiltersChange((prev) => ({
      ...prev,
      status: prev.status === value ? "" : value,
    }));
  };

  return (
    <div
      ref={dropdownRef}
      className="prj-filterDropdown"
      role="dialog"
      aria-label="Filter projects"
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
              onClick={() => toggleStatus(option.value)}
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

      <button
        type="button"
        className="prj-filterDropdownClear"
        onClick={() => onFiltersChange({ status: "" })}
      >
        Clear all
      </button>
    </div>
  );
}

// Main Projects Dashboard Component
export default function ProjectsDashboard() {
  // navigate is used to move to another page
  const navigate = useNavigate();

  // Search input value for filtering projects
  const [search, setSearch] = useState("");

  // Controls whether "New Project" modal is open or closed
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // Form data for creating a new project
  const [form, setForm] = useState({
    name: "",
    description: "",
    managerId: "",
  });

  // Stores all projects received from backend
  const [projectList, setProjectList] = useState([]);

  // Stores all employees received from backend
  const [people, setPeople] = useState([]);

  // Stores dashboard stat values
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    assignedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  // True while loading data from backend
  const [loading, setLoading] = useState(false);

  // Stores general error message
  const [error, setError] = useState("");

  // Stores validation error messages for each form field
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    description: "",
    managerId: "",
  });

  // This function removes the error for one specific field only
  const clearFieldError = (key) =>
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));

  // Controls member picker modal visibility
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);

  // Controls filter modal visibility
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter criteria
  const [filters, setFilters] = useState({
    status: "",
  });

  // Load projects and employees when page first opens
  useEffect(() => {
    loadProjects();
    loadPeople();
  }, []);

  // Function: Load all projects from backend
  const loadProjects = async () => {
    setLoading(true); // show loading state
    setError(""); // clear old error

    try {
      // Call API to get projects and stats
      const res = await fetchProjectsDashboard();

      // Check whether backend returned success
      if (res?.success) {
        // Get projects list, or empty array if missing
        const list = res.projects || [];
        setProjectList(list);

        // Safely read total projects from possible backend field names
        const totalProjects =
          res?.stats?.totalProjects ??
          res?.stats?.total ??
          res?.stats?.total_project ??
          list.length;

        // Safely read total tasks from possible backend field names
        const totalTasks =
          res?.stats?.totalTasks ??
          res?.stats?.total_tasks ??
          res?.stats?.tasks_total ??
          0;

        // Safely read assigned tasks from possible backend field names
        const assignedTasks =
          res?.stats?.assignedTasks ??
          res?.stats?.assigned_tasks ??
          res?.stats?.tasks_assigned ??
          0;

        // Safely read completed tasks from possible backend field names
        const completedTasks =
          res?.stats?.completedTasks ??
          res?.stats?.completed_tasks ??
          res?.stats?.tasks_completed ??
          0;

        // Safely read overdue tasks from possible backend field names
        const overdueTasks =
          res?.stats?.overdueTasks ??
          res?.stats?.overdue_tasks ??
          res?.stats?.tasks_overdue ??
          0;

        // Save all stat values into state
        setDashboardStats({
          totalProjects,
          totalTasks,
          assignedTasks,
          completedTasks,
          overdueTasks,
        });
      } else {
        // If backend says request failed
        setError(res?.message || "Failed to load projects");
      }
    } catch (err) {
      // Handle unexpected API or server errors
      setError(err?.response?.data?.message || err.message || "Server error");
    } finally {
      // Stop loading in both success and error cases
      setLoading(false);
    }
  };

  // Function: Load employee list from backend
  const loadPeople = async () => {
    try {
      // Get employee data
      const res = await employeeAPI.getAllEmployees(1, 200);

      // Try different response structures safely
      const list =
        res?.data?.employees || res?.employees || res?.data || res?.rows || [];

      // Base URL for profile images
      const BASE_URL = "http://localhost:5001";

      // Convert employee data into simple format: { id, name, avatar }
      const normalized = (list || []).map((u) => {
        // Build avatar URL from profile_image field (stored as "uploads/image-xxx.jpg")
        const imagePath = u.profile_image || u.EmployeeDetail?.image_path || null;
        const avatar = imagePath
          ? imagePath.startsWith("http")
            ? imagePath
            : `${BASE_URL}/${imagePath.replace(/^\/+/, "")}`
          : null;
        return {
          id: u.id,
          name:
            [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
            u.fullname ||
            u.email ||
            `User ${u.id}`,
          avatar,
        };
      });

      // Save employees into state
      setPeople(normalized);
    } catch (e) {
      // If loading people fails, show warning in console only
      console.warn("People load failed:", e?.message);
      setPeople([]);
    }
  };

  // Function: Open project details page
  const openProject = (p) => navigate(`/projects/${p.id}`);

  // Filter projects based on search text and filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // First apply filters
    let result = projectList.filter((p) => {
      // Filter by status
      if (
        filters.status &&
        String(p.status || "").toLowerCase() !==
          String(filters.status).toLowerCase()
      )
        return false;


      return true;
    });

    // Then apply search
    if (q) {
      result = result.filter((p) => {
        const title = (p.project_name || p.title || "").toLowerCase();
        const sub = (p.description || p.subtitle || "").toLowerCase();
        const mgr = (p.managerName || "").toLowerCase();

        // Match search text with title, description, or manager name
        return title.includes(q) || sub.includes(q) || mgr.includes(q);
      });
    }

    return result;
  }, [search, projectList, filters]);

  // Validate new project form
  const validateProjectForm = () => {
    const next = { name: "", description: "", managerId: "" };

    // Validate project name
    if (!form.name.trim()) next.name = "Project name is required.";

    // Validate description
    if (!form.description.trim()) next.description = "Description is required.";

    // Validate selected manager/member
    if (!form.managerId) next.managerId = "Please select a project member.";

    // Save validation errors into state
    setFieldErrors(next);

    // Return true only if all fields are valid
    return !next.name && !next.description && !next.managerId;
  };

  // Function: Create new project
  const handleCreateProject = async (e) => {
    e.preventDefault(); // prevent page refresh on form submit
    setError(""); // clear old general error

    // Stop if validation fails
    if (!validateProjectForm()) return;

    try {
      // Prepare request body to send to backend
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        project_type: "internal",
        status: "planning",
        start_date: null,
        end_date: null,
        managerId: Number(form.managerId),
      };

      // Call backend API to create project
      const res = await createProjectAPI(body);

      if (res?.success) {
        // Close modal after successful creation
        setNewProjectOpen(false);

        // Reset form data
        setForm({ name: "", description: "", managerId: "" });

        // Reset field errors
        setFieldErrors({ name: "", description: "", managerId: "" });

        // Reload project list
        await loadProjects();
      } else {
        // Show backend error message
        setError(res?.message || "Create project failed");
      }
    } catch (err) {
      // Show API/server error
      setError(err?.response?.data?.message || err.message || "Server error");
    }
  };

  // Get selected member details from people list
  const selectedMember = useMemo(() => {
    if (!form.managerId) return null;
    return people.find((p) => String(p.id) === String(form.managerId)) || null;
  }, [form.managerId, people]);

  // Render UI
  return (
    <div className="prj-page">
      {/* Top header card */}
      <div className="prj-topCard">
        <div className="prj-topRow">
          {/* Page title */}
          <div className="prj-pageTitle">Projects</div>

          {/* Button to open new project modal */}
          <button
            type="button"
            className="prj-newProjectBtn"
            onClick={() => {
              // Open modal
              setNewProjectOpen(true);

              // Reset errors when opening modal
              setError("");
              setFieldErrors({ name: "", description: "", managerId: "" });

              // Load people if not already available
              if (!people?.length) loadPeople();
            }}
            aria-label="New Project"
          >
            <img
              className="prj-newProjectImg"
              src={newProjectIcon}
              alt="New Project"
            />
          </button>
        </div>
      </div>

      {/* Loading message */}
      {loading && <div style={{ padding: 8 }}>Loading projects...</div>}

      {/* Error message */}
      {error && <div style={{ padding: 8, color: "red" }}>{error}</div>}

      {/* Dashboard statistics card */}
      <div className="prj-statsCard">
        <div className="prj-statsGrid">
          <div className="prj-stat">
            <div className="prj-statLabel">Total Project</div>
            <div className="prj-statValue">{dashboardStats.totalProjects}</div>
          </div>

          <div className="prj-stat">
            <div className="prj-statLabel">Total Tasks</div>
            <div className="prj-statValue">{dashboardStats.totalTasks}</div>
          </div>

          <div className="prj-stat">
            <div className="prj-statLabel">Assigned Tasks</div>
            <div className="prj-statValue">{dashboardStats.assignedTasks}</div>
          </div>

          <div className="prj-stat">
            <div className="prj-statLabel">Completed Tasks</div>
            <div className="prj-statValue">{dashboardStats.completedTasks}</div>
          </div>

          <div className="prj-stat">
            <div className="prj-statLabel">Overdue Tasks</div>
            <div className="prj-statValue">{dashboardStats.overdueTasks}</div>
          </div>
        </div>
      </div>

      {/* Main section containing all projects */}
      <div className="prj-sectionCard">
        <div className="prj-sectionHeader">
          <div className="prj-sectionTitle">All Projects</div>

          {/* Toolbar with filter and search */}
          <div className="prj-toolbar">
            <div className="prj-filterWrap">
              <button
                className="prj-filterBtn"
                type="button"
                aria-label="Filter"
                aria-expanded={filterOpen}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setFilterOpen((prev) => !prev)}
              >
                <img src={filterIconPng} alt="" aria-hidden="true" />
              </button>

              <ProjectFilterDropdown
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Search input */}
            <div className="prj-searchWrap">
              <img className="prj-searchIcon" src={searchIcon} alt="" />
              <input
                className="prj-searchInput"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Projects grid */}
        <div className="prj-grid">
          {filtered.map((p, idx) => {
            // Safe values for project display
            const title = p.project_name || p.title || "Project";
            const subtitle = p.description || p.subtitle || "";
            const managerName = p.managerName || "Project Manager";

            return (
              <div
                className="prj-card"
                key={`${p.id}-${idx}`}
                onClick={() => openProject(p)}
                role="button"
                tabIndex={0}
              >
                {/* Top part of project card */}
                <div className="prj-cardTop">
                  <div className="prj-cardHead">
                    {/* Placeholder thumbnail */}
                    <div className="prj-cardThumb" aria-hidden="true">
                      <div className="prj-thumbRow" />
                      <div className="prj-thumbRow" />
                    </div>

                    {/* Project title and subtitle */}
                    <div className="prj-cardHeadText">
                      <div className="prj-cardTitle">{title}</div>
                      <div className="prj-cardSub">{subtitle}</div>
                    </div>
                  </div>

                  {/* External/open button */}
                  <button
                    className="prj-externalBtn"
                    title="Open"
                    onClick={(e) => {
                      e.stopPropagation(); // stop parent click
                      openProject(p);
                    }}
                  >
                    <ExternalLinkIcon />
                  </button>
                </div>

                {/* Bottom part of project card */}
                <div className="prj-cardBottom">
                  {/* Project manager info */}
                  <div className="prj-manager">
                    {p.managerAvatar ? (
                      <img
                        className="prj-avatarImg"
                        src={p.managerAvatar}
                        alt={managerName}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="prj-avatarImg prj-avatarFallback"
                      style={{ display: p.managerAvatar ? "none" : "flex" }}
                      aria-hidden="true"
                    >
                      {managerName ? managerName.charAt(0).toUpperCase() : "?"}
                    </div>

                    <div className="prj-managerText">
                      <div className="prj-managerName">{managerName}</div>
                      <div className="prj-managerRole">Project Manager</div>
                    </div>
                  </div>

                  {/* Right side meta info */}
                  <div className="prj-rightMeta">
                    <div className="prj-date">
                      {p.start_date || p.startDate || ""}
                    </div>

                    {/* Show project status if available */}
                    {p.status ? (
                      <div
                        className={`prj-status ${
                          String(p.status).toLowerCase() === "completed"
                            ? "done"
                            : "upcoming"
                        }`}
                      >
                        {p.status}
                      </div>
                    ) : (
                      <div className="prj-statusSpacer" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Message when there are no projects */}
          {!loading && !filtered.length && (
            <div style={{ padding: 10 }}>No projects found.</div>
          )}
        </div>
      </div>

      {/* New Project modal */}
      <BaseModal
        title="New Project"
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      >
        {/* Form for creating project */}
        <form className="prj-form" onSubmit={handleCreateProject}>
          {/* Project name label */}
          <label className="prj-label">Project Name</label>

          {/* Project name input */}
          <input
            className={`prj-input ${fieldErrors.name ? "prj-inputError" : ""}`}
            placeholder="Enter your project name"
            value={form.name}
            onChange={(e) => {
              // Update form state
              setForm((s) => ({ ...s, name: e.target.value }));

              // Remove name error once user starts typing
              if (fieldErrors.name) clearFieldError("name");
            }}
          />

          {/* Show name field validation error */}
          {fieldErrors.name && (
            <div className="prj-fieldError">{fieldErrors.name}</div>
          )}

          {/* Description label */}
          <label className="prj-label">Description</label>

          {/* Description input */}
          <textarea
            className={`prj-textarea ${
              fieldErrors.description ? "prj-inputError" : ""
            }`}
            placeholder="Write a description"
            value={form.description}
            onChange={(e) => {
              // Update form state
              setForm((s) => ({ ...s, description: e.target.value }));

              // Remove description error once user starts typing
              if (fieldErrors.description) clearFieldError("description");
            }}
          />

          {/* Show description validation error */}
          {fieldErrors.description && (
            <div className="prj-fieldError">{fieldErrors.description}</div>
          )}

          {/* Project member label */}
          <label className="prj-label">Project Members</label>

          {/* Button field to open member picker modal */}
          <button
            type="button"
            className={`prj-assigneeField ${
              form.managerId ? "prj-hasValue" : ""
            } ${fieldErrors.managerId ? "prj-inputError" : ""}`}
            onClick={() => setMemberPickerOpen(true)}
          >
            <span className="prj-assigneeValue">
              {selectedMember?.name || "Choose a person"}
            </span>
            <img className="prj-assigneeIcon" src={dropDownIcon} alt="" />
          </button>

          {/* Show manager field validation error */}
          {fieldErrors.managerId && (
            <div className="prj-fieldError">{fieldErrors.managerId}</div>
          )}



          {/* Submit button */}
          <button className="prj-primaryBtn prj-primaryBtnFull" type="submit">
            Create Project
          </button>
        </form>

        {/* Member picker modal inside project modal */}
        <MemberPickerModal
          open={memberPickerOpen}
          onClose={() => setMemberPickerOpen(false)}
          people={people}
          value={form.managerId}
          onConfirm={(id) => {
            // Save selected member id into form
            setForm((s) => ({ ...s, managerId: String(id) }));

            // Remove manager validation error
            if (fieldErrors.managerId) clearFieldError("managerId");
          }}
        />
      </BaseModal>

    </div>
  );
}
