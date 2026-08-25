import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import Context Providers
import { EmployeeFormProvider } from './context/EmployeeFormContext';
import { ToastProvider } from './context/ToastContext';

// Layout Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
// import ProtectedRoute from './components/ProtectedRoute'; // No longer used, replaced with RoleProtectedRoute
import RoleProtectedRoute from './components/RoleProtectedRoute';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import AttendanceAdmin from './pages/AttendanceAdmin';
import LeavePage from './pages/LeavePage';
import RecruitmentPage from './pages/RecruitmentPage';
import ReportsPage from './pages/ReportsPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import Profile from './pages/Profile';
import Leaves from './pages/Leaves';
import Attendence from './pages/Attendence';
import Login from './pages/Login';
import TemplatesPage from './pages/TemplatesPage';
import LetterManagementPage from './pages/LetterManagementPage';
import Logout from './pages/Logout';
import Unauthorized from './pages/Unauthorized';

// Additional Pages
// import TasksPage from './pages/TasksPage';
import Performance from './pages/Perfomance';
import PerformancePage from './pages/PerformancePage';
import SettingsPage from './pages/SettingsPage';
import ProjectsDashboard from "./pages/projects/ProjectsDashboard";
import ViewProject from "./pages/projects/ViewProject";
import ProjectsPage from './pages/ProjectsPage';
import PayrollPage from './pages/PayrollPage';
import TasksPage from './pages/TaskPage/TaskPage';

// New Page Added
import OrganizationalHierarchy from './pages/OrganizationalHierarchy';
import EmployeeOverview from './pages/EmployeeOverview';
import EditEmployee from './pages/EditEmployee';
import NewEmployee from './pages/NewEmployee';
import AddEmployeeStep2 from './pages/AddEmployeeStep2';
import AddEmployeeStep3 from './pages/AddEmployeeStep3';
import RulesAndRegulationsPage from './pages/RulesAndRegulationsPage';
import Rating from './pages/Rating';

function AttendanceRouteResolver() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');

  return employeeId ? <AttendancePage /> : <AttendanceAdmin />;
}

