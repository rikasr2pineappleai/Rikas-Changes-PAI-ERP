// AdminDashboard.js
import React from 'react';
import '../styles/dashboard.css';
import DashboardWidgets from '../sections/admin_dashboard/DashboardWidgets';
import DashboardOverview from '../sections/admin_dashboard/DashboardOverview';
import DashboardRightPanel from '../sections/admin_dashboard/DashboardRightPanel';

const AdminDashboard = () => {
  return (
    <div className="page-container">
      {/* Main two-column layout */}
      <div className="dashboard-main-grid">
        {/* Left Column */}
        <div className="dashboard-left-col">
          <div className="widgets-section">
            <DashboardWidgets />
          </div>
          <div className="overview-section">
            <DashboardOverview />
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right-col">
          <DashboardRightPanel />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;