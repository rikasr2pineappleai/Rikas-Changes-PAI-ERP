import React, { useState, useEffect } from 'react';
import './HolidayList.css';

// Sri Lankan Mercantile Holidays for 2025 and 2026
// Source: Central Bank of Sri Lanka
const MERCANTILE_HOLIDAYS = {
  2025: [
    // January
    { name: 'Duruthu Full Moon Poya Day', date: '2025-01-13', day: 'Monday' },
    { name: 'Tamil Thai Pongal Day', date: '2025-01-14', day: 'Tuesday' },
    // February
    { name: 'Independence Day', date: '2025-02-04', day: 'Tuesday' },
    { name: 'Navam Full Moon Poya Day', date: '2025-02-12', day: 'Wednesday' },
    // March
    { name: 'Medin Full Moon Poya Day', date: '2025-03-13', day: 'Thursday' },
    // April
    { name: 'Bak Full Moon Poya Day', date: '2025-04-12', day: 'Saturday' },
    { name: 'Sinhala & Tamil New Year Eve', date: '2025-04-13', day: 'Sunday' },
    { name: 'Sinhala & Tamil New Year Day', date: '2025-04-14', day: 'Monday' },
    // May
    { name: 'May Day (International Workers\' Day)', date: '2025-05-01', day: 'Thursday' },
    { name: 'Vesak Full Moon Poya Day', date: '2025-05-12', day: 'Monday' },
    { name: 'Day after Vesak Full Moon Poya Day', date: '2025-05-13', day: 'Tuesday' },
    // June
    { name: 'Poson Full Moon Poya Day', date: '2025-06-10', day: 'Tuesday' },
    // July
    { name: 'Esala Full Moon Poya Day', date: '2025-07-10', day: 'Thursday' },
    // August
    { name: 'Nikini Full Moon Poya Day', date: '2025-08-08', day: 'Friday' },
    // September
    { name: 'Milad-Un-Nabi (Holy Prophet\'s Birthday)', date: '2025-09-05', day: 'Friday' },
    { name: 'Binara Full Moon Poya Day', date: '2025-09-07', day: 'Sunday' },
    // October
    { name: 'Vap Full Moon Poya Day', date: '2025-10-06', day: 'Monday' },
    // November
    { name: 'Il Full Moon Poya Day', date: '2025-11-05', day: 'Wednesday' },
    // December
    { name: 'Unduvap Full Moon Poya Day', date: '2025-12-04', day: 'Thursday' },
    { name: 'Christmas Day', date: '2025-12-25', day: 'Thursday' }
  ],
  2026: [
    // January
    { name: 'Duruthu Full Moon Poya Day', date: '2026-01-12', day: 'Monday' },
    { name: 'Tamil Thai Pongal Day', date: '2026-01-14', day: 'Wednesday' },
    // February
    { name: 'Independence Day', date: '2026-02-04', day: 'Wednesday' },
    { name: 'Navam Full Moon Poya Day', date: '2026-02-03', day: 'Tuesday' },
    // March
    { name: 'Medin Full Moon Poya Day', date: '2026-03-05', day: 'Thursday' },
    // April
    { name: 'Bak Full Moon Poya Day', date: '2026-04-02', day: 'Thursday' },
    { name: 'Sinhala & Tamil New Year Eve', date: '2026-04-13', day: 'Monday' },
    { name: 'Sinhala & Tamil New Year Day', date: '2026-04-14', day: 'Tuesday' },
    // May
    { name: 'May Day (International Workers\' Day)', date: '2026-05-01', day: 'Friday' },
    { name: 'Vesak Full Moon Poya Day', date: '2026-05-02', day: 'Saturday' },
    { name: 'Day after Vesak Full Moon Poya Day', date: '2026-05-03', day: 'Sunday' },
    // June
    { name: 'Poson Full Moon Poya Day', date: '2026-06-01', day: 'Monday' },
    // July
    { name: 'Esala Full Moon Poya Day', date: '2026-07-01', day: 'Wednesday' },
    // August
    { name: 'Nikini Full Moon Poya Day', date: '2026-07-29', day: 'Wednesday' },
    // September
    { name: 'Milad-Un-Nabi (Holy Prophet\'s Birthday)', date: '2026-09-05', day: 'Saturday' },
    { name: 'Binara Full Moon Poya Day', date: '2026-09-27', day: 'Sunday' },
    // October
    { name: 'Vap Full Moon Poya Day', date: '2026-10-26', day: 'Monday' },
    // November
    { name: 'Il Full Moon Poya Day', date: '2026-11-24', day: 'Tuesday' },
    // December
    { name: 'Unduvap Full Moon Poya Day', date: '2026-12-23', day: 'Wednesday' },
    { name: 'Christmas Day', date: '2026-12-25', day: 'Friday' }
  ]
};

export default function HolidayList() {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    // Get current year and next year
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Combine mercantile holidays from current and next year
    const allHolidays = [
      ...(MERCANTILE_HOLIDAYS[currentYear] || []),
      ...(MERCANTILE_HOLIDAYS[nextYear] || [])
    ];

    // Filter to show only upcoming holidays (from today onwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingHolidays = allHolidays
      .filter(holiday => new Date(holiday.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10) // Show only next 10 mercantile holidays
      .map((holiday, index) => {
        const holidayDate = new Date(holiday.date);
        return {
          id: index,
          name: holiday.name,
          date: holidayDate.getDate(),
          month: holidayDate.toLocaleString('default', { month: 'short' }).toUpperCase(),
          day: holiday.day,
          color: '#DADADA'
        };
      });

    setHolidays(upcomingHolidays);
  }, []);

  return (
    <div className="holiday-container">
      <div className="holiday-wrapper">
        <h2 className="holiday-title">Holidays</h2>
        
        <div className="holidays-list">
          {holidays.map((holiday) => (
            <div key={holiday.id} className="holiday-item">
              <div className="holiday-date-box" style={{ backgroundColor: holiday.color }}>
                <div className="holiday-date-number">{holiday.date}</div>
                <div className="holiday-date-month">{holiday.month}</div>
              </div>
              
              <div className="holiday-info">
                <h3 className="holiday-name">{holiday.name}</h3>
                <p className="holiday-day">{holiday.day}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

