// const { AttendanceRecord, User, sequelize } = require('../models');
// const { Op, fn, col, where } = require('sequelize');

// // Utility function to handle database errors
// const handleDatabaseError = (error, operation) => {
//   console.error(`${operation} error:`, error);
  
//   if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeHostNotFoundError') {
//     return {
//       success: false,
//       message: 'Database connection error. Please try again later.',
//       error: 'Database connection failed'
//     };
//   }
  
//   if (error.name === 'SequelizeDatabaseError') {
//     return {
//       success: false,
//       message: 'Database error occurred. Please try again later.',
//       error: 'Database operation failed'
//     };
//   }
  
//   return {
//     success: false,
//     message: `Server error during ${operation}`,
//     error: error.message
//   };
// };

// // @desc    Clock in employee
// // @route   POST /api/attendance/employee/clock-in
// // @access  Private (Employees)
// exports.clockIn = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const currentDate = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
    
//     // Check if user already clocked in today
//     const existingRecord = await AttendanceRecord.findOne({
//       where: {
//         user_id: userId,
//         date: currentDate
//       }
//     });
    
//     if (existingRecord && existingRecord.clock_in) {
//       return res.status(400).json({
//         success: false,
//         message: 'Already clocked in today'
//       });
//     }
    
//     const clockInTime = new Date();
    
//     // Determine if late (assuming 9:00 AM as deadline)
//     const lateThreshold = new Date();
//     lateThreshold.setHours(9, 0, 0, 0);
//     const status = clockInTime > lateThreshold ? 'late' : 'on_time';
    
//     let attendanceRecord;
    
//     if (existingRecord) {
//       // Update existing record
//       attendanceRecord = await existingRecord.update({
//         clock_in: clockInTime,
//         status: status,
//         updated_at: new Date()
//       });
//     } else {
//       // Create new record
//       attendanceRecord = await AttendanceRecord.create({
//         user_id: userId,
//         date: currentDate,
//         clock_in: clockInTime,
//         status: status,
//         created_at: new Date(),
//         updated_at: new Date()
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       message: 'Clocked in successfully',
//       data: {
//         id: attendanceRecord.id,
//         clock_in: attendanceRecord.clock_in,
//         status: attendanceRecord.status
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'clock in');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Clock out employee
// // @route   POST /api/attendance/employee/clock-out
// // @access  Private (Employees)
// exports.clockOut = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const currentDate = new Date().toISOString().split('T')[0];
    
//     // Find today's attendance record
//     const attendanceRecord = await AttendanceRecord.findOne({
//       where: {
//         user_id: userId,
//         date: currentDate
//       }
//     });
    
//     if (!attendanceRecord) {
//       return res.status(400).json({
//         success: false,
//         message: 'No clock in record found for today'
//       });
//     }
    
//     if (attendanceRecord.clock_out) {
//       return res.status(400).json({
//         success: false,
//         message: 'Already clocked out today'
//       });
//     }
    
//     const clockOutTime = new Date();
    
//     // Calculate working hours
//     const clockInTime = new Date(attendanceRecord.clock_in);
//     let totalBreakDuration = attendanceRecord.total_break_duration || 0;
    
//     // Calculate working hours in hours (excluding break time)
//     const workingMilliseconds = clockOutTime - clockInTime - (totalBreakDuration * 1000);
//     const workingHours = workingMilliseconds / (1000 * 60 * 60); // Convert to hours
    
//     // Update record
//     const updatedRecord = await attendanceRecord.update({
//       clock_out: clockOutTime,
//       working_hours: parseFloat(workingHours.toFixed(2)),
//       updated_at: new Date()
//     });
    
//     res.status(200).json({
//       success: true,
//       message: 'Clocked out successfully',
//       data: {
//         id: updatedRecord.id,
//         clock_out: updatedRecord.clock_out,
//         working_hours: updatedRecord.working_hours
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'clock out');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Start break
// // @route   POST /api/attendance/employee/start-break
// // @access  Private (Employees)
// exports.startBreak = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const currentDate = new Date().toISOString().split('T')[0];
    
