import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import useRoleGuard from '../hooks/useRoleGuard';

export default function RoleRoute({ allow = [] }) {
  const { hasAccess } = useRoleGuard(allow);
  
  // If user has access, render the child routes
  // Otherwise, redirect to unauthorized page or login
  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}

