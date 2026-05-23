import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { fetchProjectsDashboard } from "../../integration/projectAPI";
import "../../styles/ProjectStatusOverview.css";

/**
 * Project Status Overview — donut chart + legend
 * Reads counts from /projects → stats (computed by backend project.controller).
 */

// Color palette per the Figma
const STATUS_META = [
  { key: "completed",   label: "Completed",   color: "#22C55E" },
  { key: "in_progress", label: "In Progress", color: "#2563EB" },
  { key: "on_hold",     label: "On Hold",     color: "#EAB308" },
  { key: "cancelled",   label: "Cancelled",   color: "#EF4444" },
];

// Normalize any status string ("In Progress", "in-progress", "ON HOLD", ...)
// to the canonical key the legend uses.
const normalizeStatus = (raw) => {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["complete", "completed", "done", "finished"].includes(s)) return "completed";
  if (["in_progress", "progress", "active", "ongoing", "running"].includes(s))
    return "in_progress";
  if (["on_hold", "hold", "paused"].includes(s)) return "on_hold";
  if (["cancelled", "canceled", "rejected"].includes(s)) return "cancelled";
  return s;
};

const computeBreakdown = (apiResponse) => {
  // Prefer the backend's pre-computed stats object
  const stats = apiResponse?.stats || {};
  const fromStats = STATUS_META.map((s) => ({
    name: s.label,
    color: s.color,
    value: Number(stats[s.key] ?? 0),
  }));

  const statsTotal = fromStats.reduce((sum, d) => sum + d.value, 0);
  if (statsTotal > 0) return fromStats;

  // Fallback: roll our own counts from the projects array
  const projects = Array.isArray(apiResponse?.projects) ? apiResponse.projects : [];
  const counts = projects.reduce((acc, p) => {
    const k = normalizeStatus(p.status);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  return STATUS_META.map((s) => ({
    name: s.label,
    color: s.color,
    value: counts[s.key] || 0,
  }));
};

export default function ProjectStatusOverview() {
  const [data, setData] = useState(
    STATUS_META.map((s) => ({ name: s.label, color: s.color, value: 0 }))
  );
  const [updatedOn, setUpdatedOn] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchProjectsDashboard()
      .then((res) => {
        if (cancelled) return;
        setData(computeBreakdown(res));
        setUpdatedOn(
          new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
      })
      .catch((err) => {
        console.error("Error fetching project status:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  // recharts errors on an all-zero pie — show a single neutral slice instead
  const chartData =
    total > 0 ? data : [{ name: "Empty", value: 1, color: "#E5E7EB" }];

  return (
    <section className="proj-status-card" aria-label="Project status overview">
      <h3 className="proj-status-title">Project Status Overview</h3>

      <div className="proj-status-body">
        <div className="proj-status-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="100%"
                paddingAngle={0}
                stroke="none"
                isAnimationActive={false}
              >
                {chartData.map((entry, i) => (
                  <Cell key={`${entry.name}-${i}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="proj-status-center">
            <div className="proj-status-center-value">{total}</div>
            <div className="proj-status-center-label">Total</div>
          </div>
        </div>

        <ul className="proj-status-legend">
          {data.map((d) => {
            const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);
            return (
              <li className="proj-status-legend-row" key={d.name}>
                <span
                  className="proj-status-legend-dot"
                  style={{ background: d.color }}
                  aria-hidden="true"
                />
                <span className="proj-status-legend-name">{d.name}</span>
                <span className="proj-status-legend-value">
                  {d.value}({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {updatedOn && (
        <div className="proj-status-footer">Update: {updatedOn}</div>
      )}
    </section>
  );
}
