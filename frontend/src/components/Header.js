// import React from 'react';
// import useAuth from '../hooks/useAuth';
// import './Header.css';
// import defaultProfile from '../assets/images/default_profile.png';
// import bellIcon from '../assets/icons/bell.png';

// const Header = ({ onToggleSidebar }) => {
//   const { user, loading } = useAuth();

//   // Get greeting based on time of day
//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour < 12) return 'Good Morning';
//     if (hour < 18) return 'Good Afternoon';
//     return 'Good Evening';
//   };

//   // Get user's first name or default
//   const getFirstName = () => {
//     if (loading) return 'Loading...';
//     if (user && user.first_name) {
//       return user.first_name;
//     }
//     return 'User';
//   };

//   // Get user's role or default
//   const getUserRole = () => {
//     if (loading) return '...';
//     if (user && user.role) {
//       return user.role.charAt(0).toUpperCase() + user.role.slice(1);
//     }
//     return 'User';
//   };

//   // Get user's profile image
//   const getProfileImage = () => {
//     if (loading) return defaultProfile;
//     if (user && user.EmployeeDetail && user.EmployeeDetail.image_path) {
//       return user.EmployeeDetail.image_path;
//     }
//     return defaultProfile;
//   };

//   return (
//     <header className="header">
//       {/* Mobile hamburger toggle */}
//       <button type="button" className="hamburger-btn" onClick={onToggleSidebar} aria-label="Open sidebar">
//         <span className="bar"></span>
//         <span className="bar"></span>
//         <span className="bar"></span>
//       </button>

//       {/* Left title/subtitle group */}
//       <div className="header-title">
//         <div className="title">Hello {getFirstName()} <span className="wave" aria-hidden="true">👋</span></div>
//         <div className="subtitle">{getGreeting()}</div>
//       </div>

//       {/* Notification square (green border) with centered icon */}
//       <div className="notification-box">
//         <img src={bellIcon} alt="Notifications" className="notification-icon-img" />
//       </div>

//       {/* User card: avatar + name + role */}
//       <div className="user-card">
//         <div className="avatar-box">
//           <img
//             src={getProfileImage()}
//             alt="User Avatar"
//           />
//         </div>
//         <div className="user-info">
//           <div className="name">{getFirstName()}</div>
//           <div className="role">{getUserRole()}</div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "./Header.css";
import defaultProfile from "../assets/images/default_profile.png";
import bellIcon from "../assets/icons/bell.png";
import { getEmployeeImageUrl } from "../utils/imageUtils";
import TopbarNotifications from "./TopbarNotifications";
import apiClient from "../utils/apiClient";

const Header = ({ onToggleSidebar }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Toggle Employee Overview page when clicking the user-card.
  // - First click  -> navigate to /my-overview (show overview for the logged-in user)
  // - Second click -> navigate back / away (hide overview)
  // We use /my-overview (not /employees/:id/overview) so that non-admins
  // can also view their own overview without hitting the admin role guard.
  const overviewPath = "/my-overview";

  // TEMPORARY: user-card click is DISABLED on the admin side.
  // Only non-admins (employees) can toggle the overview by clicking the card.
  // To re-enable for admins later, simply remove the `isAdmin` short-circuit below.
  const isAdmin = user && user.role === "admin";

  const handleUserCardClick = () => {
    if (!user) return;
    if (isAdmin) return; // <-- admin: do nothing (temporarily disabled)
    const isOnOverview = location.pathname === overviewPath;
    if (isOnOverview) {
      // Hide: go back if there's history, otherwise fall back to a safe default
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/performance");
      }
    } else {
      navigate(overviewPath);
    }
  };

  // State for database info and project version
  const [dbInfo, setDbInfo] = useState({
    database: "Loading...",
    version: "Loading...",
  });

  // State for toggling notifications dropdown
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const { data } = await apiClient.get("/notifications");
      if (data.success) {
        setNotifications(data.data);
        const unread = data.data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optionally poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Toggle notifications visibility
  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowNotifications(false);
    };
    const handleScroll = (event) => {
      if (
        event.target instanceof Node &&
        notificationRef.current?.contains(event.target)
      ) {
        return;
      }
      setShowNotifications(false);
    };
    const handleResize = () => setShowNotifications(false);

    if (showNotifications) {
      window.addEventListener("click", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }
    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [showNotifications]);

  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  // Fetch database info from backend
  useEffect(() => {
    const fetchDbInfo = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api"}/test-db`
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
    };

    fetchDbInfo();
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get user's first name or default
  const getFirstName = () => {
    if (loading) return "Loading...";
    if (user && user.first_name) {
      return user.first_name;
    }
    return "User";
  };

  // Get user's role or default
  const getUserRole = () => {
    if (loading) return "...";
    if (user && user.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    return "User";
  };

  // Get user's profile image
  const getProfileImage = () => {
    if (loading) return defaultProfile;
    // Use centralized image utility for consistent handling
    return getEmployeeImageUrl(user, defaultProfile);
  };

  return (
    <header className={`header ${showNotifications ? "notifications-open" : ""}`}>
      {/* Mobile hamburger toggle */}
      <button
        type="button"
        className="hamburger-btn"
        onClick={onToggleSidebar}
        aria-label="Open sidebar"
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>

      {/* Left title/subtitle group */}
      <div className="header-title">
        <div className="title">
          Hello {getFirstName()}{" "}
          <span className="wave" aria-hidden="true">
            👋
          </span>
        </div>
        <div className="subtitle">{getGreeting()}</div>
        <div className="db-info">
          DB: {dbInfo.database} | Version: {dbInfo.version}
        </div>
      </div>

      {/* Notification square (green border) with centered icon */}
      <div 
        ref={notificationRef}
        className={`notification-box ${showNotifications ? 'active' : ''}`} 
        onClick={toggleNotifications}
        title="View Notifications"
      >
        <img
          src={bellIcon}
          alt="Notifications"
          className="notification-icon-img"
        />
        {/* Simple badge indicating new notifications */}
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        
        {showNotifications && (
          <div className="notifications-container" onClick={(e) => e.stopPropagation()}>
            <TopbarNotifications 
              notifications={notifications} 
              onRefresh={fetchNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        )}
      </div>

      {/* User card: avatar + name + role
          Click toggles the Employee Overview page (show / hide).
          NOTE: temporarily DISABLED for admin users — for them this is a plain,
          non-clickable card with no pointer / role / tooltip. */}
      <div
        className={`user-card ${
          !isAdmin && location.pathname === overviewPath ? "active" : ""
        }`}
        onClick={isAdmin ? undefined : handleUserCardClick}
        role={isAdmin ? undefined : "button"}
        tabIndex={isAdmin ? undefined : 0}
        onKeyDown={
          isAdmin
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleUserCardClick();
                }
              }
        }
        title={isAdmin ? undefined : "View employee overview"}
        style={isAdmin ? undefined : { cursor: "pointer" }}
      >
        <div className="avatar-box">
          <img
            src={getProfileImage()}
            alt="User Avatar"
            className="avatar-img"
            onError={(e) => {
              e.target.onerror = null; // prevents looping
              e.target.src = defaultProfile; // fallback to default profile
            }}
          />
        </div>
        <div className="user-info">
          <div className="name">{getFirstName()}</div>
          <div className="role">{getUserRole()}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
