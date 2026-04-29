// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import AdminDashboard from '../pages/Admin-Dashboard';
// import EmployeesPage from '../pages/EmployeesPage';
// import EmployeeProfile from '../pages/EmployeeProfile';
// import EmployeeOverview from '../pages/EmployeeOverview';
// import EditEmployee from '../pages/EditEmployee';
// import Leaves from '../pages/Leaves';
// import Reports from '../pages/Reports';
// import Profile from '../pages/Profile';
// import Login from '../pages/Login';
// import ForgotPassword from '../pages/ForgotPassword';
// import EnterOTP from '../pages/Enter-OTP';
// import UpdatePassword from '../pages/Update password';
// import NotFound from '../pages/NotFound';
// import Unauthorized from '../pages/Unauthorized';
// import Attendence from '../pages/Attendence';
// import AttendancePage from '../pages/AttendancePage';
// import OrganizationalHierarchy from '../pages/OrganizationalHierarchy';
// import NewEmployee from '../pages/NewEmployee';
// import AddEmployeeStep2 from '../pages/AddEmployeeStep2';
// import AddEmployeeStep3 from '../pages/AddEmployeeStep3';
// import PrivateRoute from './PrivateRoute';
// import RoleRoute from './RoleRoute';

// export default function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/login" element={<Login />} />
//       <Route path="/forgot-password" element={<ForgotPassword />} />
//       <Route path="/enter-otp" element={<EnterOTP />} />
//       <Route path="/update-password" element={<UpdatePassword />} />

//       {/* Admin Routes */}
//       <Route element={<PrivateRoute />}>
//         <Route element={<RoleRoute allow={['admin']} />}>
//           <Route path="/" element={<Navigate to="/dashboard" replace />} />
//           <Route path="/dashboard" element={<AdminDashboard />} />
//           <Route path="/employees" element={<EmployeesPage />} />
//           <Route path="/employees/new" element={<NewEmployee />} />
//           <Route path="/employees/step2" element={<AddEmployeeStep2 />} />
//           <Route path="/employees/step3" element={<AddEmployeeStep3 />} />
//           <Route path="/employees/:id" element={<EmployeeProfile />} />
//           <Route path="/employees/:id/overview" element={<EmployeeOverview />} />
//           <Route path="/employees/:id/rating" element={<Rating />} />
//           <Route path="/employees/:id/edit" element={<EditEmployee />} />
//           <Route path="/attendance" element={<AttendancePage />} />
//           <Route path="/attendance-admin" element={<AttendanceAdmin />} />
//           <Route path="/leaves" element={<Leaves />} />
//           <Route path="/reports" element={<Reports />} />
//           <Route path="/profile" element={<Profile />} />
//           <Route path="/org-hierarchy" element={<OrganizationalHierarchy />} />
//         </Route>
//       </Route>

//       {/* Catch-all for unauthorized access */}
//       <Route path="/unauthorized" element={<Unauthorized />} />
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// }

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "../pages/Admin-Dashboard";
import EmployeesPage from "../pages/EmployeesPage";
import EmployeeProfile from "../pages/EmployeeProfile";
import EmployeeOverview from "../pages/EmployeeOverview";
import EditEmployee from "../pages/EditEmployee";
import Leaves from "../pages/Leaves";
import Reports from "../pages/Reports";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import EnterOTP from "../pages/Enter-OTP";
import UpdatePassword from "../pages/Update password";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import Attendence from "../pages/Attendence";
import AttendanceAdmin from "../pages/AttendanceAdmin";
import OrganizationalHierarchy from "../pages/OrganizationalHierarchy";
import NewEmployee from "../pages/NewEmployee";
import AddEmployeeStep2 from "../pages/AddEmployeeStep2";
import AddEmployeeStep3 from "../pages/AddEmployeeStep3";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import Rating from "../pages/Rating";
import Performance from "../pages/Performance";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/enter-otp" element={<EnterOTP />} />
      <Route path="/update-password" element={<UpdatePassword />} />

      {/* Admin Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute allow={["admin"]} />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/new" element={<NewEmployee />} />
          <Route path="/employees/step2" element={<AddEmployeeStep2 />} />
          <Route path="/employees/step3" element={<AddEmployeeStep3 />} />
          <Route
            path="/employees/:id/overview"
            element={<EmployeeOverview />}
          />
          <Route path="/employees/:id/rating" element={<Rating />} />
          <Route path="/employees/:id/edit" element={<EditEmployee />} />
          <Route path="/employees/:id" element={<EmployeeProfile />} />
          <Route path="/attendance" element={<AttendanceAdmin />} />
          <Route path="/admin/attendance" element={<AttendanceAdmin />} />
          <Route path="/attendance-admin" element={<AttendanceAdmin />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/org-hierarchy" element={<OrganizationalHierarchy />} />
        </Route>
      </Route>

      {/* Employee/User Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/performance" element={<Performance />} />
      </Route>

      {/* Catch-all for unauthorized access */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