//     // Find today's attendance record
//     const attendanceRecord = await AttendanceRecord.findOne({
//       where: {
//         user_id: userId,
//         date: currentDate
//       }
//     });
    
//     if (!attendanceRecord) {
//       return res.status(400).json({
//         success: false,
//         message: 'No attendance record found for today'
//       });
//     }
    
//     if (!attendanceRecord.clock_in) {
//       return res.status(400).json({
//         success: false,
//         message: 'Not clocked in yet'
//       });
//     }
    
//     if (attendanceRecord.break_start) {
//       return res.status(400).json({
//         success: false,
//         message: 'Already on break'
//       });
//     }
    
//     const breakStartTime = new Date();
    
//     // Update record
//     const updatedRecord = await attendanceRecord.update({
//       break_start: breakStartTime,
//       updated_at: new Date()
//     });
    
//     res.status(200).json({
//       success: true,
//       message: 'Break started successfully',
//       data: {
//         id: updatedRecord.id,
//         break_start: updatedRecord.break_start
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'start break');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    End break
// // @route   POST /api/attendance/employee/end-break
// // @access  Private (Employees)
// exports.endBreak = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const currentDate = new Date().toISOString().split('T')[0];
    
//     // Find today's attendance record
//     const attendanceRecord = await AttendanceRecord.findOne({
//       where: {
//         user_id: userId,
//         date: currentDate
//       }
//     });
    
//     if (!attendanceRecord) {
//       return res.status(400).json({
//         success: false,
//         message: 'No attendance record found for today'
//       });
//     }
    
//     if (!attendanceRecord.break_start) {
//       return res.status(400).json({
//         success: false,
//         message: 'Not on break currently'
//       });
//     }
    
//     const breakEndTime = new Date();
//     const breakStartTime = new Date(attendanceRecord.break_start);
    
//     // Calculate break duration in seconds
//     const breakDurationSeconds = Math.floor((breakEndTime - breakStartTime) / 1000);
    
//     // Update total break duration
//     const totalBreakDuration = (attendanceRecord.total_break_duration || 0) + breakDurationSeconds;
    
//     // Update record
//     const updatedRecord = await attendanceRecord.update({
//       break_start: null,
//       total_break_duration: totalBreakDuration,
//       updated_at: new Date()
//     });
    
//     res.status(200).json({
//       success: true,
//       message: 'Break ended successfully',
//       data: {
//         id: updatedRecord.id,
//         total_break_duration: updatedRecord.total_break_duration
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'end break');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Get today's attendance record
// // @route   GET /api/attendance/employee/today
// // @access  Private (Employees)
// exports.getTodayAttendance = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const currentDate = new Date().toISOString().split('T')[0];
    
//     // Find today's attendance record
//     const attendanceRecord = await AttendanceRecord.findOne({
//       where: {
//         user_id: userId,
//         date: currentDate
//       },
//       attributes: { exclude: ['user_id'] }
//     });
    
//     res.status(200).json({
//       success: true,
//       data: attendanceRecord || null
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'get today attendance');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Get employee attendance summary
// // @route   GET /api/attendance/employee/summary
// // @access  Private (Employees)
// exports.getAttendanceSummary = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     // Get total days worked
//     const totalDaysWorked = await AttendanceRecord.count({
//       where: {
//         user_id: userId,
//         clock_in: { [Op.not]: null }
//       }
//     });
    
//     // Get recent attendance records
//     const recentRecords = await AttendanceRecord.findAll({
//       where: { user_id: userId },
//       order: [['date', 'DESC']],
//       limit: 30
//     });
    
//     res.status(200).json({
//       success: true,
//       data: {
//         total_days_worked: totalDaysWorked,
//         recent_records: recentRecords
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'get attendance summary');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Get all attendance records with pagination
// // @route   GET /api/attendance/admin/records
// // @access  Private (Admin)
// exports.getAllAttendanceRecords = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
    
