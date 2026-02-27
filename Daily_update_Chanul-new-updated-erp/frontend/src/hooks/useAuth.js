// Authentication Hook
import { useState, useEffect, useRef } from 'react';
import { login as loginApi, logout as logoutApi, getCurrentUser } from '../integration/authAPI';
import apiClient from '../utils/apiClient';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const effectRan = useRef(false);

  // Check if user is authenticated on initial load
  useEffect(() => {
    // Prevent running twice in React 18 StrictMode
    if (effectRan.current) return;
    effectRan.current = true;
    
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set token in apiClient for subsequent requests
          apiClient.setToken(token);
          const response = await getCurrentUser();
          if (response.success) {
            setUser(response.user);
            setIsAuthenticated(true);
            // Store user details in localStorage
            localStorage.setItem('user', JSON.stringify(response.user));
          } else {
            // Token might be invalid, clear authentication state
            console.warn('Token appears to be invalid, clearing auth state');
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            apiClient.removeToken();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear authentication state on error
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        apiClient.removeToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for storage changes (cross-tab logout)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue === null) {
          // Token was removed in another tab, log out this tab too
          setUser(null);
          setIsAuthenticated(false);
          // Clear any stored user data
          localStorage.removeItem('user');
          // Also remove token from apiClient
          apiClient.removeToken();
        } else {
          // Token was added/updated in another tab, update this tab too
          apiClient.setToken(e.newValue);
          // Optionally refresh user data
          getCurrentUser().then(response => {
            if (response.success) {
              setUser(response.user);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(response.user));
            }
          }).catch(error => {
            console.error('Error refreshing user data:', error);
            // If there's an error, it might mean the token is invalid
            // Log out to be safe
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            apiClient.removeToken();
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Periodically check if the user is still authenticated (every 30 seconds)
    const interval = setInterval(() => {
      // We need to check the current authentication state
      const currentToken = localStorage.getItem('token');
      if (currentToken && isAuthenticated) {
        getCurrentUser().catch(error => {
          // If there's an error fetching user data, log out
          console.error('Periodic auth check failed:', error);
          // We need to update the state in this closure
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          apiClient.removeToken();
        });
      }
    }, 30 * 1000); // 30 seconds

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
      effectRan.current = false;
    };
  }, [isAuthenticated]);

  // Login function
  const login = async (identifier, password, rememberMe = false) => {
    try {
      const response = await loginApi(identifier, password, rememberMe);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        // Store user details in localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      // Make sure we clear any existing auth state on login failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      apiClient.removeToken();
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Remove token from localStorage (this will trigger storage event in other tabs)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Also remove token from apiClient
      apiClient.removeToken();
      
      // Clear browser history to prevent back button access
      // Replace current history entry with login page
      window.history.replaceState(null, '', '/login');
    }
  };

  return { 
    user, 
    loading, 
    isAuthenticated,
    login, 
    logout 
  };
}

