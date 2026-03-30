// // controllers/leave.controller.js
// const db = require('../models');

// // Resolve LeaveType model from possible export shapes
// const LeaveType =
//   db.LeaveType ||
//   (db.models && db.models.LeaveType) ||
//   (db.sequelize && db.sequelize.models && db.sequelize.models.LeaveType);

// const isSequelizeValidationError = (err) =>
//   err && err.name === 'SequelizeValidationError' && Array.isArray(err.errors);

// // Use model's computeDayCount if available, otherwise fallback to same logic
// const computeDayCountFallback = (leaveType) => {
//   if (!leaveType || typeof leaveType !== 'string') return 0;
//   const t = leaveType.trim().toLowerCase();
//   if (t === 'sick' || t === 'annual' || t.includes('sick') || t.includes('annual')) return 14;
//   if (t === 'casual' || t.includes('casual')) return 7;
//   return 0;
// };

// const create = async (req, res) => {
//   try {
//     if (!LeaveType) {
//       console.error('LeaveType model not found in ../models export. Export keys:', Object.keys(db || {}));
//       return res.status(500).json({
//         success: false,
//         message: 'LeaveType model not available. Check models/index.js export.'
//       });
//     }

//     // Expecting multipart/form-data route (multer) or form fields
//     const { id } = req.body || {};
//     const leave_name = req.body && req.body.leave_name ? String(req.body.leave_name).trim() : undefined;
//     const leave_type = req.body && req.body.leave_type ? String(req.body.leave_type).trim() : undefined;

//     if (!leave_name || !leave_type) {
//       return res.status(400).json({
//         success: false,
//         message: 'leave_name and leave_type are required.'
//       });
//     }

//     // requires_proof determined from presence of uploaded file (multer sets req.file)
//     let requires_proof = false;
//     if (req.file) {
//       // Multer's file filter should already restrict mime-type; double check
//       if (req.file.mimetype && req.file.mimetype !== 'application/pdf') {
//         return res.status(400).json({
//           success: false,
//           message: 'Only PDF files are allowed for requires_proof.'
//         });
//       }
//       requires_proof = true;
//     }

//     // day_count: prefer numeric day_count from request body (if valid), else compute
//     let day_count;
//     if (typeof req.body.day_count !== 'undefined') {
//       const parsed = Number(req.body.day_count);
//       if (Number.isInteger(parsed) && parsed >= 0) {
//         day_count = parsed;
//       } else {
//         // ignore invalid provided day_count and fallback to computed value
//         day_count = undefined;
//       }
//     }

//     if (typeof day_count === 'undefined') {
//       // prefer model's helper if present
//       if (typeof LeaveType.computeDayCount === 'function') {
//         day_count = LeaveType.computeDayCount(leave_type);
//       } else {
//         day_count = computeDayCountFallback(leave_type);
//       }
//     }

//     const payload = {
//       leave_name,
//       leave_type,
//       requires_proof,
//       day_count
//     };
//     if (id) payload.id = id;

//     // Use model helper if present
//     let created;
//     if (typeof LeaveType.createRecord === 'function') {
//       created = await LeaveType.createRecord(payload);
//     } else {
//       created = await LeaveType.create(payload);
//     }

//     return res.status(201).json({
//       success: true,
//       message: 'Leave type created successfully.',
//       data: created
//     });
//   } catch (err) {
//     console.error('Error creating leave type:', err);

//     // Sequelize validation errors
//     if (isSequelizeValidationError(err)) {
//       const messages = err.errors.map((e) => e.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed.',
//         errors: messages
//       });
//     }

//     // Custom thrown errors with status
//     if (err && err.status && err.message) {
//       return res.status(err.status).json({
//         success: false,
//         message: err.message
//       });
//     }

//     // Generic fallback
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error.',
//       error: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// };

// /**
//  * DELETE /api/leave-type/:id
//  * Also accepts id in req.body.id or req.query.id as fallback.
//  * If model is paranoid, you can force permanent delete with query param ?force=true
//  */
// const remove = async (req, res) => {
//   try {
//     if (!LeaveType) {
//       console.error('LeaveType model not found in ../models export. Export keys:', Object.keys(db || {}));
//       return res.status(500).json({
//         success: false,
//         message: 'LeaveType model not available. Check models/index.js export.'
//       });
//     }

//     // accept id from params, body, or query
//     const rawId = (req.params && req.params.id) || (req.body && req.body.id) || req.query.id;
//     const id = Number(rawId);

//     if (!rawId || !Number.isInteger(id) || id <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'A valid integer id is required to delete a leave type.'
//       });
//     }

//     // If model is paranoid and user wants permanent delete, use force
//     const forceDelete = req.query && req.query.force === 'true';

//     const deletedCount = await LeaveType.destroy({
//       where: { id },
//       force: forceDelete // if model not paranoid, force has no special effect
//     });

