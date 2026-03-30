import React, { useState } from 'react';
import './TopbarNotifications.css';

const TopbarNotifications = () => {
  const [notifications] = useState([
    { id: 1, message: 'New leave request from John Doe', time: '5 min ago' },
    { id: 2, message: 'Attendance marked successfully', time: '10 min ago' },
    { id: 3, message: 'New employee onboarded', time: '1 hour ago' },
  ]);

  return (
    <div className="notifications-dropdown">
      <h4>Notifications</h4>
      <div className="notifications-list">
        {notifications.map((notif) => (
          <div key={notif.id} className="notification-item">
            <p className="notification-message">{notif.message}</p>
            <span className="notification-time">{notif.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopbarNotifications;

