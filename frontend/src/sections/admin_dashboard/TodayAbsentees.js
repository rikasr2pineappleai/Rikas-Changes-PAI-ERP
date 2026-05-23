import React, { useEffect, useState } from "react";
import { getAllLeaveRequests } from "../../integration/leavesAPI";
import { getEmployeeImageUrl } from "../../utils/imageUtils";
import defaultAvatar from "../../assets/images/default_profile.png";
import "../../styles/TodayAbsentees.css";

/**
 * Today Absentees — lists employees with an APPROVED leave request whose
 * date range includes today.
 *
 * Source: GET /leave-request → { count, rows: [{ start_date, end_date,
 *   status, User: { first_name, last_name, designation, EmployeeDetail: {
 *   image_path } } }] }
 */

// Returns true when `today` falls inside [start_date, end_date] (inclusive)
const coversToday = (row, today) => {
  if (!row?.start_date) return false;
  const start = new Date(row.start_date);
  start.setHours(0, 0, 0, 0);
  const end = row.end_date ? new Date(row.end_date) : new Date(row.start_date);
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
};

const buildAbsentee = (row) => {
  const user = row.User || {};
  const first = user.first_name || "";
  const last = user.last_name || "";
  const name = `${first} ${last}`.trim() || "Unknown Employee";
  const role =
    user.designation ||
    user.EmployeeDetail?.designation ||
    row.leave_type_name ||
    "—";
  return {
    id: row.id ?? `${user.id}-${row.start_date}`,
    name,
    role,
    avatar: getEmployeeImageUrl(user, defaultAvatar),
  };
};

export default function TodayAbsentees() {
  const [absentees, setAbsentees] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getAllLeaveRequests()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res?.rows) ? res.rows : [];
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        // Approved + covers today. Dedupe by user_id so an employee with
        // multiple overlapping leaves only shows once.
        const seen = new Set();
        const list = [];
        for (const row of rows) {
          const status = String(row.status || "").toLowerCase();
          if (status !== "approved") continue;
          if (!coversToday(row, today)) continue;
          const userId = row.user_id ?? row.User?.id ?? row.id;
          if (seen.has(userId)) continue;
          seen.add(userId);
          list.push(buildAbsentee(row));
        }
        setAbsentees(list);
      })
      .catch((err) => {
        console.error("Error fetching today absentees:", err);
        setAbsentees([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="absentees-card" aria-label="Today's absentees">
      <h3 className="absentees-title">
        Today Absentees{" "}
        <span className="absentees-count">({absentees.length})</span>
      </h3>

      {absentees.length === 0 ? (
        <div className="absentees-empty">No one is absent today.</div>
      ) : (
        <ul className="absentees-list">
          {absentees.map((emp) => (
            <li className="absentees-row" key={emp.id}>
              <img
                src={emp.avatar || defaultAvatar}
                alt=""
                aria-hidden="true"
                className="absentees-avatar"
              />
              <div className="absentees-info">
                <div className="absentees-name">{emp.name}</div>
                <div className="absentees-role">{emp.role}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
