import React, { useEffect, useMemo, useState } from "react";
import "./TaskPage.css";
import { fetchMyTasks, moveTaskByEmployee } from "../../integration/taskAPI";
import userActionIcon from "../../assets/icons/User_Action.png";
import bulletIcon from "../../assets/icons/Bullet_Icon.png";
import calendarIcon from "../../assets/icons/calender_icon.png";

const COLUMN_CONFIG = [
  { key: "to_do", title: "To Do" },
  { key: "in_progress", title: "In Progress" },
  { key: "review", title: "Review" },
  { key: "cto_review", title: "CTO Review" },
  { key: "done", title: "Completed" },
];

const NEXT_STATUS = {
  to_do: "in_progress",
  in_progress: "review",
  review: "cto_review",
  cto_review: "done",
};

const ALLOWED_NEXT_STATUSES = {
  to_do: ["in_progress"],
  in_progress: ["review"],
  review: ["cto_review"],
  cto_review: ["done"],
  done: [],
};

const NEXT_BUTTON_LABEL = {
  to_do: "Move to In Progress",
  in_progress: "Move to Review",
  review: "Move to CTO Review",
  cto_review: "Completed",
};

const STATUS_LABELS = {
  to_do: "To Do",
  in_progress: "In Progress",
  review: "Review",
  cto_review: "CTO Review",
  done: "Completed",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const normalizeStatus = (status) => {
  if (!status) return "to_do";

  const value = String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (value === "todo" || value === "to_do" || value === "pending") {
    return "to_do";
  }

  if (
    value === "inprogress" ||
    value === "in_progress" ||
    value === "progress"
  ) {
    return "in_progress";
  }

  if (value === "review" || value === "in_review" || value === "testing") {
    return "review";
  }

  if (value === "cto_review" || value === "blocked") {
    return "cto_review";
  }

  if (value === "complete" || value === "completed" || value === "done") {
    return "done";
  }

  return "to_do";
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }, []);

  const currentUserId = currentUser?.id;

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      if (!currentUserId) {
        setError("User not found. Please login again.");
        setTasks([]);
        return;
      }

      const res = await fetchMyTasks(currentUserId);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to load tasks");
      }

      const normalizedTasks = (res.tasks || []).map((task) => ({
        ...task,
        status: normalizeStatus(task.status),
      }));

      setTasks(normalizedTasks);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedTasks = useMemo(() => {
    const grouped = {
      to_do: [],
      in_progress: [],
      review: [],
      cto_review: [],
      done: [],
    };

    (tasks || []).forEach((task) => {
      const normalized = normalizeStatus(task.status);
      grouped[normalized].push({
        ...task,
        status: normalized,
      });
    });

    return grouped;
  }, [tasks]);

  const canMoveNext = (task) => {
    const status = normalizeStatus(task?.status);
    const allowed = ALLOWED_NEXT_STATUSES[status];
    return Array.isArray(allowed) && allowed.length > 0;
  };

  const handleMoveNext = async (task, targetStatus) => {
    try {
      setActionLoading(true);
      setError("");

      const currentStatus = normalizeStatus(task.status);
      const allowedStatuses = ALLOWED_NEXT_STATUSES[currentStatus] || [];
      const nextStatus = targetStatus || allowedStatuses[0];

      if (!nextStatus) {
        throw new Error("This task cannot be moved");
      }

      const res = await moveTaskByEmployee(task.id, currentUserId, nextStatus);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to update task status");
      }

      const updatedTask = {
        ...res.task,
        status: normalizeStatus(res.task?.status),
      };

      setTasks((prev) =>
        prev.map((item) =>
          item.id === updatedTask.id ? { ...item, ...updatedTask } : item,
        ),
      );

      setSelectedTask((prev) =>
        prev && prev.id === updatedTask.id ? { ...prev, ...updatedTask } : prev,
      );
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to update task status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDragStart = (task) => {
    if (!canMoveNext(task)) return;

    setIsDragging(true);
    setDraggedTask({
      ...task,
      status: normalizeStatus(task.status),
    });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn("");

    setTimeout(() => {
      setIsDragging(false);
    }, 120);
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();

    if (!draggedTask) return;

    const currentStatus = normalizeStatus(draggedTask.status);
    const allowedNext = NEXT_STATUS[currentStatus];

    if (allowedNext === columnKey) {
      setDragOverColumn(columnKey);
    } else {
      setDragOverColumn("");
    }
  };

  const handleDrop = async (e, columnKey) => {
    e.preventDefault();

    if (!draggedTask) return;

    const currentStatus = normalizeStatus(draggedTask.status);
    const allowedNext = NEXT_STATUS[currentStatus];

    setDragOverColumn("");

    if (allowedNext !== columnKey) {
      setDraggedTask(null);
      return;
    }

    await handleMoveNext(draggedTask, columnKey);
    setDraggedTask(null);
  };

  return (
    <div className="taskpage-wrap">
      <div className="taskpage-headerBox">
        <h1 className="taskpage-title">Tasks</h1>
      </div>

      {error ? <div className="taskpage-error">{error}</div> : null}

      {loading ? (
        <div className="taskpage-loading">Loading tasks...</div>
      ) : (
        <div className="taskpage-board">
          {COLUMN_CONFIG.map((column) => {
            const columnTasks = groupedTasks[column.key] || [];

            return (
              <div
                className={`taskpage-column ${
                  dragOverColumn === column.key
                    ? "taskpage-columnDropActive"
                    : ""
                }`}
                key={column.key}
                onDragOver={(e) => handleDragOver(e, column.key)}
                onDrop={(e) => handleDrop(e, column.key)}
              >
                <div className="taskpage-columnHead">
                  <span className="taskpage-columnCount">
                    {columnTasks.length}
                  </span>
                  <span className="taskpage-columnTitle">{column.title}</span>
                </div>

                <div className="taskpage-columnBody">
                  {columnTasks.length === 0 ? (
                    <div className="taskpage-emptyCard">No tasks</div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`taskpage-card ${
                          draggedTask?.id === task.id
                            ? "taskpage-cardDragging"
                            : ""
                        }`}
                        draggable={canMoveNext(task)}
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          if (isDragging) return;

                          setSelectedTask({
                            ...task,
                            status: normalizeStatus(task.status),
                          });
                        }}
                      >
                        <div className="taskpage-cardTop">
                          <div className="taskpage-cardTopLeft">
                            <span className="taskpage-projectDot" />
                            <span className="taskpage-projectName">
                              {task.project_name || "Project"}
                            </span>
                          </div>

                          <img
                            src={userActionIcon}
                            alt="Open task"
                            className="taskpage-cardActionIcon"
                          />
                        </div>

                        <div className="taskpage-cardTitle">{task.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask ? (
        <div
          className="taskpage-modalOverlay"
          onClick={() => {
            if (!actionLoading) setSelectedTask(null);
          }}
        >
          <div
            className="taskpage-modal taskpage-modalNew"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="taskpage-modalHeaderNew">
              <span className="taskpage-projectBadge">
                {selectedTask.project_name || "SMS"}
              </span>
              <span className="taskpage-headerDivider">/</span>
              <span className="taskpage-headerLabel">Task overview</span>
            </div>

            <div className="taskpage-modalTitleRow">
              <img src={bulletIcon} alt="" className="taskpage-statusIcon" />
              <h2 className="taskpage-modalTitle">{selectedTask.title}</h2>
            </div>

            <div className="taskpage-modalBody">
              <div className="taskpage-modalLeft">
                <label className="taskpage-sectionLabel">Description</label>
                <div className="taskpage-descriptionBox">
                  {selectedTask.description || "No description provided."}
                </div>
              </div>

              <div className="taskpage-modalRight">
                <div className="taskpage-detailItem">
                  <label>Status</label>
                  <div
                    className={`taskpage-statusBadge status-${normalizeStatus(
                      selectedTask.status,
                    )}`}
                  >
                    <span className="taskpage-statusDot" />
                    {STATUS_LABELS[normalizeStatus(selectedTask.status)] ||
                      "To Do"}
                  </div>
                </div>

                <div className="taskpage-detailItem">
                  <label>Priority</label>
                  <div className="taskpage-priorityButtons">
                    {["high", "medium", "low"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`taskpage-priorityBtn ${
                          selectedTask.priority === p ? "active" : ""
                        }`}
                        disabled
                      >
                        {PRIORITY_LABELS[p] || p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="taskpage-datesRow">
                  <div className="taskpage-detailItem">
                    <label>Start Date</label>
                    <div className="taskpage-dateValue">
                      <img
                        src={calendarIcon}
                        alt=""
                        className="taskpage-calendarIcon"
                      />
                      {formatDate(selectedTask.assigned_at)}
                    </div>
                  </div>
                  <div className="taskpage-detailItem">
                    <label>Due Date</label>
                    <div className="taskpage-dateValue">
                      <img
                        src={calendarIcon}
                        alt=""
                        className="taskpage-calendarIcon"
                      />
                      {formatDate(selectedTask.deadline)}
                    </div>
                  </div>
                </div>

                <div className="taskpage-detailItem">
                  <label>Assignee</label>
                  <div className="taskpage-assigneeBox">
                    {selectedTask.assignee_profile_pic ? (
                      <img
                        src={selectedTask.assignee_profile_pic}
                        alt=""
                        className="taskpage-assigneeAvatar"
                      />
                    ) : (
                      <div className="taskpage-assigneeAvatar taskpage-assigneeAvatarEmpty" />
                    )}
                    <div className="taskpage-assigneeInfo">
                      <div className="taskpage-assigneeName">
                        {selectedTask.assignee_name || "—"}
                      </div>
                      <div className="taskpage-assigneeRole">
                        {selectedTask.assignee_designation || "Employee"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="taskpage-modalFooterNew">
              <button
                type="button"
                className="taskpage-closeBtnNew"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>

              {canMoveNext(selectedTask) && (
                <button
                  type="button"
                  className="taskpage-completeBtn"
                  onClick={() => handleMoveNext(selectedTask)}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Updating..."
                    : NEXT_BUTTON_LABEL[normalizeStatus(selectedTask.status)]}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}