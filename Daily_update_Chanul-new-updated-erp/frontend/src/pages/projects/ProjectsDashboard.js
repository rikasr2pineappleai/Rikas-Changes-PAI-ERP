import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Projects.css";

import newProjectIcon from "../../assets/icons/new_project_plus.png";
import BaseModal from "../../modals/projects/BaseModel";

import searchIcon from "../../assets/icons/searchicon.png";
import filterIconPng from "../../assets/icons/filterricon.png";

// ✅ NEW: your dropdown icon
import dropDownIcon from "../../assets/icons/DropDownIcon.png";

import {
  fetchProjectsDashboard,
  createProject as createProjectAPI,
} from "../../integration/projectAPI";

import employeeAPI from "../../integration/employeeAPI";

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

/** ✅ Member Picker Modal (Search + checkbox like screenshot) */
function MemberPickerModal({ open, onClose, people, value, onConfirm }) {
  const [q, setQ] = useState("");
  const [temp, setTemp] = useState("");

  useEffect(() => {
    if (open) {
      setQ("");
      setTemp(value ? String(value) : "");
    }
  }, [open, value]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return people || [];
    return (people || []).filter((p) =>
      String(p.name || "")
        .toLowerCase()
        .includes(s),
    );
  }, [q, people]);

  if (!open) return null;

  return (
    <div className="prj-modalOverlay" onMouseDown={onClose}>
      <div className="prj-memberModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="prj-memberHeader">
          <div className="prj-memberTitle">Project Members</div>
          <button className="prj-iconBtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="prj-memberBody">
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

          <div className="prj-memberList">
            {filtered.map((p) => {
              const active = String(p.id) === String(temp);
              return (
                <div
                  key={p.id}
                  className={`prj-memberRow ${active ? "active" : ""}`}
                  onClick={() => setTemp(String(p.id))}
                  role="button"
                  tabIndex={0}
                >
                  {/* ✅ Custom checkbox */}
                  <div className={`prj-cb ${active ? "checked" : ""}`} />

                  <div className="prj-memberAvatar" aria-hidden="true" />

                  <div className="prj-memberInfo">
                    <div className="prj-memberName">{p.name}</div>
                    <div className="prj-memberRole">Employee</div>
                  </div>
                </div>
              );
            })}

            {!filtered.length && (
              <div className="prj-memberEmpty">No members found.</div>
            )}
          </div>

          <button
            type="button"
            className="prj-primaryBtn prj-primaryBtnFull"
            disabled={!temp}
            style={{
              opacity: !temp ? 0.6 : 1,
              cursor: !temp ? "not-allowed" : "pointer",
            }}
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

export default function ProjectsDashboard() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    managerId: "",
  });

  const [projectList, setProjectList] = useState([]);
  const [people, setPeople] = useState([]);

  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    assignedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ ALL fields errors
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    description: "",
    managerId: "",
  });

  const clearFieldError = (key) =>
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));

  // ✅ Member picker open
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);

  useEffect(() => {
    loadProjects();
    loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchProjectsDashboard();

      if (res?.success) {
        const list = res.projects || [];
        setProjectList(list);

        const totalProjects =
          res?.stats?.totalProjects ??
          res?.stats?.total ??
          res?.stats?.total_project ??
          list.length;

        const totalTasks =
          res?.stats?.totalTasks ??
          res?.stats?.total_tasks ??
          res?.stats?.tasks_total ??
          0;

        const assignedTasks =
          res?.stats?.assignedTasks ??
          res?.stats?.assigned_tasks ??
          res?.stats?.tasks_assigned ??
          0;

        const completedTasks =
          res?.stats?.completedTasks ??
          res?.stats?.completed_tasks ??
          res?.stats?.tasks_completed ??
          0;

        const overdueTasks =
          res?.stats?.overdueTasks ??
          res?.stats?.overdue_tasks ??
          res?.stats?.tasks_overdue ??
          0;

        setDashboardStats({
          totalProjects,
          totalTasks,
          assignedTasks,
          completedTasks,
          overdueTasks,
        });
      } else {
        setError(res?.message || "Failed to load projects");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    try {
      const res = await employeeAPI.getAllEmployees(1, 200);
      const list =
        res?.data?.employees || res?.employees || res?.data || res?.rows || [];

      const normalized = (list || []).map((u) => ({
        id: u.id,
        name:
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
          u.fullname ||
          u.email ||
          `User ${u.id}`,
      }));

      setPeople(normalized);
    } catch (e) {
      console.warn("People load failed:", e?.message);
      setPeople([]);
    }
  };

  const openProject = (p) => navigate(`/projects/${p.id}`);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projectList;

    return projectList.filter((p) => {
      const title = (p.project_name || p.title || "").toLowerCase();
      const sub = (p.description || p.subtitle || "").toLowerCase();
      const mgr = (p.managerName || "").toLowerCase();
      return title.includes(q) || sub.includes(q) || mgr.includes(q);
    });
  }, [search, projectList]);

  // ✅ validate ALL fields
  const validateProjectForm = () => {
    const next = { name: "", description: "", managerId: "" };

    if (!form.name.trim()) next.name = "Project name is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.managerId) next.managerId = "Please select a project member.";

    setFieldErrors(next);
    return !next.name && !next.description && !next.managerId;
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateProjectForm()) return;

    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        project_type: "internal",
        status: "planning",
        start_date: null,
        end_date: null,
        managerId: Number(form.managerId),
      };

      const res = await createProjectAPI(body);

      if (res?.success) {
        setNewProjectOpen(false);
        setForm({ name: "", description: "", managerId: "" });
        setFieldErrors({ name: "", description: "", managerId: "" });
        await loadProjects();
      } else {
        setError(res?.message || "Create project failed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Server error");
    }
  };

  // ✅ Selected member preview (nice display)
  const selectedMember = useMemo(() => {
    if (!form.managerId) return null;
    return people.find((p) => String(p.id) === String(form.managerId)) || null;
  }, [form.managerId, people]);

  return (
    <div className="prj-page">
      <div className="prj-topCard">
        <div className="prj-topRow">
          <div className="prj-pageTitle">Projects</div>

          <button
            type="button"
            className="prj-newProjectBtn"
            onClick={() => {
              setNewProjectOpen(true);
              setError("");
              setFieldErrors({ name: "", description: "", managerId: "" });
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

      {loading && <div style={{ padding: 8 }}>Loading projects...</div>}
      {error && <div style={{ padding: 8, color: "red" }}>{error}</div>}

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

      <div className="prj-sectionCard">
        <div className="prj-sectionHeader">
          <div className="prj-sectionTitle">All Projects</div>

          <div className="prj-toolbar">
            <button className="prj-filterBtn" type="button" aria-label="Filter">
              <img src={filterIconPng} alt="" aria-hidden="true" />
            </button>

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

        <div className="prj-grid">
          {filtered.map((p, idx) => {
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
                <div className="prj-cardTop">
                  <div className="prj-cardHead">
                    <div className="prj-cardThumb" aria-hidden="true">
                      <div className="prj-thumbRow" />
                      <div className="prj-thumbRow" />
                    </div>

                    <div className="prj-cardHeadText">
                      <div className="prj-cardTitle">{title}</div>
                      <div className="prj-cardSub">{subtitle}</div>
                    </div>
                  </div>

                  <button
                    className="prj-externalBtn"
                    title="Open"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProject(p);
                    }}
                  >
                    <ExternalLinkIcon />
                  </button>
                </div>

                <div className="prj-cardBottom">
                  <div className="prj-manager">
                    <div className="prj-avatarImg" aria-hidden="true" />
                    <div className="prj-managerText">
                      <div className="prj-managerName">{managerName}</div>
                      <div className="prj-managerRole">Project Manager</div>
                    </div>
                  </div>

                  <div className="prj-rightMeta">
                    <div className="prj-date">
                      {p.start_date || p.startDate || ""}
                    </div>
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

          {!loading && !filtered.length && (
            <div style={{ padding: 10 }}>No projects found.</div>
          )}
        </div>
      </div>

      <BaseModal
        title="New Project"
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
      >
        <form className="prj-form" onSubmit={handleCreateProject}>
          <label className="prj-label">Project Name</label>
          <input
            className={`prj-input ${fieldErrors.name ? "prj-inputError" : ""}`}
            placeholder="Enter your project name"
            value={form.name}
            onChange={(e) => {
              setForm((s) => ({ ...s, name: e.target.value }));
              if (fieldErrors.name) clearFieldError("name");
            }}
          />
          {fieldErrors.name && (
            <div className="prj-fieldError">{fieldErrors.name}</div>
          )}

          <label className="prj-label">Description</label>
          <textarea
            className={`prj-textarea ${
              fieldErrors.description ? "prj-inputError" : ""
            }`}
            placeholder="Write a description"
            value={form.description}
            onChange={(e) => {
              setForm((s) => ({ ...s, description: e.target.value }));
              if (fieldErrors.description) clearFieldError("description");
            }}
          />
          {fieldErrors.description && (
            <div className="prj-fieldError">{fieldErrors.description}</div>
          )}

          <label className="prj-label">Project Members</label>

          {/* ✅ Instead of <select>, use clickable field that opens modal */}
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

          {fieldErrors.managerId && (
            <div className="prj-fieldError">{fieldErrors.managerId}</div>
          )}

          {/* ✅ Selected member preview */}
          {selectedMember && (
            <div className="prj-selectedMember">
              <div className="prj-selectedAvatar" aria-hidden="true" />
              <div className="prj-selectedInfo">
                <div className="prj-selectedName">{selectedMember.name}</div>
                <div className="prj-selectedRole">Selected Member</div>
              </div>
              <button
                type="button"
                className="prj-selectedClear"
                onClick={() => setForm((s) => ({ ...s, managerId: "" }))}
                aria-label="Remove selected member"
                title="Remove"
              >
                ×
              </button>
            </div>
          )}

          <button className="prj-primaryBtn prj-primaryBtnFull" type="submit">
            Create Project
          </button>
        </form>

        {/* ✅ Member picker modal */}
        <MemberPickerModal
          open={memberPickerOpen}
          onClose={() => setMemberPickerOpen(false)}
          people={people}
          value={form.managerId}
          onConfirm={(id) => {
            setForm((s) => ({ ...s, managerId: String(id) }));
            if (fieldErrors.managerId) clearFieldError("managerId");
          }}
        />
      </BaseModal>
    </div>
  );
}