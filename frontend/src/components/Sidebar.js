import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import logo from '../assets/images/logo.png';
import pineappleBrand from '../assets/images/pineappleai.png';
import { getSidebarMenu } from '../integration/sidebarAPI';

import dashboardIcon from '../assets/icons/dashboard.png';
import employeeIcon from '../assets/icons/employee.png';
import leaveIcon from '../assets/icons/leave.png';
import recruitmentIcon from '../assets/icons/recruitment.png';
import projectIcon from '../assets/icons/project.png';
import payrollIcon from '../assets/icons/payroll.png';
import settingIcon from '../assets/icons/setting.png';
import logoutIcon from '../assets/icons/logout.png';
import taskIcon from '../assets/icons/task.png';
import performanceIcon from '../assets/icons/performance.png';

// Map icon names to actual imports
const iconMap = {
  dashboard: dashboardIcon,
  employee: employeeIcon,
  leave: leaveIcon,
  recruitment: recruitmentIcon,
  project: projectIcon,
  payroll: payrollIcon,
  setting: settingIcon,
  logout: logoutIcon,
  task: taskIcon,
  performance: performanceIcon
};

const getCurrentUserRole = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    return currentUser.role;
  } catch (error) {
    return null;
  }
};

const filterMenuForRole = (items, role) => {
  if (role === 'admin') return items;
  return items.filter((item) => item.path !== '/settings');
};

const Sidebar = ({ isOpen, onNavigate }) => {
  const [menuItems, setMenuItems] = useState([]);
  // State for database info and project version
  const [dbInfo, setDbInfo] = useState({
    database: "Loading...",
    version: "Loading...",
  });

  // Fetch both menu items and database info
  useEffect(() => {
    const fetchData = async () => {
      // Fetch database info
      try {
        const response = await fetch(
          `http://localhost:5001/api/test-db`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.database) {
            setDbInfo((prev) => ({
              ...prev,
              database: data.database,
              version: data.version,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching database info:", error);
        setDbInfo((prev) => ({
          ...prev,
          database: "Error loading",
          version: "Error loading",
        }));
      }
      
      // Fetch menu items
      try {
        const response = await getSidebarMenu();
        if (response.success) {
          setMenuItems(filterMenuForRole(response.data.menuItems, getCurrentUserRole()));
        }
      } catch (error) {
        console.error('Error fetching sidebar menu:', error);
        // Fallback to hardcoded menu if API fails
        const currentUserRole = getCurrentUserRole();
        const fallbackMenu = currentUserRole === 'admin' ? [
          { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
          { path: '/employees', label: 'Employees', icon: 'employee' },
          { path: '/leave', label: 'Leaves', icon: 'leave' },
          { path: '/projects', label: 'Projects', icon: 'project' },
          { path: '/templates', label: 'Templates', icon: 'project' },
          { path: '/settings', label: 'Settings', icon: 'setting' },
          { path: '/logout', label: 'Logout', icon: 'logout' }
        ] : [
          { path: '/employee-dashboard', label: 'Dashboard', icon: 'dashboard' },
          { path: '/tasks', label: 'My Tasks', icon: 'task' },
          { path: '/leaves', label: 'Leaves', icon: 'leave' },
          { path: '/performance', label: 'Performance', icon: 'performance' },
          { path: '/logout', label: 'Logout', icon: 'logout' }
        ];
        setMenuItems(fallbackMenu);
      }
    };

    fetchData();
  }, []);

  const sidebarClass = `sidebar${isOpen ? ' open' : ''}`;

  return (
    <div className={sidebarClass}>
      <div className="sidebar-header">
        <img src={logo} alt="Logo" className="logo-img" />
        <img src={pineappleBrand} alt="PINEAPPLEAI" className="brand-img" />
        <div className="db-info-mobile">
          <span>DB: {dbInfo.database}</span>
          <span> | Version: {dbInfo.version}</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          (item.path === '/logout' ? (
            <NavLink
              key={item.path}
              to={item.path}
              className="nav-item"
              onClick={onNavigate}
            >
              <img className="nav-icon" src={iconMap[item.icon]} alt={`${item.label} icon`} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onNavigate}
            >
              <img className="nav-icon" src={iconMap[item.icon]} alt={`${item.label} icon`} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
