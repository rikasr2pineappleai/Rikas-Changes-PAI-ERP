// AdminDashboard.js
import React from 'react';
import '../styles/dashboard.css';
import DashboardWidgets from '../sections/admin_dashboard/DashboardWidgets';
import DashboardOverview from '../sections/admin_dashboard/DashboardOverview';

const AdminDashboard = () => {
  return (
    <div className="page-container">
      {/* Dashboard Widgets Section */}
      <div className="widgets-section">
        <DashboardWidgets />
      </div>

      {/* Attendance Overview Section */}
      <div className="overview-section">
        <DashboardOverview />
      </div>
    </div>
  );
};

export default AdminDashboard;