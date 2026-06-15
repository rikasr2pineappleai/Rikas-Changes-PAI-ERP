import React, { useState, useEffect } from 'react';
import { fetchProjectsDashboard } from '../../integration/projectAPI';
import ComposeMessageModal from '../../modals/ComposeMessageModal';
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

// ─── Days left from end_date ───────────────────────────────────────────────
function calcDaysLeft(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

// ─── Main right panel ──────────────────────────────────────────────────────
export default function DashboardRightPanel() {
  const [projects, setProjects]   = useState([]);
  const [stats, setStats]         = useState(null);   // raw res.stats from API
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProjectsDashboard()
      .then(res => {
        // ✅ Use pre-computed stats object returned directly by the API
        // res.stats keys: completed, active, planning, on_hold, cancelled, totalProjects
        setStats(res?.stats || {});
        setProjects(Array.isArray(res?.projects) ? res.projects.slice(0, 9) : []);
      })
      .catch(err => console.error('DashboardRightPanel:', err))
      .finally(() => setLoading(false));
  }, []);

  // ✅ Map DB ENUM status values → Figma legend labels + colors
  // DB:  completed | active    | planning | on_hold
  // UI:  Completed | Ongoing   | Pending  | On Hold
  const completedCount = stats?.completed || 0;
  const activeCount    = stats?.active    || 0;
  const planningCount  = stats?.planning  || 0;
  const onHoldCount    = stats?.on_hold   || 0;
  const totalCount     = stats?.totalProjects
    || (completedCount + activeCount + planningCount + onHoldCount);

  const donutSegments = [
    { label: 'Completed Projects', value: completedCount, color: '#4CAF50' },
    { label: 'Ongoing Projects',   value: activeCount,    color: '#2196F3' },
    { label: 'Pending Projects',   value: planningCount,  color: '#FFC107' },
    { label: 'On Hold Projects',   value: onHoldCount,    color: '#F44336' },
  ];

  // Progress bar colour by % completion
  const progressColor = (pct) => {
    if (pct >= 80) return '#4CAF50';
    if (pct >= 50) return '#2196F3';
    if (pct >= 30) return '#FFC107';
    return '#F44336';
  };

  // Badge class by days remaining
  const timeLeftClass = (days) => {
    if (days === null) return 'tl-grey';
    if (days <  0)     return 'tl-red';
    if (days <= 3)     return 'tl-red';
    if (days <= 7)     return 'tl-orange';
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
                  projects.map(p => {
                    // ✅ Exact field names from mapProjectForDashboard()
                    const done     = Number(p.completedTaskCount ?? 0);
                    const total    = Number(p.taskCount ?? 0);
                    const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
                    const daysLeft = calcDaysLeft(p.end_date);

                    return (
                      <tr key={p.id} className="pp-row">
                        <td className="pp-td pp-name-cell" title={p.project_name}>
                          {p.project_name || 'Unnamed'}
                        </td>
                        <td className="pp-td pp-prog-cell">
                          <div className="pp-prog-wrap">
                            <ProgressBar percent={pct} color={progressColor(pct)} />
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
                <button className="pp-view-all">View All <span aria-hidden="true">›</span></button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Quick Message ── */}
      <section className="rp-card qm-card">
        <div className="qm-body">
          <div className="qm-icon-wrap">
            <svg width="64" height="52" viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 20.5L58 2L39.2 50L28.5 30.5L4 20.5ZM28.5 30.5L58 2"
                fill="#347E45"
                stroke="#347E45"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
