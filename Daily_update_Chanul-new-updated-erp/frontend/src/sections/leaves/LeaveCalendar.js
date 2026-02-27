import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Calendar from 'react-calendar';
import { getUserCalendarData } from '../../integration/leavesAPI';
import useAuth from '../../hooks/useAuth'; // Default export
import arrowLeft from '../../assets/icons/arrow_left.png';
import './LeaveCalendar.css';

// Mobile calendar component
function MobileCalendar({ date, setDate, leaveData, getLeaveStatus }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    setDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="mobile-calendar">
      <div className="mobile-calendar-header">
        <button className="mobile-nav-btn" onClick={handlePrevMonth}>
          <img src={arrowLeft} alt="Previous" />
        </button>
        <div className="mobile-month-year">{monthYear}</div>
        <button className="mobile-nav-btn" onClick={handleNextMonth}>
          <img src={arrowLeft} alt="Next" className="arrow-right" />
        </button>
      </div>

      <div className="mobile-weekdays">
        <div className="mobile-weekday">Sun</div>
        <div className="mobile-weekday">Mon</div>
        <div className="mobile-weekday">Tue</div>
        <div className="mobile-weekday">Wed</div>
        <div className="mobile-weekday">Thu</div>
        <div className="mobile-weekday">Fri</div>
        <div className="mobile-weekday">Sat</div>
      </div>

      <div className="mobile-days-grid">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="mobile-day empty"></div>;
          }

          const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          // Format date as YYYY-MM-DD to match backend format
          const year = dayDate.getFullYear();
          const month = String(dayDate.getMonth() + 1).padStart(2, '0');
          const dayNum = String(dayDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${dayNum}`;
          const status = leaveData[dateStr];

          return (
            <div
              key={day}
              className={`mobile-day ${status ? `status-${status}` : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <span className="mobile-day-number">{day}</span>
              {status && <div className={`mobile-status-dot status-${status}`}></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LeaveCalendar = forwardRef((props, ref) => {
  const { user, loading: authLoading } = useAuth(); // Get current user from auth context
  const [date, setDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [leaveData, setLeaveData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCalendarData = async () => {
      // Only proceed if auth is loaded and user is authenticated
      if (authLoading) {
        return; // Wait for auth to load
      }
      
      if (!user || !user.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getUserCalendarData(user.id);
        setLeaveData(response.calendarData || {});
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [user, authLoading]);

  // Expose refreshData function via ref
  useImperativeHandle(ref, () => ({
    refreshData: async () => {
      if (!user || !user.id) {
        setError('User not authenticated');
        return;
      }

      try {
        setLoading(true);
        const response = await getUserCalendarData(user.id);
        setLeaveData(response.calendarData || {});
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }));

  // Get leave status for a specific date
  const getLeaveStatus = (checkDate) => {
    // Format date as YYYY-MM-DD to match backend format
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return leaveData[dateStr];
  };

  // Custom tile class based on leave status
  const getTileClassName = ({ date: tileDate }) => {
    // Format date as YYYY-MM-DD to match backend format
    const year = tileDate.getFullYear();
    const month = String(tileDate.getMonth() + 1).padStart(2, '0');
    const day = String(tileDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const status = leaveData[dateStr];
    return status ? `leave-tile status-${status}` : 'leave-tile';
  };

  // Custom tile content with status marker
  const getTileContent = ({ date: tileDate, view }) => {
    if (view === 'month') {
      // Format date as YYYY-MM-DD to match backend format
      const year = tileDate.getFullYear();
      const month = String(tileDate.getMonth() + 1).padStart(2, '0');
      const day = String(tileDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const status = leaveData[dateStr];

      return (
        <div className="tile-content">
          {status && <div className={`status-marker status-${status}`}></div>}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="leave-calendar-container">
        <div className="loading-message">Loading calendar data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-calendar-container">
        <div className="error-message">Error loading calendar data: {error}</div>
      </div>
    );
  }

  return (
    <div className="leave-calendar-container">
      {isMobile ? (
        <>
          <h2 className="leave-calendar-title">Leave Management</h2>
          <MobileCalendar
            date={date}
            setDate={setDate}
            leaveData={leaveData}
            getLeaveStatus={getLeaveStatus}
          />
        </>
      ) : (
        <div className="leave-calendar-outer-wrapper">
          <h2 className="leave-calendar-title">Leave Management</h2>
          <div className="calendar-divider"></div>
          <div className="leave-calendar-wrapper">
            <div className="calendar-nav-header">
          <div className="nav-dropdowns">
            <select
              className="month-dropdown"
              value={date.getMonth()}
              onChange={(e) => setDate(new Date(date.getFullYear(), parseInt(e.target.value)))}
            >
              <option value="0">Jan</option>
              <option value="1">Feb</option>
              <option value="2">Mar</option>
              <option value="3">Apr</option>
              <option value="4">May</option>
              <option value="5">Jun</option>
              <option value="6">Jul</option>
              <option value="7">Aug</option>
              <option value="8">Sep</option>
              <option value="9">Oct</option>
              <option value="10">Nov</option>
              <option value="11">Dec</option>
            </select>
            <select
              className="year-dropdown"
              value={date.getFullYear()}
              onChange={(e) => setDate(new Date(parseInt(e.target.value), date.getMonth()))}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="nav-center-section">
            <button
              className="nav-arrow-btn prev-arrow"
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1))}
            >
              <img src={arrowLeft} alt="Previous" />
            </button>
            <div className="calendar-month-year">
              {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button
              className="nav-arrow-btn next-arrow"
              onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1))}
            >
              <img src={arrowLeft} alt="Next" className="arrow-right" />
            </button>
          </div>
        </div>
        <Calendar
          value={date}
          onChange={setDate}
          tileClassName={getTileClassName}
          tileContent={getTileContent}
          calendarType="gregory"
          navigationLabel={null}
          showNavigation={false}
        />
        </div>
        </div>
      )}

      {/* Legend */}
      <div className="leave-legend">
        <div className="legend-item">
          <span className="legend-dot approved"></span>
          <span className="legend-label">Approved</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot pending"></span>
          <span className="legend-label">Pending</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot rejected"></span>
          <span className="legend-label">Rejected</span>
        </div>
      </div>
    </div>
  );
});

export default LeaveCalendar;