//     if (!deletedCount || deletedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No leave_type found with id ${id}.`
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Leave type with id ${id} deleted successfully.`,
//       deletedCount
//     });
//   } catch (err) {
//     console.error('Error deleting leave type:', err);

//     // Sequelize validation errors (unlikely on destroy but keep pattern)
//     if (isSequelizeValidationError(err)) {
//       const messages = err.errors.map((e) => e.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed.',
//         errors: messages
//       });
//     }
//     // Generic fallback
//     return res.status(500).json({
//       success: false,
//       message: 'Internal server error.',
//       error: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// };

// module.exports = {
//   create,
//   delete: remove
// };


// controllers/leave.controller.js
const db = require('../models');

// Resolve LeaveType model from possible export shapes
const LeaveType =
  db.LeaveType ||
  (db.models && db.models.LeaveType) ||
  (db.sequelize && db.sequelize.models && db.sequelize.models.LeaveType);

const isSequelizeValidationError = (err) =>
  err && err.name === 'SequelizeValidationError' && Array.isArray(err.errors);

// Use model's computeDayCount if available, otherwise fallback to same logic
const computeDayCountFallback = (leaveType) => {
  if (!leaveType || typeof leaveType !== 'string') return 0;
  const t = leaveType.trim().toLowerCase();
  if (t === 'sick' || t === 'annual' || t.includes('sick') || t.includes('annual')) return 14;
  if (t === 'casual' || t.includes('casual')) return 7;
  return 0;
};

const create = async (req, res) => {
  try {
    if (!LeaveType) {
      console.error('LeaveType model not found in ../models export. Export keys:', Object.keys(db || {}));
      return res.status(500).json({
        success: false,
        message: 'LeaveType model not available. Check models/index.js export.'
      });
    }

    // Expecting multipart/form-data route (multer) or form fields
    const { id } = req.body || {};
    const leave_name = req.body && req.body.leave_name ? String(req.body.leave_name).trim() : undefined;
    const leave_type = req.body && req.body.leave_type ? String(req.body.leave_type).trim() : undefined;

    if (!leave_name || !leave_type) {
      return res.status(400).json({
        success: false,
        message: 'leave_name and leave_type are required.'
      });
    }

    // requires_proof determined from presence of uploaded file (multer sets req.file)
    let requires_proof = false;
    if (req.file) {
      // Multer's file filter should already restrict mime-type; double check
      if (req.file.mimetype && req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({
          success: false,
          message: 'Only PDF files are allowed for requires_proof.'
        });
      }
      requires_proof = true;
    }

    // day_count: prefer numeric day_count from request body (if valid), else compute
    let day_count;
    if (typeof req.body.day_count !== 'undefined') {
      const parsed = Number(req.body.day_count);
      if (Number.isInteger(parsed) && parsed >= 0) {
        day_count = parsed;
      } else {
        // ignore invalid provided day_count and fallback to computed value
        day_count = undefined;
      }
    }

    if (typeof day_count === 'undefined') {
      // prefer model's helper if present
      if (typeof LeaveType.computeDayCount === 'function') {
        day_count = LeaveType.computeDayCount(leave_type);
      } else {
        day_count = computeDayCountFallback(leave_type);
      }
    }

    const payload = {
      leave_name,
      leave_type,
      requires_proof,
      day_count
    };
    if (id) payload.id = id;

    // Use model helper if present
    let created;
    if (typeof LeaveType.createRecord === 'function') {
      created = await LeaveType.createRecord(payload);
    } else {
      created = await LeaveType.create(payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Leave type created successfully.',
      data: created
    });
  } catch (err) {
    console.error('Error creating leave type:', err);

    // Sequelize validation errors
    if (isSequelizeValidationError(err)) {
      const messages = err.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: messages
      });
    }

    // Custom thrown errors with status
    if (err && err.status && err.message) {
      return res.status(err.status).json({
        success: false,
        message: err.message
      });
    }

    // Generic fallback
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * DELETE /api/leave-type/:id
 * Also accepts id in req.body.id or req.query.id as fallback.
 * If model is paranoid, you can force permanent delete with query param ?force=true
 */
const remove = async (req, res) => {
  try {
    if (!LeaveType) {
      console.error('LeaveType model not found in ../models export. Export keys:', Object.keys(db || {}));
      return res.status(500).json({
        success: false,
        message: 'LeaveType model not available. Check models/index.js export.'
      });
    }

    // accept id from params, body, or query
    const rawId = (req.params && req.params.id) || (req.body && req.body.id) || req.query.id;
    const id = Number(rawId);

    if (!rawId || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid integer id is required to delete a leave type.'
      });
    }

    // If model is paranoid and user wants permanent delete, use force
    const forceDelete = req.query && req.query.force === 'true';

    const deletedCount = await LeaveType.destroy({
      where: { id },
      force: forceDelete // if model not paranoid, force has no special effect
    });

    if (!deletedCount || deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No leave_type found with id ${id}.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Leave type with id ${id} deleted successfully.`,
      deletedCount
    });
  } catch (err) {
    console.error('Error deleting leave type:', err);

    // Sequelize validation errors (unlikely on destroy but keep pattern)
    if (isSequelizeValidationError(err)) {
      const messages = err.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: messages
      });
    }
    // Generic fallback
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  create,
  delete: remove
};