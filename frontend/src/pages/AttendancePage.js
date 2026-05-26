// import React, { useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Pagination from '../components/Pagination';
// import backIcon from '../assets/icons/title_back.png';
// import sortIcon from '../assets/icons/A-Z.png';
// import './Pages.css';
// import './AttendancePage.css';

// const AttendancePage = () => {
//   const navigate = useNavigate();

//   const handleBack = () => {
//     navigate(-1);
//   };

//   const [currentPage, setCurrentPage] = useState(1);
//   const pageSize = 8;

//   const attendanceData = useMemo(
//     () => [
//       { date: '22 Nov 2025', checkIn: '09:00 AM', checkOut: '06:00 PM', break: '00:45', workingHours: '08:15', status: 'On Time' },
//       { date: '21 Nov 2025', checkIn: '09:05 AM', checkOut: '05:55 PM', break: '00:30', workingHours: '08:20', status: 'On Time' },
//       { date: '20 Nov 2025', checkIn: '08:58 AM', checkOut: '06:10 PM', break: '00:40', workingHours: '08:32', status: 'On Time' },
//       { date: '19 Nov 2025', checkIn: '09:12 AM', checkOut: '06:05 PM', break: '00:50', workingHours: '07:58', status: 'Late' },
//       { date: '18 Nov 2025', checkIn: '09:01 AM', checkOut: '05:45 PM', break: '00:35', workingHours: '08:09', status: 'On Time' },
//       { date: '17 Nov 2025', checkIn: '09:20 AM', checkOut: '06:15 PM', break: '00:30', workingHours: '08:25', status: 'Late' },
//       { date: '16 Nov 2025', checkIn: '09:00 AM', checkOut: '06:00 PM', break: '00:45', workingHours: '08:15', status: 'On Time' },
//       { date: '15 Nov 2025', checkIn: '08:50 AM', checkOut: '05:45 PM', break: '00:40', workingHours: '08:15', status: 'On Time' },
//       { date: '14 Nov 2025', checkIn: '08:45 AM', checkOut: '05:50 PM', break: '00:35', workingHours: '08:30', status: 'On Time' },
//       { date: '13 Nov 2025', checkIn: '09:30 AM', checkOut: '06:20 PM', break: '00:40', workingHours: '07:50', status: 'Late' },
//     ],
//     []
//   );

//   const totalPages = Math.max(1, Math.ceil(attendanceData.length / pageSize));

//   const currentRows = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return attendanceData.slice(start, start + pageSize);
//   }, [attendanceData, currentPage]);

//   return (
//     <div className="page-container attendance-page">
//       <div className="attendance-header-card">
//         <button className="attendance-back-button" onClick={handleBack} aria-label="Go back">
//           <img src={backIcon} alt="Back" />
//         </button>
//         <h1 className="attendance-header-title">Attendance</h1>
//       </div>

//       <div className="attendance-table-wrapper">
//         <div className="attendance-table">
//           <div className="attendance-table-header">
//             <div className="attendance-table-header-cell attendance-table-header-cell--date">
//               <span>Date</span>
//               <img src={sortIcon} alt="Sort by Date" className="attendance-table-sort-icon" />
//             </div>
//             <div className="attendance-table-header-cell">Check In</div>
//             <div className="attendance-table-header-cell">Check Out</div>
//             <div className="attendance-table-header-cell">Break</div>
//             <div className="attendance-table-header-cell">Working Hours</div>
//             <div className="attendance-table-header-cell">Status</div>
//           </div>

