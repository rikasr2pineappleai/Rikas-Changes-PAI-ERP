import React, { useState, useEffect } from "react";
import "../../styles/DashboardWidgets.css";

import TEicon  from "../../assets/icons/users_02.png";        // total employee
import TAicon  from "../../assets/icons/briefcase_04.png";    // total applicant
import TATicon from "../../assets/icons/calendar-check.png";  // today attendance
import TPicon  from "../../assets/icons/file_01.png";         // total projects

import { fetchTodayAttendanceCount } from '../../integration/attendanceAPI';
import employeeAPI from '../../integration/employeeAPI';
import { fetchProjectsDashboard } from '../../integration/projectAPI';

const getNestedCount = (response, fallback = 0) => {
  const count =
    response?.data?.count ??
    response?.count ??
    response?.data?.data?.count ??
    fallback;

  const numericCount = Number(count);
  return Number.isFinite(numericCount) ? numericCount : fallback;
};

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState([
    { id: 1, title: "Total Employee", value: 0, icon: TEicon, update: "Just now" },
    { id: 2, title: "Total Applicant", value: 0, icon: TAicon, update: "Just now" },
    { id: 3, title: "Today Attendance", value: 0, icon: TATicon, update: "Just now" },
    { id: 4, title: "Total Projects", value: 0, icon: TPicon, update: "Just now" },
  ]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [attendanceResult, employeeResult, projectsResult] = await Promise.allSettled([
          fetchTodayAttendanceCount(),
          employeeAPI.getEmployeeCount(),
          fetchProjectsDashboard(),
        ]);

        if (attendanceResult.status === 'rejected') {
          console.error('Error fetching attendance count:', attendanceResult.reason);
        }

        if (employeeResult.status === 'rejected') {
          console.error('Error fetching employee count:', employeeResult.reason);
        }

        if (projectsResult.status === 'rejected') {
          console.error('Error fetching project count:', projectsResult.reason);
        }

        const attendanceResponse =
          attendanceResult.status === 'fulfilled' ? attendanceResult.value : null;
        const employeeResponse =
          employeeResult.status === 'fulfilled' ? employeeResult.value : null;
        const projectsResponse =
          projectsResult.status === 'fulfilled' ? projectsResult.value : null;

        const projectCount =
          projectsResponse?.stats?.totalProjects ??
          projectsResponse?.stats?.total ??
          projectsResponse?.projects?.length ??
          0;

        const updatedAt = new Date().toLocaleDateString();

        setWidgets(prevWidgets => 
          prevWidgets.map(widget => {
            if (widget.id === 3) {
              return { ...widget, value: getNestedCount(attendanceResponse), update: updatedAt };
            } else if (widget.id === 1) {
              return { ...widget, value: getNestedCount(employeeResponse), update: updatedAt };
            } else if (widget.id === 2) {
              return { ...widget, value: 0, update: updatedAt };
            } else if (widget.id === 4) {
              return { ...widget, value: Number(projectCount) || 0, update: updatedAt };
            }
            return widget;
          })
        );
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="widget-section" role="region" aria-label="Dashboard widgets">
      <div className="widget-grid">
        {widgets.map((w) => (
          <article className="widget-box" key={w.id} data-id={w.id}>
            <div className="widget-top">
              <div className="icon-wrap" aria-hidden="true">
                <img src={w.icon} alt={`${w.title} icon`} />
              </div>
              <div className="widget-title">{w.title}</div>
            </div>
    
            <div className="widget-value" aria-live="polite">
              {loading ? "..." : w.value}
            </div>
    
            <div className="divider" />
    
            <div className="widget-update">Update: {w.update}</div>
          </article>
        ))}
      </div>
    </div>
  );
}