// controllers/leavebalance.controller.js
const db = require('../models');
const { Op } = db.sequelize;
const LeaveBalance = db.LeaveBalance;
const LeaveRequest = db.LeaveRequest;
const LeaveServices = require('../services/LeaveService');

const isSequelizeValidationError = (err) =>
  err && (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError');

/**
 * GET /api/leave-balance
 * Optional query: user_id, leave_type_id, year, limit, offset
 */
exports.getAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.user_id) where.user_id = req.query.user_id;
    if (req.query.leave_type_id) where.leave_type_id = req.query.leave_type_id;
    if (req.query.year) where.year = parseInt(req.query.year, 10);

    let limit = parseInt(req.query.limit, 10) || 100;
    let offset = parseInt(req.query.offset, 10) || 0;
    if (limit < 1) limit = 1;
    if (limit > 1000) limit = 1000;
    if (offset < 0) offset = 0;

    const result = await LeaveBalance.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'ASC']]
    });

    res.json({ count: result.count, rows: result.rows, limit, offset });
  } catch (err) {
    console.error('Error fetching leave balances:', err);
    if (isSequelizeValidationError(err)) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * GET /api/leave-balance/:id
 */
exports.getById = async (req, res) => {
  try {
    const rec = await LeaveBalance.findByPk(req.params.id);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    return res.json(rec);
  } catch (err) {
    console.error('Error fetching leave balance by id:', err);
    if (isSequelizeValidationError(err)) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * POST /api/leave-balance/move-from-request
 * Body: { leave_request_id: <id> }
 * Manually trigger move (service will create or update LeaveBalance).
 */
exports.moveFromRequest = async (req, res) => {
  const { leave_request_id } = req.body;
  if (!leave_request_id) return res.status(400).json({ error: 'leave_request_id is required' });

  try {
    const leaveReq = await LeaveRequest.findByPk(leave_request_id);
    if (!leaveReq) return res.status(404).json({ error: 'LeaveRequest not found' });

    const lb = await LeaveServices.addToLeaveBalance(leaveReq);
    return res.status(200).json({ message: 'Moved to leave_balance', data: lb });
  } catch (err) {
    console.error('Error moving to leave_balance:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * POST /api/leave-balance/revert-from-request       
 * Body: { leave_request_id: <id> }
 * Manually revert (subtract) a previously moved request.
 */
exports.revertFromRequest = async (req, res) => {
  const { leave_request_id } = req.body;
  if (!leave_request_id) return res.status(400).json({ error: 'leave_request_id is required' });
  
  try {
    const leaveReq = await LeaveRequest.findByPk(leave_request_id);
    if (!leaveReq) return res.status(404).json({ error: 'LeaveRequest not found' });
    
    const lb = await LeaveServices.removeFromLeaveBalance(leaveReq);
    return res.status(200).json({ message: 'Reverted from leave_balance', data: lb });
  } catch (err) {
    console.error('Error reverting from leave_balance:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * GET /api/leave-balance/user/:userId
 * Get leave balances for a specific user (user can get their own, admin can get any)
 */
exports.getByUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const currentUserId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    
    // Check authorization: user can only access their own data, admin can access any
    if (userRole !== 'admin' && currentUserId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only access your own leave balances.' });
    }

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await LeaveBalance.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: db.LeaveType,
          attributes: ['id', 'leave_name', 'leave_type', 'day_count']
        }
      ]
    });

    // Calculate available, consumed, and total for each leave type
    const leaveBalances = result.rows.map(balance => {
      const consumed = parseFloat(balance.leave_taken || 0);
      const total = parseFloat(balance.leave_balance || 0);
      const available = total - consumed;

      return {
        id: balance.id,
        user_id: balance.user_id,
        leave_type_id: balance.leave_type_id,
        year: balance.year,
        total,
        consumed,
        available,
        leave_type: balance.LeaveType ? balance.LeaveType.leave_type : null,
        leave_name: balance.LeaveType ? balance.LeaveType.leave_name : null
      };
    });

    res.json({ 
      count: result.count, 
      rows: leaveBalances 
    });
  } catch (err) {
    console.error('Error fetching leave balances by user:', err);
    if (isSequelizeValidationError(err)) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * GET /api/leave-balance/user/:userId/summary
 * Get leave balance summary for a specific user (formatted for pie charts)
 */
exports.getUserBalanceSummary = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const currentUserId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    
    // Check authorization: user can only access their own data, admin can access any
    if (userRole !== 'admin' && currentUserId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only access your own leave balances.' });
    }

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get current year to filter leave balances
    const currentYear = new Date().getFullYear();

    // Get all approved leave requests for the user (across all years)
    const approvedLeaveRequests = await db.LeaveRequest.findAll({
      where: {
        user_id: userId,
        status: 'approved'
      },
      attributes: ['leave_type_id', 'number_of_days']
    });

    // Calculate consumed days from approved requests
    const consumedByType = {};
    approvedLeaveRequests.forEach(request => {
      const type_id = request.leave_type_id;
      if (!consumedByType[type_id]) {
        consumedByType[type_id] = 0;
      }
      consumedByType[type_id] += parseFloat(request.number_of_days || 0);
    });

    // Get existing leave balances or create defaults
    const result = await LeaveBalance.findAll({
      where: { 
        user_id: userId,
        year: currentYear
      },
      include: [
        {
          model: db.LeaveType,
          attributes: ['id', 'leave_name', 'leave_type', 'day_count']
        }
      ]
    });

    // Get all available leave types to ensure all are represented in the response
    const allLeaveTypes = await db.LeaveType.findAll({
      attributes: ['id', 'leave_name', 'leave_type', 'day_count']
    });
    
    // Initialize groupedSummary with all leave types, defaulting to 0 values
    const groupedSummary = {};
    
    // Process existing leave balances
    const leaveSummary = result.map(balance => {
      // Use consumed days from approved requests instead of stored leave_taken
      const consumed = parseFloat(consumedByType[balance.leave_type_id] || 0);
      // Use day_count from LeaveType for total allocation instead of leave_balance from LeaveBalance
      const total = parseFloat(balance.LeaveType ? balance.LeaveType.day_count || 0 : 0);
      const available = total - consumed;

      return {
        id: balance.id,
        leave_type_id: balance.leave_type_id,
        leave_type: balance.LeaveType ? balance.LeaveType.leave_type : null,
        leave_name: balance.LeaveType ? balance.LeaveType.leave_name : null,
        total: Math.round(total * 10) / 10, // Round to 1 decimal
        consumed: Math.round(consumed * 10) / 10,
        available: Math.round(available * 10) / 10
      };
    });

    // Process existing leave balances
    leaveSummary.forEach(item => {
      // Normalize the leave type name for consistent frontend handling
      let normalizedType = 'other';
      
      if (item.leave_name) {
        const name = item.leave_name.toLowerCase();
        if (name.includes('casual')) normalizedType = 'casual';
        else if (name.includes('sick')) normalizedType = 'sick';
        else if (name.includes('annual') || name.includes('yearly')) normalizedType = 'annual';
        else if (name.includes('emergancy') || name.includes('emergency')) normalizedType = 'emergency';
        else normalizedType = name.replace(/\s+/g, '').toLowerCase(); // Use original name if no match
      } else if (item.leave_type) {
        const type = item.leave_type.toLowerCase();
        if (type.includes('casual')) normalizedType = 'casual';
        else if (type.includes('sick')) normalizedType = 'sick';
        else if (type.includes('annual') || type.includes('yearly')) normalizedType = 'annual';
        else if (type.includes('emergancy') || type.includes('emergency')) normalizedType = 'emergency';
        else normalizedType = type.replace(/\s+/g, '').toLowerCase(); // Use original type if no match
      }

      groupedSummary[normalizedType] = {
        total: item.total,
        consumed: item.consumed,
        available: item.available,
        leave_type_id: item.leave_type_id,
        leave_name: item.leave_name
      };
    });
    
    // Ensure all relevant leave types are represented in the summary
    allLeaveTypes.forEach(leaveType => {
      let normalizedType = 'other';
      
      if (leaveType.leave_name) {
        const name = leaveType.leave_name.toLowerCase();
        if (name.includes('casual')) normalizedType = 'casual';
        else if (name.includes('sick')) normalizedType = 'sick';
        else if (name.includes('annual') || name.includes('yearly')) normalizedType = 'annual';
        else if (name.includes('emergancy') || name.includes('emergency')) normalizedType = 'emergency';
        else normalizedType = name.replace(/\s+/g, '').toLowerCase();
      } else if (leaveType.leave_type) {
        const type = leaveType.leave_type.toLowerCase();
        if (type.includes('casual')) normalizedType = 'casual';
        else if (type.includes('sick')) normalizedType = 'sick';
        else if (type.includes('annual') || type.includes('yearly')) normalizedType = 'annual';
        else if (type.includes('emergancy') || type.includes('emergency')) normalizedType = 'emergency';
        else normalizedType = type.replace(/\s+/g, '').toLowerCase();
      }
      
      // Only add to summary if not already present and it's a relevant type
      if (!groupedSummary[normalizedType] && 
          (normalizedType === 'casual' || normalizedType === 'sick' || normalizedType === 'emergency' || normalizedType === 'annual')) {
        groupedSummary[normalizedType] = {
          total: parseFloat(leaveType.day_count || 0),
          consumed: 0,
          available: parseFloat(leaveType.day_count || 0),
          leave_type_id: leaveType.id,
          leave_name: leaveType.leave_name
        };
      }
    });

    res.json({ summary: groupedSummary });
  } catch (err) {
    console.error('Error fetching user leave balance summary:', err);
    if (isSequelizeValidationError(err)) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = {
  getAll: exports.getAll,
  getById: exports.getById,
  moveFromRequest: exports.moveFromRequest,
  revertFromRequest: exports.revertFromRequest,
  getByUser: exports.getByUser,
  getUserBalanceSummary: exports.getUserBalanceSummary
};