//           <div className="attendance-table-body">
//             {currentRows.map((row, index) => (
//               <div className="attendance-table-row" key={row.date + index}>
//                 <div className="attendance-table-cell attendance-table-cell--date">{row.date}</div>
//                 <div className="attendance-table-cell">{row.checkIn}</div>
//                 <div className="attendance-table-cell">{row.checkOut}</div>
//                 <div className="attendance-table-cell">{row.break}</div>
//                 <div className="attendance-table-cell">{row.workingHours}</div>
//                 <div className="attendance-table-cell attendance-table-cell--status">
//                   <span className={`attendance-status attendance-status--${row.status.toLowerCase().replace(' ', '')}`}>
//                     {row.status}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="attendance-card-list">
//         {currentRows.map((row, index) => (
//           <div className="attendance-card" key={`card-${row.date}-${index}`}>
//             <div className="attendance-card-header">
//               <span className="attendance-card-date">{row.date}</span>
//               <span className={`attendance-status attendance-status--${row.status.toLowerCase().replace(' ', '')}`}>
//                 {row.status}
//               </span>
//             </div>
//             <div className="attendance-card-body">
//               <div className="attendance-card-field">
//                 <p>In</p>
//                 <strong>{row.checkIn}</strong>
//               </div>
//               <div className="attendance-card-field">
//                 <p>Out</p>
//                 <strong>{row.checkOut}</strong>
//               </div>
//               <div className="attendance-card-field">
//                 <p>Break</p>
//                 <strong>{row.break}</strong>
//               </div>
//               <div className="attendance-card-field">
//                 <p>Hours</p>
//                 <strong>{row.workingHours}</strong>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="attendance-pagination">
//         <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
//       </div>
//     </div>
//   );
// };


// export default AttendancePage;

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import backIcon from '../assets/icons/title_back.png';
import sortIcon from '../assets/icons/A-Z.png';
import './Pages.css';
import './AttendancePage.css';
import { fetchEmployeeAttendanceRecords } from '../integration/attendanceAPI';

