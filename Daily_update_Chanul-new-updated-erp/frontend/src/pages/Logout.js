import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  useEffect(() => {
    // Perform logout
    logout();
    
    // Navigate to login page
    navigate('/login', { replace: true });
  }, [navigate, logout]);
  
  return null;
}

