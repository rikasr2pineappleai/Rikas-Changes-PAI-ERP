import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjectsDashboard } from '../../integration/projectAPI';
import ComposeMessageModal from '../../modals/ComposeMessageModal';
import quickMessageIcon from '../../assets/icons/streamline_mail-send-email-message-solid.png';
import '../../styles/DashboardRightPanel.css';

// ─── Donut chart ───────────────────────────────────────────────────────────
function DonutChart({ segments, total }) {
  const cx = 90, cy = 90, r = 65, stroke = 30;
  const circ = 2 * Math.PI * r;

  let cumDash = 0;
  const arcs = segments.map((seg) => {
    const fraction  = total > 0 ? seg.value / total : 0;
    const dash      = fraction * circ;
    const startDash = cumDash;
    cumDash += dash;
    return { ...seg, dash, startDash, arcAngle: fraction * 360 };
  });

  // Mid-point on the ring for label placement
  const labelPos = (startDash, dash) => {
    const midFraction = (startDash + dash / 2) / circ; // 0–1
    const angle = midFraction * 360 - 90;              // degrees, start from top
    const rad   = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  return (
    <svg viewBox="0 0 180 180" className="donut-svg">
      {arcs.map((arc, i) => {
        const gap = circ - arc.dash;
        const pct = total > 0 ? Math.round((arc.value / total) * 100) : 0;
        const lp  = labelPos(arc.startDash, arc.dash);

        return (
          <g key={i}>
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${gap}`}
              strokeDashoffset={-arc.startDash}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
            {/* Only show label if segment is big enough to read */}
            {arc.arcAngle >= 18 && (
              <g>
                <text
                  x={lp.x} y={lp.y - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="donut-seg-pct"
                >
                  {pct}%
                </text>
                <text
                  x={lp.x} y={lp.y + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="donut-seg-count"
                >
                  ({String(arc.value).padStart(2, '0')})
                </text>
              </g>
            )}
          </g>
        );
      })}
      {/* Centre labels */}
      <text x={cx} y={cy - 10} textAnchor="middle" className="donut-total-label">Total</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="donut-total-value">{total}</text>
    </svg>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────
function ProgressBar({ percent, color }) {
  return (
    <div className="prog-bar-bg">
      <div
        className="prog-bar-fill"
        style={{ width: `${Math.min(Math.max(percent, 0), 100)}%`, background: color }}
      />
    </div>
  );
}

// ─── Task-based project status ─────────────────────────────────────────────
function getProjectTaskStatus(project) {
  const taskCount = Number(project?.taskCount ?? 0);
  const completedTaskCount = Number(project?.completedTaskCount ?? 0);

  if (taskCount === 0) return 'upcoming';
  if (
    project?.allTasksCompleted === true ||
    completedTaskCount >= taskCount
  ) {
    return 'completed';
  }

  return 'active';
}

// ─── Main right panel ──────────────────────────────────────────────────────
export default function DashboardRightPanel() {
  const navigate = useNavigate();
  const [projects, setProjects]   = useState([]);
  const [projectStatusCounts, setProjectStatusCounts] = useState({
    completed: 0,
    active: 0,
    upcoming: 0,
    total: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProjectsDashboard()
      .then(res => {
        const allProjects = Array.isArray(res?.projects) ? res.projects : [];
        const counts = allProjects.reduce(
          (acc, project) => {
            acc[getProjectTaskStatus(project)] += 1;
            acc.total += 1;
            return acc;
          },
          { completed: 0, active: 0, upcoming: 0, total: 0 }
        );

        setProjectStatusCounts(counts);
        setProjects(
          allProjects
            .filter(project => getProjectTaskStatus(project) === 'active')
            .slice(0, 9)
        );
      })
      .catch(err => console.error('DashboardRightPanel:', err))
      .finally(() => setLoading(false));
  }, []);

  // Use the same task-based status rules as the Projects page.
  const completedCount = projectStatusCounts.completed;
  const activeCount    = projectStatusCounts.active;
  const planningCount  = projectStatusCounts.upcoming;
  const totalCount     = projectStatusCounts.total;

  const donutSegments = [
    { label: 'Completed Projects', value: completedCount, color: '#4CAF50' },
    { label: 'Ongoing Projects',   value: activeCount,    color: '#2196F3' },
    { label: 'Pending Projects',   value: planningCount,  color: '#FFC107' },
  ];

  const progressColors = [
    '#2196F3',
    '#4CAF50',
    '#FF9800',
    '#9C27B0',
    '#00BCD4',
    '#F44336',
    '#3F51B5',
    '#8BC34A',
    '#FF5722',
  ];

  // Badge class by days remaining
  const timeLeftClass = (days) => {
    if (days === null) return 'tl-grey';
    if (days <= 3)     return 'tl-red';
    return 'tl-green';
  };

  const timeLeftLabel = (days) => {
    if (days === null)  return 'No deadline';
    if (days <  0)      return `${Math.abs(days)} Days Over`;
    if (days === 0)     return 'Due Today';
    return `${days} Days Left`;
  };

  return (
    <div className="right-panel">

      {/* ── Project Status Overview ── */}
      <section className="rp-card status-overview-card">
        <h3 className="rp-card-title">Project Status Overview</h3>
        {loading ? (
          <p className="rp-loading">Loading…</p>
        ) : (
          <div className="status-chart-row">
            <DonutChart segments={donutSegments} total={totalCount} />
            <ul className="legend-list">
              {donutSegments.map(seg => (
                <li key={seg.label} className="legend-item">
                  <span className="legend-dot" style={{ background: seg.color }} />
                  <span className="legend-label">{seg.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Project Progress ── */}
      <section className="rp-card project-progress-card">
        <h3 className="rp-card-title">Project Progress</h3>
        {loading ? (
          <p className="rp-loading">Loading…</p>
        ) : (
          <>
            <table className="pp-table">
              <thead>
                <tr>
                  <th className="pp-th pp-name-th">Project Name</th>
                  <th className="pp-th pp-prog-th">Progress</th>
                  <th className="pp-th pp-tasks-th">Tasks</th>
                  <th className="pp-th pp-time-th">Time Left</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="pp-empty">No projects found</td>
                  </tr>
                ) : (
                  projects.map((p, index) => {
                    // ✅ Exact field names from mapProjectForDashboard()
                    const done     = Number(p.completedTaskCount ?? 0);
                    const total    = Number(p.taskCount ?? 0);
                    const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
                    const daysLeft = p.totalTaskDaysLeft ?? null;

                    return (
                      <tr key={p.id} className="pp-row">
                        <td className="pp-td pp-name-cell" title={p.project_name}>
                          {p.project_name || 'Unnamed'}
                        </td>
                        <td className="pp-td pp-prog-cell">
                          <div className="pp-prog-wrap">
                            <ProgressBar
                              percent={pct}
                              color={progressColors[index % progressColors.length]}
                            />
                            <span className="pp-pct">{pct}%</span>
                          </div>
                        </td>
                        <td className="pp-td pp-tasks-cell">{done}/{total}</td>
                        <td className="pp-td pp-time-cell">
                          <span className={`tl-badge ${timeLeftClass(daysLeft)}`}>
                            {timeLeftLabel(daysLeft)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {projects.length > 0 && (
              <div className="pp-footer">
                <button
                  type="button"
                  className="pp-view-all"
                  onClick={() => navigate('/projects')}
                >
                  View All <span aria-hidden="true">›</span>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Quick Message ── */}
      <section className="rp-card qm-card">
        <div className="qm-body">
          <div className="qm-icon-wrap">
            <img
              className="qm-icon"
              src={quickMessageIcon}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div className="qm-text">
            <span className="qm-title">Quick Message</span>
            <span className="qm-sub">Send quick updates to team or individuals</span>
          </div>
        </div>
        <button className="qm-btn" onClick={() => setShowModal(true)}>
          Compose Message
        </button>
      </section>

      {showModal && <ComposeMessageModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