function AppShell() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/login') || location.pathname.startsWith('/logout');
  const currentUserRole = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?.role;
    } catch (error) {
      return null;
    }
  })();
  const appRoleClass = !hideChrome && currentUserRole ? `app-container--${currentUserRole}` : '';

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
      // Additional mobile-specific scroll prevention
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className={`app-container ${appRoleClass}`}>
      {!hideChrome && <SessionTimeoutWarning />}
      {!hideChrome && (
        <>
          <Sidebar isOpen={isSidebarOpen} onNavigate={() => setSidebarOpen(false)} />
          {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        </>
      )}
      <div className={`main-content ${hideChrome ? 'no-chrome' : ''}`}>
        {!hideChrome && <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />}
        <div className={`page-content ${hideChrome ? 'page-content--full' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin-only Routes */}
            <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
            <Route path="/employee-dashboard" element={<RoleProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></RoleProtectedRoute>} />
            <Route path="/projects" element={<RoleProtectedRoute allowedRoles={['admin']}><ProjectsPage /></RoleProtectedRoute>} />
            <Route path="/payroll" element={<RoleProtectedRoute allowedRoles={['admin']}><PayrollPage /></RoleProtectedRoute>} />
            <Route path="/employees" element={<RoleProtectedRoute allowedRoles={['admin']}><EmployeesPage /></RoleProtectedRoute>} />
            <Route path="/employees/new" element={<RoleProtectedRoute allowedRoles={['admin']}><NewEmployee /></RoleProtectedRoute>} />
            <Route path="/employees/step2" element={<RoleProtectedRoute allowedRoles={['admin']}><AddEmployeeStep2 /></RoleProtectedRoute>} />
            <Route path="/employees/step3" element={<RoleProtectedRoute allowedRoles={['admin']}><AddEmployeeStep3 /></RoleProtectedRoute>} />
            <Route path="/employees/:id/rating" element={<RoleProtectedRoute allowedRoles={['admin']}><Rating /></RoleProtectedRoute>} />
            <Route path="/employees/:id" element={<RoleProtectedRoute allowedRoles={['admin']}><EmployeeProfilePage /></RoleProtectedRoute>} />
            <Route path="/employees/:id/overview" element={<RoleProtectedRoute allowedRoles={['admin']}><EmployeeOverview /></RoleProtectedRoute>} />
            {/* Self-view overview: any authenticated user (admin OR employee) can view their own profile */}
            <Route path="/my-overview" element={<RoleProtectedRoute allowedRoles={['admin', 'employee']}><EmployeeOverview /></RoleProtectedRoute>} />
            <Route path="/employees/:id/edit" element={<RoleProtectedRoute allowedRoles={['admin']}><EditEmployee /></RoleProtectedRoute>} />
            <Route path="/attendance" element={<RoleProtectedRoute allowedRoles={['admin']}><AttendanceRouteResolver /></RoleProtectedRoute>} />
            <Route path="/admin/attendance" element={<RoleProtectedRoute allowedRoles={['admin']}><AttendanceAdmin /></RoleProtectedRoute>} />
            <Route path="/admin/attendance/all" element={<RoleProtectedRoute allowedRoles={['admin']}><AttendanceAdmin /></RoleProtectedRoute>} />
            <Route path="/attendance-admin" element={<RoleProtectedRoute allowedRoles={['admin']}><AttendanceAdmin /></RoleProtectedRoute>} />
            <Route path="/leave" element={<RoleProtectedRoute allowedRoles={['admin']}><LeavePage /></RoleProtectedRoute>} />
            <Route path="/recruitment" element={<RoleProtectedRoute allowedRoles={['admin']}><RecruitmentPage /></RoleProtectedRoute>} />
            <Route path="/reports" element={<RoleProtectedRoute allowedRoles={['admin']}><ReportsPage /></RoleProtectedRoute>} />
            <Route path="/templates" element={<RoleProtectedRoute allowedRoles={['admin']}><TemplatesPage /></RoleProtectedRoute>} />
            <Route path="/letter-management" element={<RoleProtectedRoute allowedRoles={['admin']}><LetterManagementPage /></RoleProtectedRoute>} />
            <Route path="/projects" element={<RoleProtectedRoute allowedRoles={['admin']}><ProjectsDashboard /></RoleProtectedRoute>} />
            <Route path="/projects/:projectId" element={<RoleProtectedRoute allowedRoles={['admin']}><ViewProject /></RoleProtectedRoute>} />


            {/* New Route Added */}
            <Route path="/org-hierarchy" element={<RoleProtectedRoute allowedRoles={['admin', 'employee']}><OrganizationalHierarchy /></RoleProtectedRoute>} />
            <Route path="/rules-and-regulations" element={<RoleProtectedRoute allowedRoles={['admin', 'employee']}><RulesAndRegulationsPage /></RoleProtectedRoute>} />

            {/* Staff Self-Service Routes */}
            
            <Route path="/tasks" element={<RoleProtectedRoute allowedRoles={['employee']}><TasksPage /></RoleProtectedRoute>} />
            <Route path="/performance" element={<RoleProtectedRoute allowedRoles={['employee']}><Performance /></RoleProtectedRoute>} />
            <Route path="/performance" element={<RoleProtectedRoute allowedRoles={['employee']}><PerformancePage /></RoleProtectedRoute>} />
            <Route path="/profile" element={<RoleProtectedRoute allowedRoles={['admin', 'employee']}><Profile /></RoleProtectedRoute>} />
            <Route path="/leaves" element={<RoleProtectedRoute allowedRoles={['admin', 'employee']}><Leaves /></RoleProtectedRoute>} />
            <Route path="/my-attendance" element={<RoleProtectedRoute allowedRoles={['admin', 'employee']}><Attendence /></RoleProtectedRoute>} />
            <Route path="/settings" element={<RoleProtectedRoute allowedRoles={['admin', 'employee']}><SettingsPage /></RoleProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <EmployeeFormProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </EmployeeFormProvider>
    </Router>
  );
}

export default App;
