import useAuth from './useAuth';

export default function useRoleGuard(requiredRoles = []) {
  const { user } = useAuth();
  
  // If no roles are required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return { hasAccess: true };
  }
  
  // If user is not authenticated, deny access
  if (!user) {
    return { hasAccess: false };
  }
  
  // Check if user's role is in the allowed roles
  const hasAccess = requiredRoles.includes(user.role);
  
  return { hasAccess };
}

