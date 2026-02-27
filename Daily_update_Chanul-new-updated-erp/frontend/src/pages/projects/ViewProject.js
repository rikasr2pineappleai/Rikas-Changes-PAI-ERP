import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Projects.css";

import searchIcon from "../../assets/icons/searchicon.png";
import closeIcon from "../../assets/icons/closeicon.png";
import filterIconPng from "../../assets/icons/filterricon.png";
import editBlueIcon from "../../assets/icons/editblueicon.png";
import calendarIcon from "../../assets/icons/calender.png";
import backGreenIcon from "../../assets/icons/BackBtn.png";
import newTaskBtn from "../../assets/icons/NewTaskIcon.png";
import dropDownIcon from "../../assets/icons/DropDownIcon.png";
import addPersonIcon from "../../assets/icons/AddPersonIcon.png";

import DeleteConfirmModal from "../../modals/DeleteConfirmModal";
import ToastModal from "../../modals/ToastModal";

import { fetchProjectById } from "../../integration/projectAPI";
import employeeAPI from "../../integration/employeeAPI";
import userAPI from "../../integration/userAPI";

import {
  fetchTasksByProject,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  deleteTask as deleteTaskAPI,
} from "../../integration/taskAPI";

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

function Modal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div className="prj-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="prj-modalHeader">
          <div className="prj-modalTitle">{title}</div>
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            <img src={closeIcon} alt="close" />
          </button>
        </div>
        <div className="prj-modalBody">{children}</div>
      </div>
    </div>
  );
}

function Badge({ variant, children }) {
  return <span className={`prj-badge ${variant}`}>{children}</span>;
}

const mapTaskFromApi = (t) => ({
  id: t.id,
  name: t.title || "Task",
  description: t.description || "",
  assignedTo: t.assigned_to ?? "",
  priority: t.priority || "medium",
  progress: t.status || "to_do",
  startDate: t.assigned_at ? String(t.assigned_at).slice(0, 10) : "—",
  dueDate: t.deadline ? String(t.deadline).slice(0, 10) : "—",
  _sortTime: t.assigned_at ? new Date(t.assigned_at).getTime() : 0,
  _sortId: t.id || 0,
  taskNo: 0,
});

/** ✅ Assignee picker modal (Search + checkbox) */
function AssigneePickerModal({ open, onClose, people, value, onConfirm }) {
  const [q, setQ] = useState("");
  const [temp, setTemp] = useState(value ? String(value) : "");

  useEffect(() => {
    if (open) {
      setQ("");
      setTemp(value ? String(value) : "");
    }
  }, [open, value]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return people;
    return (people || []).filter((p) => {
      const name = (p.name || "").toLowerCase();
      const role = (p.role || "").toLowerCase();
      return name.includes(query) || role.includes(query);
    });
  }, [q, people]);

  if (!open) return null;

  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div
        className="prj-assigneeModal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="prj-modalHeader">
          <div className="prj-modalTitle">Select Member</div>
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            <img src={closeIcon} alt="close" />
          </button>
        </div>

        <div className="prj-modalBody">
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
                  <div className={`prj-cb ${active ? "checked" : ""}`} />

                  <img
                    className="prj-assigneeAvatar"
                    src={p.profile_pic || ""}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div className="prj-assigneeText">
                    <div className="prj-assigneeName">{p.name}</div>
                    <div className="prj-assigneeRole">
                      {p.role || "Employee"}
                    </div>
                  </div>
                </div>
              );
            })}

            {!filtered?.length && (
              <div className="prj-empty" style={{ padding: 14 }}>
                {people?.length === 0 ? "No users available for assignment." : "No matching employees found."}
              </div>
            )}
          </div>

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

/** ✅ Option modal for Priority/Status */
function OptionPickerModal({
  open,
  onClose,
  title,
  options = [],
  value,
  onConfirm,
}) {
  const [temp, setTemp] = useState(value ? String(value) : "");

  useEffect(() => {
    if (open) setTemp(value ? String(value) : "");
  }, [open, value]);

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
                  </div>
                </div>
              );
            })}
          </div>

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

