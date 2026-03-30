import React from 'react';
import ProjectDashboard from "../pages/projects/ProjectsDashboard";
import ViewProject from './projects/ViewProject';


export default function ProjectsPage() {
  return (
    <div className="page-container">
      
            {/* Dashboard Widgets Section */}
            <div className="dashboard-section">
              <ProjectDashboard />
            </div>
            
    </div>
  );
}