const AttendancePage = () => {
  const navigate = useNavigate();
  const { employeeId: routeEmployeeId } = useParams();
  const [searchParams] = useSearchParams();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get employee ID from either route parameter or query parameter and validate it
  const urlEmployeeId = routeEmployeeId || searchParams.get('employeeId');
  const effectiveEmployeeId = urlEmployeeId && !isNaN(urlEmployeeId) ? urlEmployeeId : null;
  
  const handleBack = () => {
    navigate(-1);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        // Use the employee ID from URL parameters instead of authenticated user
        if (effectiveEmployeeId) {
          const response = await fetchEmployeeAttendanceRecords(effectiveEmployeeId, currentPage, pageSize);
          if (response && response.data && response.data.attendance_records) {
            // Transform backend data to match frontend format
            const transformedData = response.data.attendance_records.map(record => ({
              date: record.date ? new Date(record.date).toLocaleDateString('en-GB') : 'N/A',
              checkIn: record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
              checkOut: record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
              break: formatBreakDuration(record.total_break_duration || 0),
              workingHours: record.working_hours ? formatWorkingHours(record.working_hours) : 'N/A',
              status: record.status || 'Unknown'
            }));
            
            setAttendanceData(transformedData);
            
            // Update total pages from API response if available
            if (response.data.pagination && response.data.pagination.pages) {
              setTotalPages(response.data.pagination.pages);
            }
          }
        } else {
          // Check if we're supposed to show specific employee data but no valid ID was provided
          const hasEmployeeIdParam = urlEmployeeId;
          if (hasEmployeeIdParam) {
            setError('Invalid Employee ID provided');
          } else {
            setError('Employee ID not provided');
          }
        }
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [effectiveEmployeeId, currentPage]);
  
  // Helper function to format break duration: "HH:MM Min" if < 1 hour, "HH:MM Hrs" if >= 1 hour
  const formatBreakDuration = (seconds) => {
    if (!seconds) return '00:00 Min';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');

    return hours === 0 ? `${hh}:${mm} Min` : `${hh}:${mm} Hrs`;
  };

  // Helper function to format working hours as "HH.MM Hrs"
  const formatWorkingHours = (hoursFloat) => {
    if (!hoursFloat) return '00.00 Hrs';

    const hours = Math.floor(hoursFloat);
    const minutes = Math.round((hoursFloat - hours) * 60);

    return `${hours.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')} Hrs`;
  };

  const [totalPages, setTotalPages] = useState(1);
  
  // The API returns paginated data, so currentRows is just attendanceData
  const currentRows = attendanceData;

  if (loading) {
    return (
      <div className="page-container attendance-page">
        <div className="attendance-header-card">
          <button className="attendance-back-button" onClick={handleBack} aria-label="Go back">
            <img src={backIcon} alt="Back" />
          </button>
          <h1 className="attendance-header-title">Attendance</h1>
        </div>
        <div className="loading-container" style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container attendance-page">
        <div className="attendance-header-card">
          <button className="attendance-back-button" onClick={handleBack} aria-label="Go back">
            <img src={backIcon} alt="Back" />
          </button>
          <h1 className="attendance-header-title">Attendance</h1>
        </div>
        <div className="error-container" style={{ padding: '20px', textAlign: 'center', color: 'red', backgroundColor: '#ffe6e6', margin: '10px', borderRadius: '4px' }}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container attendance-page">
      <div className="attendance-header-card">
        <button className="attendance-back-button" onClick={handleBack} aria-label="Go back">
          <img src={backIcon} alt="Back" />
        </button>
        <h1 className="attendance-header-title">Attendance</h1>
      </div>

      <div className="attendance-table-wrapper">
        <div className="attendance-table">
          <div className="attendance-table-header">
            <div className="attendance-table-header-cell attendance-table-header-cell--date">
              <span>Date</span>
              <img src={sortIcon} alt="Sort by Date" className="attendance-table-sort-icon" />
            </div>
            <div className="attendance-table-header-cell">Check In</div>
            <div className="attendance-table-header-cell">Check Out</div>
            <div className="attendance-table-header-cell">Break</div>
            <div className="attendance-table-header-cell">Working Hours</div>
            <div className="attendance-table-header-cell">Status</div>
          </div>

          <div className="attendance-table-body">
            {currentRows.length > 0 ? (
              currentRows.map((row, index) => (
                <div className="attendance-table-row" key={row.date + index}>
                  <div className="attendance-table-cell attendance-table-cell--date">{row.date}</div>
                  <div className="attendance-table-cell">{row.checkIn}</div>
                  <div className="attendance-table-cell">{row.checkOut}</div>
                  <div className="attendance-table-cell">{row.break}</div>
                  <div className="attendance-table-cell">{row.workingHours}</div>
                  <div className="attendance-table-cell attendance-table-cell--status">
                    <span className={`attendance-status attendance-status--${row.status.toLowerCase().replace(' ', '')}`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="attendance-table-row" style={{ textAlign: 'center', padding: '20px' }}>
                <div className="attendance-table-cell" colSpan="6">No attendance records found</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="attendance-card-list">
        {currentRows.length > 0 ? (
          currentRows.map((row, index) => (
            <div className="attendance-card" key={`card-${row.date}-${index}`}>
              <div className="attendance-card-header">
                <span className="attendance-card-date">{row.date}</span>
                <span className={`attendance-status attendance-status--${row.status.toLowerCase().replace(' ', '')}`}>
                  {row.status}
                </span>
              </div>
              <div className="attendance-card-body">
                <div className="attendance-card-field">
                  <p>In</p>
                  <strong>{row.checkIn}</strong>
                </div>
                <div className="attendance-card-field">
                  <p>Out</p>
                  <strong>{row.checkOut}</strong>
                </div>
                <div className="attendance-card-field">
                  <p>Break</p>
                  <strong>{row.break}</strong>
                </div>
                <div className="attendance-card-field">
                  <p>Hours</p>
                  <strong>{row.workingHours}</strong>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="attendance-card" style={{ textAlign: 'center', padding: '20px' }}>
            <p>No attendance records found</p>
          </div>
        )}
      </div>

      <div className="attendance-pagination">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};

export default AttendancePage;