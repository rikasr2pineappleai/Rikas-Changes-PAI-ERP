// AdminDashboard.js
import React from 'react';
import '../styles/dashboard.css';
import DashboardWidgets from '../sections/admin_dashboard/DashboardWidgets';
import DashboardOverview from '../sections/admin_dashboard/DashboardOverview';
import ProjectStatusOverview from '../sections/admin_dashboard/ProjectStatusOverview';
import TodayAbsentees from '../sections/admin_dashboard/TodayAbsentees';
import QuickMessage from '../sections/admin_dashboard/QuickMessage';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard-page">
      {/* TOP ROW: KPI widgets (left, 4 across) + Project Status (right) */}
      <div className="admin-dashboard-top-row">
        <div className="admin-dashboard-widgets-col">
          <DashboardWidgets />
        </div>
        <div className="admin-dashboard-status-col">
          <ProjectStatusOverview />
        </div>
      </div>

      {/* BOTTOM ROW: Attendance overview (left) + Absentees + Quick Message (right) */}
      <div className="admin-dashboard-bottom-row">
        <div className="admin-dashboard-overview-col">
          <DashboardOverview />
        </div>
        <div className="admin-dashboard-side-col">
          <TodayAbsentees />
          <QuickMessage />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
