// // models/LeaveType.js
// const { DataTypes: SequelizeDataTypes } = require('sequelize');

// module.exports = (sequelize, DataTypesParam) => {
//   // Accept DataTypes passed by models/index or fallback.
//   const DataTypes = DataTypesParam || (SequelizeDataTypes || (sequelize.Sequelize && sequelize.Sequelize.DataTypes));

//   // Helper to compute day_count from leave_type string
//   const computeDayCount = (leaveType) => {
//     if (!leaveType || typeof leaveType !== 'string') return 0;
//     const t = leaveType.trim().toLowerCase();
//     // exact matches or containing words
//     if (t === 'sick' || t === 'annual' || t.includes('sick') || t.includes('annual')) return 14;
//     if (t === 'casual' || t.includes('casual')) return 7;
//     return 0;
//   };

//   const LeaveType = sequelize.define('LeaveType', {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true
//     },
//     leave_name: {
//       type: DataTypes.STRING(50),
//       allowNull: false,
//       validate: {
//         notEmpty: { msg: 'leave_name cannot be empty' },
//         len: { args: [1, 50], msg: 'leave_name must be between 1 and 50 characters' }
//       }
//     },
//     leave_type: {
//       type: DataTypes.STRING(50),
//       allowNull: true,
//       validate: {
//         len: { args: [1, 50], msg: 'leave_type must be between 1 and 50 characters' }
//       }
//     },
//     requires_proof: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false
//     },
//     day_count: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 0,
//       validate: {
//         min: { args: [0], msg: 'day_count cannot be negative' }
//       }
//     }
//   }, {
//     tableName: 'leave_type',
//     timestamps: false,
//     hooks: {
//       beforeValidate: (instance) => {
//         if (!instance) return;
//         if (instance.leave_name && typeof instance.leave_name === 'string') {
//           instance.leave_name = instance.leave_name.trim();
//         }
//         if (instance.leave_type && typeof instance.leave_type === 'string') {
//           instance.leave_type = instance.leave_type.trim();
//         }
//         // If day_count is not set or invalid, compute it from leave_type
//         if (typeof instance.day_count === 'undefined' || instance.day_count === null || !Number.isInteger(instance.day_count)) {
//           instance.day_count = computeDayCount(instance.leave_type);
//         }
//       }
//     }
//   });

//   // Optional associations
//   LeaveType.associate = (models = {}) => {
//     if (models.LeaveBalance) {
//       LeaveType.hasMany(models.LeaveBalance, { foreignKey: 'leave_type_id', onDelete: 'CASCADE' });
//     }
//     if (models.LeaveRequest) {
//       LeaveType.hasMany(models.LeaveRequest, { foreignKey: 'leave_type_id' });
//     }
//   };

//   /**
//    * createRecord(payload)
//    * payload: { id?: number, leave_name: string, leave_type: string, requires_proof?: boolean, day_count?: number }
//    * returns created instance or throws
//    */
//   LeaveType.createRecord = async function (payload = {}) {
//     const { id, leave_name, leave_type, requires_proof, day_count } = payload;

//     if (!leave_name || !leave_type) {
//       const err = new Error('leave_name and leave_type are required');
//       err.status = 400;
//       throw err;
//     }

//     const createPayload = {
//       leave_name: String(leave_name).trim(),
//       leave_type: String(leave_type).trim()
//     };

//     if (typeof requires_proof !== 'undefined') createPayload.requires_proof = !!requires_proof;
//     if (id) createPayload.id = id;

//     // Use provided integer day_count when valid; otherwise compute
//     if (typeof day_count !== 'undefined' && Number.isInteger(day_count) && day_count >= 0) {
//       createPayload.day_count = day_count;
//     } else {
//       createPayload.day_count = computeDayCount(createPayload.leave_type);
//     }

//     // Sequelize validations will run on .create
//     return await LeaveType.create(createPayload);
//   };

//   // Export computeDayCount in case other modules want to reuse it
//   LeaveType.computeDayCount = computeDayCount;

//   return LeaveType;
// };

// models/LeaveType.js
const { DataTypes: SequelizeDataTypes } = require('sequelize');

module.exports = (sequelize, DataTypesParam) => {
  // Accept DataTypes passed by models/index or fallback.
  const DataTypes = DataTypesParam || (SequelizeDataTypes || (sequelize.Sequelize && sequelize.Sequelize.DataTypes));

  // Helper to compute day_count from leave_type string
  const computeDayCount = (leaveType) => {
    if (!leaveType || typeof leaveType !== 'string') return 0;
    const t = leaveType.trim().toLowerCase();
    // exact matches or containing words
    if (t === 'sick' || t === 'annual' || t.includes('sick') || t.includes('annual')) return 14;
    if (t === 'casual' || t.includes('casual')) return 7;
    return 0;
  };

  const LeaveType = sequelize.define('LeaveType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    leave_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'leave_name cannot be empty' },
        len: { args: [1, 50], msg: 'leave_name must be between 1 and 50 characters' }
      }
    },
    leave_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [1, 50], msg: 'leave_type must be between 1 and 50 characters' }
      }
    },
    requires_proof: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    day_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'day_count cannot be negative' }
      }
    }
  }, {
    tableName: 'leave_type',
    timestamps: false,
    hooks: {
      beforeValidate: (instance) => {
        if (!instance) return;
        if (instance.leave_name && typeof instance.leave_name === 'string') {
          instance.leave_name = instance.leave_name.trim();
        }
        if (instance.leave_type && typeof instance.leave_type === 'string') {
          instance.leave_type = instance.leave_type.trim();
        }
        // If day_count is not set or invalid, compute it from leave_type
        if (typeof instance.day_count === 'undefined' || instance.day_count === null || !Number.isInteger(instance.day_count)) {
          instance.day_count = computeDayCount(instance.leave_type);
        }
      }
    }
  });

  // Optional associations
  LeaveType.associate = (models = {}) => {
    if (models.LeaveBalance) {
      LeaveType.hasMany(models.LeaveBalance, { foreignKey: 'leave_type_id', onDelete: 'CASCADE' });
    }
    if (models.LeaveRequest) {
      LeaveType.hasMany(models.LeaveRequest, { foreignKey: 'leave_type_id' });
    }
  };

  /**
   * createRecord(payload)
   * payload: { id?: number, leave_name: string, leave_type: string, requires_proof?: boolean, day_count?: number }
   * returns created instance or throws
   */
  LeaveType.createRecord = async function (payload = {}) {
    const { id, leave_name, leave_type, requires_proof, day_count } = payload;

    if (!leave_name || !leave_type) {
      const err = new Error('leave_name and leave_type are required');
      err.status = 400;
      throw err;
    }

    const createPayload = {
      leave_name: String(leave_name).trim(),
      leave_type: String(leave_type).trim()
    };

    if (typeof requires_proof !== 'undefined') createPayload.requires_proof = !!requires_proof;
    if (id) createPayload.id = id;

    // Use provided integer day_count when valid; otherwise compute
    if (typeof day_count !== 'undefined' && Number.isInteger(day_count) && day_count >= 0) {
      createPayload.day_count = day_count;
    } else {
      createPayload.day_count = computeDayCount(createPayload.leave_type);
    }

    // Sequelize validations will run on .create
    return await LeaveType.create(createPayload);
  };

  // Export computeDayCount in case other modules want to reuse it
  LeaveType.computeDayCount = computeDayCount;

  return LeaveType;
};