// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import useAuth from '../hooks/useAuth';
// import useRoleGuard from '../hooks/useRoleGuard';

// const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
//   const { isAuthenticated, loading, user } = useAuth();
  
//   // Show nothing while checking authentication status
//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   // If not authenticated, redirect to login page
//   if (!isAuthenticated) {
//     // Also clear browser history to prevent back button access
//     window.history.replaceState(null, '', '/login');
//     return <Navigate to="/login" replace />;
//   }

//   // If no roles are required, allow access
//   if (!allowedRoles || allowedRoles.length === 0) {
//     return children;
//   }
  
//   // Check if user's role is in the allowed roles
//   const hasAccess = allowedRoles.includes(user?.role);
  
//   // If user doesn't have the required role, redirect to unauthorized page
//   if (!hasAccess) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   // If authenticated and has proper role, render the protected content
//   return children;
// };

// export default RoleProtectedRoute;

import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Show nothing while checking authentication status
  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    // Also clear browser history to prevent back button access
    window.history.replaceState(null, '', '/login');
    return <Navigate to="/login" replace />;
  }

  // If no roles are required, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }
  
  // Check if user's role is in the allowed roles
  const hasAccess = allowedRoles.includes(user?.role);
  
  // If user doesn't have the required role, redirect to unauthorized page
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has proper role, render the protected content
  return children;
};

export default RoleProtectedRoute;