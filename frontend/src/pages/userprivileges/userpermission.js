import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import deleteIcon from "../../assets/icons/delete_white.png";
import editIcon from "../../assets/icons/edit_white.png";
import viewIcon from "../../assets/icons/permision.png";
import toggleIcon from "../../assets/icons/toggle.png";
import boxIcon from "../../assets/icons/box.png";
import backIcon from "../../assets/icons/green_left_arrow.png";  
import "./privilege.css";

export default function Userpermission({ activeTab }) {
  const [roles, setRoles] = useState([
    { id: "R01", role: "CEO" },
    { id: "R02", role: "CTO" },
    { id: "R03", role: "COO" },
    { id: "R04", role: "CHOO" },
    { id: "R05", role: "CHROO" },
    { id: "R06", role: "CMOO" },
    { id: "R07", role: "CFOO" },
    { id: "R08", role: "PM" },
    { id: "R09", role: "Intern" },
  ]);

  const [newRole, setNewRole] = useState("");
  const [editId, setEditId] = useState("");
  const [editRole, setEditRole] = useState("");
  const [deleteId, setDeleteId] = useState("");

  const [viewRole, setViewRole] = useState(null);

  const [toast, setToast] = useState({ show: false, type: "success", msg: "" });
  const toastTimer = useRef(null);

  const modules = useMemo(
    () => [
      "Employee",
      "Leave Management",
      "Performance",
      "Documents",
      "Reports",
      "Analytics",
    ],
    []
  );

  const actions = useMemo(() => ["View", "Edit", "Delete", "Approve"], []);

  const buildEmpty = () => {
    const obj = {};
    modules.forEach((m) => {
      obj[m] = { View: false, Edit: false, Delete: false, Approve: false };
    });
    return obj;
  };

  const [allPermissions, setAllPermissions] = useState(() => ({
    R01: buildEmpty(),
    R02: buildEmpty(),
    R03: buildEmpty(),
    R04: buildEmpty(),
    R05: buildEmpty(),
    R06: buildEmpty(),
    R07: buildEmpty(),
    R08: buildEmpty(),
    R09: buildEmpty(),
  }));

  const [permissions, setPermissions] = useState(() => buildEmpty());

  const showToast = (type, msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, type, msg });
    toastTimer.current = window.setTimeout(() => {
      setToast({ show: false, type: "", msg: "" });
      toastTimer.current = null;
    }, 2200);
  };

  const onAddRole = () => {
    const name = newRole.trim();
    if (!name) return;

    const maxNum = roles.reduce((mx, r) => {
      const n = parseInt(String(r.id).replace(/\D/g, ""), 10);
      return Number.isFinite(n) ? Math.max(mx, n) : mx;
    }, 0);

    const nextId = `R${String(maxNum + 1).padStart(2, "0")}`;

    setRoles((prev) => [...prev, { id: nextId, role: name }]);
    setAllPermissions((prev) => ({ ...prev, [nextId]: buildEmpty() }));

    setNewRole("");
    showToast("success", "Your role was submitted successfully");
  };

  const onStartEdit = (r) => {
    setEditId(r.id);
    setEditRole(r.role);
  };

  const onUpdateRole = () => {
    const name = editRole.trim();
    if (!name || !editId) return;

    setRoles((prev) => prev.map((r) => (r.id === editId ? { ...r, role: name } : r)));
    setEditId("");
    setEditRole("");
    showToast("success", "Your role was updated successfully");
  };

  const onDeleteRole = () => {
    if (!deleteId) return;

    setRoles((prev) => prev.filter((r) => r.id !== deleteId));
    setAllPermissions((prev) => {
      const next = { ...prev };
      delete next[deleteId];
      return next;
    });

    setDeleteId("");
    showToast("danger", "Your role details was successfully deleted");
  };

  const togglePermission = (moduleName, actionName) => {
    setPermissions((prev) => {
      const nextValue = !prev?.[moduleName]?.[actionName];
      showToast("success", `${actionName} permission ${nextValue ? "enabled" : "disabled"} for ${moduleName}`);
      return { ...prev, [moduleName]: { ...prev[moduleName], [actionName]: nextValue } };
    });
  };

  const toggleRolePermission = (roleId, moduleName, actionName) => {
    setAllPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [moduleName]: {
          ...prev[roleId]?.[moduleName],
          [actionName]: !prev?.[roleId]?.[moduleName]?.[actionName],
        },
      },
    }));
  };

  const toggleRoleRow = (roleId, moduleName) => {
    setAllPermissions((prev) => {
      const current = prev?.[roleId]?.[moduleName] || {};
      const rowAllChecked = actions.every((a) => !!current[a]);
      const nextRow = {};
      actions.forEach((a) => (nextRow[a] = !rowAllChecked));
      return { ...prev, [roleId]: { ...prev[roleId], [moduleName]: nextRow } };
    });
  };

  const saveRolePermissionsToServer = async (roleId, perms) => {
    // await api.patch(`/roles/${roleId}/permissions`, { permissions: perms });
  };

  // ── Permission screen (full-page) ─────────────────────────────────────────
  if (viewRole) {
    return (
      <RolePermissionsScreen
        role={viewRole}
        modules={modules}
        actions={actions}
        permissions={allPermissions[viewRole.id] || buildEmpty()}
        onBack={() => setViewRole(null)}
        onToggle={(mod, act) => toggleRolePermission(viewRole.id, mod, act)}
        onToggleRow={(mod) => toggleRoleRow(viewRole.id, mod)}
        onAutoSave={saveRolePermissionsToServer}
      />
    );
  }

  // ── Permissions Tab ───────────────────────────────────────────────────────
  if (activeTab === "permissions") {
    return (
      <div className="priv-page-card">
        <div className="priv-permissions-header">
          <div className="priv-section-pill">
            <span className="priv-dot-green" /> User Permissions
          </div>
        </div>

        {/* ── Desktop table ── */}
        <div className="priv-table-scroll">
          <table className="priv-table">
            <thead>
              <tr>
                <th>Modules</th>
                {actions.map((a) => (
                  <th key={a} className="center">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m}>
                  <td className="module-cell">
                    <img src={toggleIcon} alt="toggle" className="priv-eye-icon-img" />
                    {m}
                    </td>
                  {actions.map((a) => (
                    <td key={a} className="center">
                      <div
  role="button"
  tabIndex={0}
  onClick={() => togglePermission(m, a)}
  onKeyDown={(e) => (e.key === "Enter" ? togglePermission(m, a) : null)}
  className={`perm-checkbox ${permissions?.[m]?.[a] ? "is-checked" : ""}`}
>
  {permissions?.[m]?.[a] && (
    <img src={boxIcon} alt="checked" width="12" height="12" />
  )}
</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile card list ── */}
        <div className="priv-card-list">
          {modules.map((m) => (
            <div key={m} className="priv-perm-card">
              <div className="priv-perm-card__header">
                <span className="priv-eye-icon" style={{ borderColor: "#555", color: "#ccc" }}>⦿</span>
                {m}
              </div>
              <div className="priv-perm-card__body">
                {actions.map((a) => (
                  <div key={a} className="priv-perm-card__action-row">
                    <span className="priv-perm-card__action-label">{a}</span>
                    <input
                      type="checkbox"
                      checked={!!permissions?.[m]?.[a]}
                      onChange={() => togglePermission(m, a)}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#19b56a" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {toast.show && (
          <Toast
            type={toast.type}
            msg={toast.msg}
            onClose={() => setToast({ show: false, type: "", msg: "" })}
          />
        )}
      </div>
    );
  }

  // ── Roles Tab ─────────────────────────────────────────────────────────────
  return (
    <div className="priv-page-card">
      <div className="priv-top-row">
        {/* Left: Add / Edit form */}
        <div className="priv-col">
          {!editId ? (
            <>
              <div className="priv-box-title">New Role</div>
              <div className="priv-form-row">
                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="Enter new role"
                  className="priv-input"
                />
                <button type="button" onClick={onAddRole} className="priv-btn-green">
                  Add Role
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="priv-box-title">Update your Role</div>
              <div className="priv-form-row">
                <input value={editRole} onChange={(e) => setEditRole(e.target.value)} className="priv-input" />
                <button type="button" onClick={onUpdateRole} className="priv-btn-green">
                  Change
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Roles table */}
        <div className="priv-col priv-col--table">
          <div className="priv-box-title">Current roles</div>

          {/* ── Desktop table ── */}
          <div className="priv-table-wrap">
            <table className="priv-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Role</th>
                  <th className="center">Action</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.role}</td>
                    <td className="center">
                      <button
                        type="button"
                        className="priv-icon-btn priv-icon-btn--view"
                        title="view permissions"
                        onClick={() => setViewRole(r)}
                      >
                        <img src={viewIcon} alt="view" />
                      </button>
                      <button
                        type="button"
                        className="priv-icon-btn priv-icon-btn--edit"
                        title="edit"
                        onClick={() => onStartEdit(r)}
                      >
                        <img src={editIcon} alt="edit" />
                      </button>
                      <button
                        type="button"
                        className="priv-icon-btn priv-icon-btn--delete"
                        title="delete"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                      >
                        <img src={deleteIcon} alt="delete" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile card list ── */}
          <div className="priv-card-list">
            {roles.map((r) => (
              <div key={r.id} className="priv-role-card">
                <div className="priv-role-card__info">
                  <span className="priv-role-card__id">{r.id}</span>
                  <span className="priv-role-card__name">{r.role}</span>
                </div>
                <div className="priv-role-card__actions">
                  <button
                    type="button"
                    className="priv-icon-btn priv-icon-btn--view"
                    title="view permissions"
                    onClick={() => setViewRole(r)}
                  >
                    <img src={viewIcon} alt="view" />
                  </button>
                  <button
                    type="button"
                    className="priv-icon-btn priv-icon-btn--edit"
                    title="edit"
                    onClick={() => onStartEdit(r)}
                  >
                    <img src={editIcon} alt="edit" />
                  </button>
                  <button
                    type="button"
                    className="priv-icon-btn priv-icon-btn--delete"
                    title="delete"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                  >
                    <img src={deleteIcon} alt="delete" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal open={!!deleteId} onClose={() => setDeleteId("")} onConfirm={onDeleteRole} />

      {toast.show && (
        <Toast
          type={toast.type}
          msg={toast.msg}
          onClose={() => setToast({ show: false, type: "", msg: "" })}
        />
      )}
    </div>
  );
}

/* ── Permission screen ────────────────────────────────────────────────────── */
function RolePermissionsScreen({ role, modules, actions, permissions, onToggle, onToggleRow, onBack, onAutoSave }) {
  const saveTimer = useRef(null);
  const latestPermsRef = useRef(permissions);

  useEffect(() => {
    latestPermsRef.current = permissions;
  }, [permissions]);

  const scheduleSave = () => {
    if (!onAutoSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onAutoSave(role.id, latestPermsRef.current);
    }, 250);
  };

  const handleToggleCell = (m, a) => {
    onToggle?.(m, a);
    scheduleSave();
  };

  const handleToggleRow = (m) => {
    onToggleRow?.(m);
    scheduleSave();
  };

  return (
    <div className="perm-page">
      <div className="perm-header">
        <button
  type="button"
  className="perm-back-btn"
  onClick={onBack}
  title="Back"
>
  <img src={backIcon} alt="back" className="perm-back-icon" />
</button>
        <div className="perm-title-wrap">
          <div className="perm-title">User Permissions — {role.role}</div>
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="perm-table-wrap">
        <div className="priv-table-scroll">
          <table className="perm-table">
            <thead>
              <tr>
                <th className="left"> Modules</th>
                {actions.map((a) => (
                  <th key={a} className="center">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => {
                const rowAllChecked = actions.every((a) => !!permissions?.[m]?.[a]);
                return (
                  <tr key={m}>
                    <td className="perm-module">
                      <div
                        className="perm-module-click"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleToggleRow(m)}
                        onKeyDown={(e) => (e.key === "Enter" ? handleToggleRow(m) : null)}
                        title="Toggle all permissions"
                      >
                        <div className={`perm-switch ${rowAllChecked ? "is-active" : ""}`}>
  <span className="perm-switch__thumb" />
</div>
                    <span>{m}</span>
                      </div>
                    </td>
                    {actions.map((a) => {
                      const checked = !!permissions?.[m]?.[a];
                      return (
                        <td key={a} className="center">
                          <div
                            role="button"
  tabIndex={0}
  onClick={(e) => { e.stopPropagation(); handleToggleCell(m, a); }}
  onKeyDown={(e) => (e.key === "Enter" ? handleToggleCell(m, a) : null)}
  className={`perm-checkbox ${checked ? "is-checked" : ""}`}
>
  {checked && <span className="perm-tick">✓</span>}
                            
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile card list ── */}
      <div className="perm-card-list">
        {modules.map((m) => {
          const rowAllChecked = actions.every((a) => !!permissions?.[m]?.[a]);
          return (
            <div key={m} className="perm-card">
              <div className="perm-card__header">
                <div className="perm-card__module-left">
                  <div className={`perm-module-icon ${rowAllChecked ? "is-active" : ""}`} style={{ width: 28, height: 28 }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1d2a3a" }}>{m}</span>
                </div>
                <button
                  type="button"
                  className={`perm-card__toggle-all ${rowAllChecked ? "is-all" : ""}`}
                  onClick={() => handleToggleRow(m)}
                >
                  {rowAllChecked ? "Revoke All" : "Grant All"}
                </button>
              </div>
              <div className="perm-card__actions-grid">
                {actions.map((a) => {
                  const checked = !!permissions?.[m]?.[a];
                  return (
                    <div key={a} className="perm-card__action-row">
                      <span className="perm-card__action-label">{a}</span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleToggleCell(m, a)}
                        onKeyDown={(e) => (e.key === "Enter" ? handleToggleCell(m, a) : null)}
                        className={`perm-checkbox ${checked ? "is-checked" : ""}`}
                        style={{ width: 20, height: 20 }}
                      >
                        {checked && (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7l4 4 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Confirm Delete Modal ─────────────────────────────────────────────────── */
function ConfirmDeleteModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="priv-modal-overlay" onClick={onClose}>
      <div className="priv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="priv-modal__title">Are You sure want to Delete?</div>
        <div className="priv-modal__actions">
          <button type="button" className="priv-btn-small priv-btn-small--gray" onClick={onClose}>
            No
          </button>
          <button type="button" className="priv-btn-small priv-btn-small--red" onClick={onConfirm}>
            Yes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Toast ────────────────────────────────────────────────────────────────── */
function Toast({ type, msg, onClose }) {
  const isDanger = type === "danger";

  return (
    <div className={`priv-toast ${isDanger ? "danger" : "success"}`}>
      <div className="priv-toast__leftbar" />

      <div className="priv-toast__body">
        <div className="priv-toast__left">
          <span className="priv-toast__status-icon">{isDanger ? "✕" : "✓"}</span>
          <span className="priv-toast__msg">{msg}</span>
        </div>

        <button type="button" className="priv-toast__close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}