//     const { count, rows } = await AttendanceRecord.findAndCountAll({
//       limit,
//       offset,
//       order: [['date', 'DESC'], ['created_at', 'DESC']],
//       include: [{
//         model: User,
//         attributes: ['id', 'emp_id', 'first_name', 'last_name']
//       }]
//     });
    
//     res.status(200).json({
//       success: true,
//       data: {
//         attendance_records: rows,
//         pagination: {
//           page,
//           limit,
//           total: count,
//           pages: Math.ceil(count / limit)
//         }
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'get all attendance records');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Get attendance records for specific employee
// // @route   GET /api/attendance/admin/records/:userId
// // @access  Private (Admin)
// exports.getEmployeeAttendanceRecords = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
    
//     const { count, rows } = await AttendanceRecord.findAndCountAll({
//       where: { user_id: userId },
//       limit,
//       offset,
//       order: [['date', 'DESC']],
//       include: [{
//         model: User,
//         attributes: ['id', 'emp_id', 'first_name', 'last_name']
//       }]
//     });
    
//     res.status(200).json({
//       success: true,
//       data: {
//         attendance_records: rows,
//         pagination: {
//           page,
//           limit,
//           total: count,
//           pages: Math.ceil(count / limit)
//         }
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'get employee attendance records');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Get all attendance records for all employees (without pagination)
// // @route   GET /api/attendance/admin/records/all
// // @access  Private (Admin)
// exports.getAllEmployeesAttendanceRecords = async (req, res) => {
//   try {
//     const attendanceRecords = await AttendanceRecord.findAll({
//       order: [['date', 'DESC'], ['created_at', 'DESC']],
//       include: [{
//         model: User,
//         attributes: ['id', 'emp_id', 'first_name', 'last_name']
//       }]
//     });
    
//     res.status(200).json({
//       success: true,
//       data: {
//         attendance_records: attendanceRecords
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'get all employees attendance records');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Get attendance trends data
// // @route   GET /api/attendance/admin/analytics/trends
// // @access  Private (Admin)
// exports.getAttendanceTrends = async (req, res) => {
//   try {
//     // Get attendance trends for the last 30 days
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
//     const trends = await AttendanceRecord.findAll({
//       where: {
//         date: {
//           [Op.gte]: thirtyDaysAgo
//         }
//       },
//       attributes: [
//         'date',
//         [fn('COUNT', col('id')), 'total_records'],
//         [sequelize.literal('SUM(CASE WHEN status = "on_time" THEN 1 ELSE 0 END)'), 'on_time_count'],
//         [sequelize.literal('SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END)'), 'late_count']
//       ],
//       group: ['date'],
//       order: [['date', 'ASC']]
//     });
    
//     res.status(200).json({
//       success: true,
//       data: {
//         trends
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'get attendance trends');
//     res.status(500).json(errorResponse);
//   }
// };

// // @desc    Get average attendance by department
// // @route   GET /api/attendance/admin/analytics/departments
// // @access  Private (Admin)
// exports.getAttendanceByDepartment = async (req, res) => {
//   try {
//     // This would require department information which is not in the current model
//     // For now, we'll return a placeholder response
//     res.status(200).json({
//       success: true,
//       data: {
//         departments: [],
//         message: 'Department data not implemented - requires Department model integration'
//       }
//     });
//   } catch (error) {
//     const errorResponse = handleDatabaseError(error, 'get attendance by department');
//     res.status(500).json(errorResponse);
//   }
// };


const { AttendanceRecord, User, sequelize } = require('../models');
const { Op, fn, col, where } = require('sequelize');

// Utility function to handle database errors
const handleDatabaseError = (error, operation) => {
  console.error(`${operation} error:`, error);
  
  if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeHostNotFoundError') {
    return {
      success: false,
      message: 'Database connection error. Please try again later.',
      error: 'Database connection failed'
    };
  }
  
  if (error.name === 'SequelizeDatabaseError') {
    return {
      success: false,
      message: 'Database error occurred. Please try again later.',
      error: 'Database operation failed'
    };
  }
  
  return {
    success: false,
    message: `Server error during ${operation}`,
    error: error.message
  };
};