export default function ViewProject() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);

  // ✅ pickers
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // ✅ Members panel add modal
  const [membersAddOpen, setMembersAddOpen] = useState(false);

  // ✅ UI-only removed members (so they don't show in panel)
  const [hiddenMemberIds, setHiddenMemberIds] = useState([]);

  const [taskForm, setTaskForm] = useState({
    name: "",
    assignedTo: "",
    priority: "",
    status: "",
    startDate: "",
    dueDate: "",
    description: "",
  });

  const [taskFieldErrors, setTaskFieldErrors] = useState({
    name: "",
    assignedTo: "",
    priority: "",
    status: "",
    startDate: "",
    dueDate: "",
    description: "",
  });

  const clearTaskFieldError = (key) =>
    setTaskFieldErrors((prev) => ({ ...prev, [key]: "" }));

  useEffect(() => {
    if (projectId) {
      loadAll();
    } else {
      setError("Project ID is required");
      setProject(null);
      setTasks([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const normalizeTasksForView = (rawTasks) => {
    const mapped = (rawTasks || []).map(mapTaskFromApi);
    mapped.sort((a, b) => {
      if (b._sortTime !== a._sortTime) return b._sortTime - a._sortTime;
      return (b._sortId || 0) - (a._sortId || 0);
    });
    return mapped.map((t, idx) => ({ ...t, taskNo: idx + 1 }));
  };

  const loadAll = async () => {
    // Validate projectId before making API calls
    if (!projectId || isNaN(projectId) || parseInt(projectId) <= 0) {
      setError("Invalid project ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const pres = await fetchProjectById(projectId);
      if (!pres?.success)
        throw new Error(pres?.message || "Failed to load project");
      setProject(pres.project);

      // People list - fetch users for assignment (using first_name column from Users table)
      try {
        const response = await userAPI.getUsersForAssignment();
        const userList = response?.users || [];
        
        const normalized = userList.map((u) => ({
          id: u.id,
          name: u.name || [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || `User ${u.id}`,
          profile_pic: u.profile_pic || u.avatar || u.image || u.image_path || "",
          role: u.role || u.designation || "",
        }));
        setPeople(normalized);
        console.log(`Loaded ${normalized.length} users for assignment`);
      } catch (e) {
        console.error("Error fetching users for assignment:", e);
        
        // Fallback to employeeAPI if userAPI fails
        try {
          const eres = await employeeAPI.getAllEmployees(1, 200);
          const list =
            eres?.data?.employees ||
            eres?.employees ||
            eres?.data ||
            eres?.rows ||
            [];
          const normalized = (list || []).map((u) => ({
            id: u.id,
            name:
              [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
              u.fullname ||
              u.email ||
              `User ${u.id}`,
            profile_pic: u.profile_pic || u.avatar || u.image || u.image_path || "",
            role: u.role || u.designation || "",
          }));
          setPeople(normalized);
          console.log(`Loaded ${normalized.length} employees as fallback`);
        } catch (fallbackError) {
          console.error("Fallback employee API also failed:", fallbackError);
          setPeople([]);
        }
      }

      const tres = await fetchTasksByProject(projectId);
      if (tres?.success) {
        setTasks(normalizeTasksForView(tres.tasks));
      } else {
        setTasks([]);
      }
    } catch (err) {
      setError(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        String(t.taskNo).includes(q) ||
        String(t.id).includes(q) ||
        (t.name || "").toLowerCase().includes(q) ||
        String(t.assignedTo || "").toLowerCase().includes(q) ||
        (t.priority || "").toLowerCase().includes(q) ||
        (t.progress || "").toLowerCase().includes(q),
    );
  }, [search, tasks]);

  /** ✅ Members panel = unique assignees from tasks */
  const taskMembers = useMemo(() => {
    const ids = new Set();
    (tasks || []).forEach((t) => {
      if (t?.assignedTo) ids.add(String(t.assignedTo));
    });

    const arr = Array.from(ids)
      .filter((id) => !hiddenMemberIds.includes(String(id)))
      .map((id) => {
        const p = (people || []).find((x) => String(x.id) === String(id));
        return {
          id: String(id),
          name: p?.name || `User ${id}`,
          role: p?.role || "Employee",
          profile_pic: p?.profile_pic || "",
        };
      });

    // nice stable order by name
    arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return arr;
  }, [tasks, people, hiddenMemberIds]);

  const resetForm = () => {
    setTaskForm({
      name: "",
      assignedTo: "",
      priority: "",
      status: "",
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
    if (!taskForm.status) next.status = "Status is required.";
    if (!taskForm.startDate) next.startDate = "Start date is required.";
    if (!taskForm.dueDate) next.dueDate = "Due date is required.";
    if (!taskForm.description.trim())
      next.description = "Description is required.";

    setTaskFieldErrors(next);

    return (
      !next.name &&
      !next.assignedTo &&
      !next.priority &&
      !next.status &&
      !next.startDate &&
      !next.dueDate &&
      !next.description
    );
  };

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

  const selectedAssignee = useMemo(() => {
    if (!taskForm.assignedTo) return null;
    return people.find((p) => String(p.id) === String(taskForm.assignedTo));
  }, [taskForm.assignedTo, people]);

  const priorityOptions = useMemo(
    () => [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "critical", label: "Critical" },
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: "to_do", label: "To Do" },
      { value: "in_progress", label: "In Progress" },
      { value: "testing", label: "Testing" },
      { value: "done", label: "Done" },
      { value: "blocked", label: "Blocked" },
      { value: "pending", label: "Pending" },
    ],
    [],
  );

  const priorityLabel =
    priorityOptions.find((o) => o.value === taskForm.priority)?.label || "";
  const statusLabel =
    statusOptions.find((o) => o.value === taskForm.status)?.label || "";

  const submitNewTask = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateTaskForm()) return;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const assigned_by = user?.id;
      if (!assigned_by) {
        setError("Login required (assigned_by missing)");
        return;
      }

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

      const res = await createTaskAPI(payload);
      if (!res?.success) throw new Error(res?.message || "Create task failed");

      // if user previously hidden, show again
      setHiddenMemberIds((prev) =>
        prev.filter((x) => String(x) !== String(taskForm.assignedTo)),
      );

      setNewTaskOpen(false);
      resetForm();
      await loadAll();

      setToast({
        open: true,
        message: "Task created successfully.",
        type: "success",
      });
    } catch (err) {
      setError(err?.message || "Server error");
    }
  };

  const submitEditTask = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateTaskForm()) return;

    try {
      if (!editingTask?.id) return;

      const payload = {
        title: taskForm.name.trim(),
        description: taskForm.description.trim(),
        assigned_to: Number(taskForm.assignedTo),
        priority: taskForm.priority,
        status: taskForm.status,
        assigned_at: taskForm.startDate
          ? `${taskForm.startDate}T00:00:00.000Z`
          : null,
        deadline: taskForm.dueDate ? `${taskForm.dueDate}T00:00:00.000Z` : null,
      };

      const res = await updateTaskAPI(editingTask.id, payload);
      if (!res?.success) throw new Error(res?.message || "Update task failed");

      setHiddenMemberIds((prev) =>
        prev.filter((x) => String(x) !== String(taskForm.assignedTo)),
      );

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

  const deleteTask = async (task) => {
    setError("");
    try {
      const res = await deleteTaskAPI(task.id);
      if (!res?.success) throw new Error(res?.message || "Delete task failed");

      setConfirmDeleteTask(null);
      await loadAll();

      setToast({
        open: true,
        message: "Task deleted successfully.",
        type: "error",
      });
    } catch (err) {
      setError(err?.message || "Server error");
    }
  };

  const assigneeLabel = selectedAssignee?.name || "";

  return (
    <div className="prj-page">
      <div className="prj-topCard">
        <div className="prj-viewTopRow">
          <button
            type="button"
            className="prj-backBtn prj-backBtnIcon"
            onClick={() => navigate("/projects")}
            aria-label="Back"
          >
            <img src={backGreenIcon} alt="Back" />
          </button>

          <div className="prj-viewTitle">
            {project?.project_name || "Project"}
          </div>

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

      {loading && <div style={{ padding: 8 }}>Loading...</div>}
      {error && <div style={{ padding: 8, color: "red" }}>{error}</div>}

      <div className="prj-sectionCard">
        <div className="prj-sectionHeader">
          <div className="prj-sectionTitle">Task List</div>

          <div className="prj-toolbar">
            <button className="prj-filterBtn" type="button" aria-label="Filter">
              <img src={filterIconPng} alt="" aria-hidden="true" />
            </button>

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
                  <td data-label="Start Date">{t.startDate}</td>

                  <td data-label="Assigned">
                    <div className="prj-assignedCell">
                      <div className="prj-assignAvatarImg" aria-hidden="true" />
                      <div className="prj-assignName">
                        {people.find(
                          (p) => String(p.id) === String(t.assignedTo),
                        )?.name ||
                          t.assignedTo ||
                          "—"}
                      </div>
                    </div>
                  </td>

                  <td data-label="Due Date">{t.dueDate}</td>

                  <td data-label="Priority">
                    <Badge
                      variant={
                        t.priority === "high" || t.priority === "critical"
                          ? "high"
                          : t.priority === "low"
                          ? "low"
                          : "medium"
                      }
                    >
                      {t.priority}
                    </Badge>
                  </td>

                  <td data-label="Progress">
                    <Badge
                      variant={
                        t.progress === "done"
                          ? "done"
                          : t.progress === "in_progress"
                          ? "progress"
                          : "notstarted"
                      }
                    >
                      {t.progress}
                    </Badge>
                  </td>

                  <td data-label="Actions" className="prj-actionsCell">
                    <button
                      className="prj-actionBtn danger"
                      title="Delete"
                      onClick={() => setConfirmDeleteTask(t)}
                    >
                      <TrashIcon />
                    </button>

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

      {/* ✅ MEMBERS PANEL (Task Assignees ONLY) */}
      <div className="prj-sectionCard">
        <div className="prj-sectionHeader">
          <div className="prj-sectionTitle">Project Members</div>

          <button
            type="button"
            className="prj-memberAddBtn"
            onClick={() => {
              setMembersAddOpen(true);
              setError("");
            }}
          >
            <span className="prj-memberAddIcon">+</span> Add member
          </button>
        </div>

        <div className="prj-membersWrap">
          {(taskMembers || []).map((m) => (
            <div className="prj-memberChip" key={m.id}>
              <div className="prj-memberAvatarSm" aria-hidden="true" />
              <div className="prj-memberMeta">
                <div className="prj-memberNameSm">{m.name}</div>
                <div className="prj-memberRoleSm">{m.role || "Employee"}</div>
              </div>

              {/* ✅ Cancel/Remove */}
              <button
                className="prj-memberRemove"
                title="Remove"
                onClick={() =>
                  setHiddenMemberIds((prev) => [...prev, String(m.id)])
                }
              >
                ×
              </button>
            </div>
          ))}

          {!taskMembers?.length && (
            <div className="prj-membersEmpty">
              No members yet. Assign a task to someone or add member.
            </div>
          )}
        </div>
      </div>

      {/* ✅ Members add picker (uses employee list) */}
      <AssigneePickerModal
        open={membersAddOpen}
        onClose={() => setMembersAddOpen(false)}
        people={people}
        value={""}
        onConfirm={(id) => {
          // NOTE: purely UI panel add (doesn't change DB)
          setHiddenMemberIds((prev) => prev.filter((x) => String(x) !== String(id)));
          setToast({
            open: true,
            message: "Member added to panel (assign tasks to make it permanent).",
            type: "success",
          });
        }}
      />

      {/* ✅ New Task Modal */}
      <Modal
        title="New Task"
        open={newTaskOpen}
        onClose={() => {
          setNewTaskOpen(false);
          resetForm();
        }}
      >
        <form className="prj-form prj-formGrid" onSubmit={submitNewTask}>
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

              {selectedAssignee && (
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

          <div className="prj-twoCol">
            <div>
              <label className="prj-label">Start Date</label>
              <div className="prj-dateField">
                <input
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
                <img
                  className="prj-fieldIcon"
                  src={calendarIcon}
                  alt=""
                  aria-hidden="true"
                />
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
                <img
                  className="prj-fieldIcon"
                  src={calendarIcon}
                  alt=""
                  aria-hidden="true"
                />
              </div>
              {taskFieldErrors.dueDate && (
                <div className="prj-fieldError">{taskFieldErrors.dueDate}</div>
              )}
            </div>
          </div>

          <div className="prj-twoCol">
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
          </div>

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

          <button className="prj-primaryBtn prj-primaryBtnFull" type="submit">
            Create Task
          </button>
        </form>
      </Modal>

      {/* ✅ Update Task Modal */}
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
                <img
                  className="prj-fieldIcon"
                  src={calendarIcon}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <label className="prj-label">Due Date</label>
              <div className="prj-dateField">
                <input
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
                <img
                  className="prj-fieldIcon"
                  src={calendarIcon}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <label className="prj-label">Status</label>

          <button
            type="button"
            className={`prj-assigneeField ${
              taskFieldErrors.status ? "prj-inputError" : ""
            } ${taskForm.status ? "prj-hasValue" : ""}`}
            onClick={() => setStatusModalOpen(true)}
          >
            <span
              className={`prj-assigneePlaceholder ${statusLabel ? "has" : ""}`}
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

          <button className="prj-primaryBtn prj-primaryBtnFull" type="submit">
            Update Task
          </button>
        </form>
      </Modal>

      {/* ✅ Assignee Picker */}
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

      {/* ✅ Priority Picker */}
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

      {/* ✅ Status Picker */}
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

      {confirmDeleteTask && (
        <DeleteConfirmModal
          isOpen={!!confirmDeleteTask}
          onClose={() => setConfirmDeleteTask(null)}
          itemName="this task"
          onConfirm={() => deleteTask(confirmDeleteTask)}
        />
      )}

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