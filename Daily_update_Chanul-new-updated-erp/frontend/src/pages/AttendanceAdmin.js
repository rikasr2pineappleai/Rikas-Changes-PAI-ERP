import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAllAttendanceRecords, fetchEmployeeAttendanceRecords, fetchAllEmployeesAttendanceRecords, fetchAttendanceTrends, fetchAttendanceByDepartment } from '../integration/attendanceAPI';
import '../styles/AttendanceAdmin.css';

export default function AttendanceAdmin() {
  const [searchParams] = useSearchParams();
  const urlEmployeeId = searchParams.get('employeeId');
  const employeeId = urlEmployeeId && !isNaN(urlEmployeeId) ? urlEmployeeId : null;
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [selectedUser, setSelectedUser] = useState(employeeId || '');
  const [users, setUsers] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [trends, setTrends] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('records'); // records, trends, departments

  // Fetch all attendance records
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        let response;
        
        if (employeeId && employeeId.trim()) {
          // If employeeId is provided, fetch records for that specific employee
          response = await fetchEmployeeAttendanceRecords(employeeId, currentPage, limit);
        } else {
          // Otherwise, fetch all attendance records
          response = await fetchAllAttendanceRecords(currentPage, limit);
        }
        
        setAttendanceData(response.data.attendance_records || []);
        setTotalPages(response.data.pagination?.pages || 1);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching attendance data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'records') {
      fetchAttendanceData();
    }
  }, [currentPage, limit, activeTab, employeeId]);

  // Fetch users for filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // For now, we'll use a mock list or fetch from employee API
        // In a real implementation, you would fetch from employee API
        setUsers([
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' },
          { id: 3, name: 'Robert Johnson' }
        ]);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    if (activeTab === 'records') {
      fetchUsers();
    }
  }, [activeTab]);

  // Fetch trends data
  useEffect(() => {
    const fetchTrendsData = async () => {
      try {
        const response = await fetchAttendanceTrends();
        setTrends(response.data.trends || []);
      } catch (err) {
        console.error('Error fetching trends data:', err);
      }
    };

    if (activeTab === 'trends') {
      fetchTrendsData();
    }
  }, [activeTab]);

  // Fetch department data
  useEffect(() => {
    const fetchDepartmentsData = async () => {
      try {
        const response = await fetchAttendanceByDepartment();
        setDepartments(response.data.departments || []);
      } catch (err) {
        console.error('Error fetching departments data:', err);
      }
    };

    if (activeTab === 'departments') {
      fetchDepartmentsData();
    }
  }, [activeTab]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      let response;

      if (employeeId && employeeId.trim()) {
        // If employeeId is provided from URL, always fetch records for that specific employee
        // regardless of selectedUser (selectedUser will be pre-filled with employeeId)
        response = await fetchEmployeeAttendanceRecords(employeeId, currentPage, limit);
      } else if (selectedUser) {
        response = await fetchEmployeeAttendanceRecords(selectedUser, currentPage, limit);
      } else {
        response = await fetchAllAttendanceRecords(currentPage, limit);
      }

      setAttendanceData(response.data.attendance_records || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error filtering attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetchAllEmployeesAttendanceRecords();
      
      // Create CSV from data
      const csvContent = convertToCSV(response.data.attendance_records);
      downloadCSV(csvContent, 'attendance_records.csv');
    } catch (err) {
      setError(err.message);
      console.error('Error exporting attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = ['ID', 'Employee Name', 'Date', 'Clock In', 'Clock Out', 'Status', 'Working Hours', 'Total Break Duration'];
    const headerString = headers.join(',');

    const rows = data.map(record => {
      const user = record.User || {};
      return [
        record.id,
        `"${user.first_name || ''} ${user.last_name || ''}"`,
        record.date,
        record.clock_in ? new Date(record.clock_in).toLocaleString() : '',
        record.clock_out ? new Date(record.clock_out).toLocaleString() : '',
        record.status,
        record.working_hours || 0,
        record.total_break_duration || 0
      ].join(',');
    });

    return `${headerString}\n${rows.join('\n')}`;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString();
  };

  return (
    <div className="attendance-admin-container">
      <div className="attendance-admin-header">
        <h1>Attendance Management</h1>
      </div>

      {/* Tab Navigation */}
      <div className="attendance-tabs">
        <button 
          className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          Records
        </button>
        <button 
          className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button 
          className={`tab-button ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
      </div>

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="attendance-records-tab">
          <div className="attendance-controls">
            <div className="filter-section">
              {employeeId ? (
                <div className="employee-specific-notice">
                  <p>Showing attendance records for employee ID: {employeeId}</p>
                </div>
              ) : (
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Employees</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              )}
              
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="date-input"
                placeholder="Start Date"
              />
              
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="date-input"
                placeholder="End Date"
              />
              
              <button onClick={handleFilter} className="filter-button">Filter</button>
              <button onClick={handleExport} className="export-button">Export All</button>
            </div>
          </div>

          {loading && (
            <div className="loading-container">
              <p>Loading attendance records...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p>Error: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="attendance-table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Status</th>
                      <th>Working Hours</th>
                      <th>Break Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((record) => {
                      const user = record.User || {};
                      return (
                        <tr key={record.id}>
                          <td>{record.id}</td>
                          <td>{user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'N/A'}</td>
                          <td>{formatDate(record.date)}</td>
                          <td>{formatTime(record.clock_in)}</td>
                          <td>{formatTime(record.clock_out)}</td>
                          <td>
                            <span className={`status-badge ${record.status === 'on_time' ? 'on-time' : 'late'}`}>
                              {record.status === 'on_time' ? 'On Time' : record.status === 'late' ? 'Late' : record.status}
                            </span>
                          </td>
                          <td>{record.working_hours || 0}h</td>
                          <td>{record.total_break_duration || 0}s</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="attendance-trends-tab">
          <h2>Attendance Trends</h2>
          {loading && <p>Loading trends data...</p>}
          {!loading && trends.length > 0 ? (
            <div className="trends-chart">
              {/* Simple visualization of trends */}
              <table className="trends-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Records</th>
                    <th>On Time</th>
                    <th>Late</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((trend, index) => (
                    <tr key={index}>
                      <td>{formatDate(trend.date)}</td>
                      <td>{trend.total_records}</td>
                      <td>{trend.on_time_count}</td>
                      <td>{trend.late_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading && (
            <p>No trends data available</p>
          )}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="attendance-departments-tab">
          <h2>Attendance by Department</h2>
          {loading && <p>Loading department data...</p>}
          {!loading && departments.length > 0 ? (
            <div className="departments-list">
              {departments.map((dept, index) => (
                <div key={index} className="department-item">
                  <h3>{dept.name}</h3>
                  <p>Total Records: {dept.total_records}</p>
                  <p>On Time: {dept.on_time_count}</p>
                  <p>Late: {dept.late_count}</p>
                  <p>Avg Working Hours: {dept.avg_working_hours}h</p>
                  <p>Attendance Rate: {dept.attendance_rate}%</p>
                </div>
              ))}
            </div>
          ) : !loading && (
            <p>No department-based attendance data available</p>
          )}
        </div>
      )}
    </div>
  );
}