// @desc    Clock in employee
// @route   POST /api/attendance/employee/clock-in
// @access  Private (Employees)
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
    
    // Check if user already clocked in today
    const existingRecord = await AttendanceRecord.findOne({
      where: {
        user_id: userId,
        date: currentDate
      }
    });
    
    if (existingRecord && existingRecord.clock_in) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today'
      });
    }
    
    const clockInTime = new Date();
    
    // Determine status based on new thresholds: on-time window is 6:45 AM to 7:00 AM (inclusive)
    const onTimeStart = new Date();
    onTimeStart.setHours(6, 45, 0, 0); // 6:45 AM - start of on-time window
    const onTimeEnd = new Date();
    onTimeEnd.setHours(7, 0, 0, 0); // 7:00 AM - end of on-time window
    
    // Extract time components for comparison (hours and minutes only)
    const clockInHours = clockInTime.getHours();
    const clockInMinutes = clockInTime.getMinutes();
    const clockInTotalMinutes = clockInHours * 60 + clockInMinutes;
    const onTimeStartTotalMinutes = 6 * 60 + 45; // 6:45 AM = 405 minutes from midnight
    const onTimeEndTotalMinutes = 7 * 60 + 0; // 7:00 AM = 420 minutes from midnight
    
    let status;
    if (clockInTotalMinutes >= onTimeStartTotalMinutes && clockInTotalMinutes <= onTimeEndTotalMinutes) {
      status = 'on_time'; // On time if within the window (inclusive)
    } else if (clockInTotalMinutes < onTimeStartTotalMinutes) {
      status = 'early_arrival'; // Early arrival if before the window
    } else {
      status = 'late'; // Late if after the window
    }
    
    let attendanceRecord;
    
    if (existingRecord) {
      // Update existing record
      attendanceRecord = await existingRecord.update({
        clock_in: clockInTime,
        status: status,
        updated_at: new Date()
      });
    } else {
      // Create new record
      attendanceRecord = await AttendanceRecord.create({
        user_id: userId,
        date: currentDate,
        clock_in: clockInTime,
        status: status,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Clocked in successfully',
      data: {
        id: attendanceRecord.id,
        clock_in: attendanceRecord.clock_in,
        status: attendanceRecord.status,
        total_break_duration: attendanceRecord.total_break_duration || 0
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'clock in');
    res.status(500).json(errorResponse);
  }
};

// @desc    Clock out employee
// @route   POST /api/attendance/employee/clock-out
// @access  Private (Employees)
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Find today's attendance record
    const attendanceRecord = await AttendanceRecord.findOne({
      where: {
        user_id: userId,
        date: currentDate
      }
    });
    
    if (!attendanceRecord) {
      return res.status(400).json({
        success: false,
        message: 'No clock in record found for today'
      });
    }
    
    if (attendanceRecord.clock_out) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today'
      });
    }
    
    const clockOutTime = new Date();
    
    // Calculate working hours
    const clockInTime = new Date(attendanceRecord.clock_in);
    let totalBreakDuration = attendanceRecord.total_break_duration || 0;
    
    // Calculate working hours in hours (excluding break time)
    const workingMilliseconds = clockOutTime - clockInTime - (totalBreakDuration * 1000);
    const workingHours = workingMilliseconds / (1000 * 60 * 60); // Convert to hours
    
    // Update record
    const updatedRecord = await attendanceRecord.update({
      clock_out: clockOutTime,
      working_hours: parseFloat(workingHours.toFixed(2)),
      updated_at: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        id: updatedRecord.id,
        clock_out: updatedRecord.clock_out,
        working_hours: updatedRecord.working_hours,
        total_break_duration: updatedRecord.total_break_duration || 0
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'clock out');
    res.status(500).json(errorResponse);
  }
};

