import React from 'react';
import './TopbarNotifications.css';
import apiClient from '../utils/apiClient';

const TopbarNotifications = ({ notifications = [], onRefresh, onClose }) => {
  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      onRefresh();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      onRefresh();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.abs(now - date);
    const minutes = Math.floor(diff / 1000 / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <h4>Notifications</h4>
        {notifications.length > 0 && notifications.some(n => !n.is_read) && (
          <button className="mark-all-btn" onClick={markAllAsRead}>Mark all read</button>
        )}
      </div>
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No new notifications</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
              <div className="notification-content">
                <p className="notification-title">{notif.title}</p>
                <p className="notification-message">{notif.message}</p>
                <span className="notification-time">{formatDate(notif.created_at)}</span>
              </div>
              {!notif.is_read && <span className="unread-dot"></span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopbarNotifications;

