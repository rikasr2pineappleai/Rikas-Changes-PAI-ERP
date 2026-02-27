// // Placeholder API layer - attendance
// export const fetchAttendance = async () => {
//   console.log('fetchAttendance called');
//   return Promise.resolve({ data: [], message: 'attendance placeholder' });
// };


// API layer for attendance management
import apiClient from '../utils/apiClient';

// Utility function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await apiClient.get(endpoint, options);
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Fetch all attendance records with pagination
export const fetchAllAttendanceRecords = async (page = 1, limit = 10) => {
  try {
    return await apiRequest(`/attendance/admin/records?page=${page}&limit=${limit}`);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }
};

// Fetch a single employee by id (User + EmployeeDetail including image_path)
export const fetchEmployeeById = async (employeeId) => {
  try {
    return await apiRequest(`/attendance/admin/employee/${employeeId}`);
  } catch (error) {
    console.error(`Error fetching employee ${employeeId}:`, error);
    throw error;
  }
};

// Fetch attendance records for a specific employee
export const fetchEmployeeAttendanceRecords = async (userId, page = 1, limit = 10) => {
  try {
    return await apiRequest(`/attendance/admin/records/${userId}?page=${page}&limit=${limit}`);
  } catch (error) {
    console.error(`Error fetching attendance records for user ${userId}:`, error);
    throw error;
  }
};

// Fetch all attendance records for all employees (no pagination)
export const fetchAllEmployeesAttendanceRecords = async () => {
  try {
    return await apiRequest('/attendance/admin/records/all');
  } catch (error) {
    console.error('Error fetching all employees attendance records:', error);
    throw error;
  }
};

// Fetch attendance trends
export const fetchAttendanceTrends = async () => {
  try {
    return await apiRequest('/attendance/admin/analytics/trends');
  } catch (error) {
    console.error('Error fetching attendance trends:', error);
    throw error;
  }
};

// Fetch attendance by department
export const fetchAttendanceByDepartment = async () => {
  try {
    return await apiRequest('/attendance/admin/analytics/departments');
  } catch (error) {
    console.error('Error fetching attendance by department:', error);
    throw error;
  }
};

// Fetch today's attendance summary
export const fetchTodayAttendanceSummary = async () => {
  try {
    // For now, we'll use the general records endpoint with a date filter
    // In the future, we could create a specific endpoint for this
    return await apiRequest('/attendance/admin/records?page=1&limit=100');
  } catch (error) {
    console.error("Error fetching today's attendance summary:", error);
    throw error;
  }
};

// Fetch today's attendance count
export const fetchTodayAttendanceCount = async () => {
  try {
    return await apiRequest('/attendance/admin/analytics/today-count');
  } catch (error) {
    console.error("Error fetching today's attendance count:", error);
    throw error;
  }
};

// Employee clock in
export const clockIn = async () => {
  try {
    const response = await apiClient.post('/attendance/employee/clock-in');
    return response.data;
  } catch (error) {
    console.error('Error clocking in:', error);
    throw error;
  }
};

// Employee clock out
export const clockOut = async () => {
  try {
    const response = await apiClient.post('/attendance/employee/clock-out');
    return response.data;
  } catch (error) {
    console.error('Error clocking out:', error);
    throw error;
  }
};

// Employee start break
export const startBreak = async () => {
  try {
    const response = await apiClient.post('/attendance/employee/start-break');
    return response.data;
  } catch (error) {
    console.error('Error starting break:', error);
    throw error;
  }
};

// Employee end break
export const endBreak = async () => {
  try {
    const response = await apiClient.post('/attendance/employee/end-break');
    return response.data;
  } catch (error) {
    console.error('Error ending break:', error);
    throw error;
  }
};

// Get today's attendance record
export const getTodayAttendance = async () => {
  try {
    return await apiRequest('/attendance/employee/today');
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    throw error;
  }
};

// Get employee attendance summary
export const getAttendanceSummary = async () => {
  try {
    return await apiRequest('/attendance/employee/summary');
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    throw error;
  }
};