// @desc    Start break
// @route   POST /api/attendance/employee/start-break
// @access  Private (Employees)
exports.startBreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Find today's attendance record
    const attendanceRecord = await AttendanceRecord.findOne({
      where: {
        user_id: userId,
        date: currentDate
      }
    });
    
    if (!attendanceRecord) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for today'
      });
    }
    
    if (!attendanceRecord.clock_in) {
      return res.status(400).json({
        success: false,
        message: 'Not clocked in yet'
      });
    }
    
    if (attendanceRecord.break_start) {
      return res.status(400).json({
        success: false,
        message: 'Already on break'
      });
    }
    
    const breakStartTime = new Date();
    
    // Update record
    const updatedRecord = await attendanceRecord.update({
      break_start: breakStartTime,
      updated_at: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Break started successfully',
      data: {
        id: updatedRecord.id,
        break_start: updatedRecord.break_start
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'start break');
    res.status(500).json(errorResponse);
  }
};

// @desc    End break
// @route   POST /api/attendance/employee/end-break
// @access  Private (Employees)
exports.endBreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Find today's attendance record
    const attendanceRecord = await AttendanceRecord.findOne({
      where: {
        user_id: userId,
        date: currentDate
      }
    });
    
    if (!attendanceRecord) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for today'
      });
    }
    
    if (!attendanceRecord.break_start) {
      return res.status(400).json({
        success: false,
        message: 'Not on break currently'
      });
    }
    
    const breakEndTime = new Date();
    const breakStartTime = new Date(attendanceRecord.break_start);
    
    // Calculate break duration in seconds
    const breakDurationSeconds = Math.floor((breakEndTime - breakStartTime) / 1000);
    
    // Update total break duration
    const totalBreakDuration = (attendanceRecord.total_break_duration || 0) + breakDurationSeconds;
    
    // Update record
    const updatedRecord = await attendanceRecord.update({
      break_start: null,
      total_break_duration: totalBreakDuration,
      updated_at: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Break ended successfully',
      data: {
        id: updatedRecord.id,
        break_start: updatedRecord.break_start,
        total_break_duration: updatedRecord.total_break_duration
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'end break');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get today's attendance record
// @route   GET /api/attendance/employee/today
// @access  Private (Employees)
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Find today's attendance record
    const attendanceRecord = await AttendanceRecord.findOne({
      where: {
        user_id: userId,
        date: currentDate
      },
      attributes: { exclude: ['user_id'] }
    });
    
    res.status(200).json({
      success: true,
      data: attendanceRecord || null
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get today attendance');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get employee attendance summary
// @route   GET /api/attendance/employee/summary
// @access  Private (Employees)
exports.getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total days worked
    const totalDaysWorked = await AttendanceRecord.count({
      where: {
        user_id: userId,
        clock_in: { [Op.not]: null }
      }
    });
    
    // Get recent attendance records
    const recentRecords = await AttendanceRecord.findAll({
      where: { user_id: userId },
      order: [['date', 'DESC']],
      limit: 30
    });
    
    res.status(200).json({
      success: true,
      data: {
        total_days_worked: totalDaysWorked,
        recent_records: recentRecords
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get attendance summary');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all attendance records with pagination
// @route   GET /api/attendance/admin/records
// @access  Private (Admin)
exports.getAllAttendanceRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await AttendanceRecord.findAndCountAll({
      limit,
      offset,
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'emp_id', 'first_name', 'last_name', 'designation'],
        include: [{
          model: User.sequelize.models.EmployeeDetail,
          attributes: ['image_path']
        }]
      }]
    });
    
    res.status(200).json({
      success: true,
      data: {
        attendance_records: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get all attendance records');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get attendance records for specific employee
// @route   GET /api/attendance/admin/records/:userId
// @access  Private (Admin)
exports.getEmployeeAttendanceRecords = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await AttendanceRecord.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      order: [['date', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'emp_id', 'first_name', 'last_name', 'designation'],
        include: [{
          model: User.sequelize.models.EmployeeDetail,
          attributes: ['image_path']
        }]
      }]
    });
    
    res.status(200).json({
      success: true,
      data: {
        attendance_records: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get employee attendance records');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all attendance records for all employees (without pagination)
// @route   GET /api/attendance/admin/records/all
// @access  Private (Admin)
exports.getAllEmployeesAttendanceRecords = async (req, res) => {
  try {
    const attendanceRecords = await AttendanceRecord.findAll({
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'emp_id', 'first_name', 'last_name', 'designation'],
        include: [{
          model: User.sequelize.models.EmployeeDetail,
          attributes: ['image_path']
        }]
      }]
    });
    
    res.status(200).json({
      success: true,
      data: {
        attendance_records: attendanceRecords
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get all employees attendance records');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get attendance trends data
// @route   GET /api/attendance/admin/analytics/trends
// @access  Private (Admin)
exports.getAttendanceTrends = async (req, res) => {
  try {
    // Get attendance trends for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const trends = await AttendanceRecord.findAll({
      where: {
        date: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      attributes: [
        'date',
        [fn('COUNT', col('id')), 'total_records'],
        [sequelize.literal('SUM(CASE WHEN status = "on_time" THEN 1 ELSE 0 END)'), 'on_time_count'],
        [sequelize.literal('SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END)'), 'late_count']
      ],
      group: ['date'],
      order: [['date', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        trends
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get attendance trends');
    res.status(500).json(errorResponse);
  }
};
// @desc    Get average attendance by department
// @route   GET /api/attendance/admin/analytics/departments
// @access  Private (Admin)
exports.getAttendanceByDepartment = async (req, res) => {
  try {
    // Join attendance records with users to get department information
    const attendanceByDepartment = await AttendanceRecord.findAll({
      attributes: [
        [fn('COUNT', col('AttendanceRecord.id')), 'total_records'],
        [fn('COUNT', where(col('AttendanceRecord.status'), 'on_time')), 'on_time_count'],
        [fn('COUNT', where(col('AttendanceRecord.status'), 'late')), 'late_count'],
        [fn('AVG', col('AttendanceRecord.working_hours')), 'avg_working_hours']
      ],
      include: [{
        model: User,
        attributes: ['department'],
        required: true
      }],
      group: ['User.department'],
      raw: true
    });
    
    // Transform the data to include attendance rate percentages
    const departments = attendanceByDepartment.map(dept => {
      const total = parseInt(dept.total_records);
      const onTime = parseInt(dept.on_time_count);
      const late = parseInt(dept.late_count);
      const attendanceRate = total > 0 ? ((onTime + late) / total) * 100 : 0;
      
      return {
        name: dept.department || 'Unknown Department',
        total_records: total,
        on_time_count: onTime,
        late_count: late,
        avg_working_hours: parseFloat(dept.avg_working_hours?.toFixed(2)) || 0,
        attendance_rate: parseFloat(attendanceRate.toFixed(2))
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        departments: departments
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get attendance by department');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get today's attendance count
// @route   GET /api/attendance/admin/analytics/today-count
// @access  Private (Admin)
exports.getTodayAttendanceCount = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const count = await AttendanceRecord.count({
      where: {
        date: today,
        clock_in: { [Op.not]: null } // Only count those who have clocked in
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        count: count
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get today attendance count');
    res.status(500).json(errorResponse);
  }
};

// @desc    Get single employee by id (User + EmployeeDetail including image_path)
// @route   GET /api/attendance/admin/employee/:employeeId
// @access  Private (Admin)
exports.getEmployeeById = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const user = await User.findByPk(employeeId, {
      attributes: ['id', 'emp_id', 'first_name', 'last_name', 'designation'],
      include: [{
        model: User.sequelize.models.EmployeeDetail,
        attributes: ['image_path']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employee: user
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'get employee by id');
    res.status(500).json(errorResponse);
  }
};