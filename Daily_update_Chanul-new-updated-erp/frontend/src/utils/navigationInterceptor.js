// Navigation interceptor to prevent access to cached protected pages
// This ensures that when users navigate (including via back button), 
// the authentication state is properly validated

import apiClient from './apiClient';

// Check if the current page requires authentication
const requiresAuth = () => {
  // List of paths that require authentication
  const protectedPaths = [
    '/dashboard',
    '/employees',
    '/attendance',
    '/leave',
    '/payroll',
    '/reports',
    '/settings',
    '/profile'
  ];
  
  const currentPath = window.location.pathname;
  return protectedPaths.some(path => currentPath.startsWith(path));
};

// Validate authentication status
const validateAuth = async () => {
  if (!requiresAuth()) {
    return true; // Public pages don't need validation
  }
  
  try {
    // Check if we have a token
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    
    // Try to get current user to validate token
    const response = await apiClient.get('/auth/me');
    return response.data.success;
  } catch (error) {
    console.error('Auth validation failed:', error);
    return false;
  }
};

// Intercept navigation attempts
const interceptNavigation = () => {
  // Listen for popstate events (back/forward button)
  window.addEventListener('popstate', async (event) => {
    const isValid = await validateAuth();
    if (!isValid && requiresAuth()) {
      // Redirect to login if auth is invalid
      window.location.replace('/login');
    }
  });
  
  // Listen for hashchange events
  window.addEventListener('hashchange', async (event) => {
    const isValid = await validateAuth();
    if (!isValid && requiresAuth()) {
      // Redirect to login if auth is invalid
      window.location.replace('/login');
    }
  });
  
  // Periodic validation (every 30 seconds)
  setInterval(async () => {
    // Only validate if we think we're authenticated
    const token = localStorage.getItem('token');
    if (token) {
      const isValid = await validateAuth();
      if (!isValid && requiresAuth()) {
        // Redirect to login if auth is invalid
        window.location.replace('/login');
      }
    }
  }, 30000);
};

// Initialize the interceptor
if (typeof window !== 'undefined') {
  interceptNavigation();
}

const navigationInterceptor = {
  interceptNavigation,
  validateAuth,
  requiresAuth
};

export default navigationInterceptor;