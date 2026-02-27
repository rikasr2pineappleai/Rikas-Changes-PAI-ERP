// const { DataTypes } = require('sequelize');

// module.exports = (sequelize) => {
//   const LeaveRequest = sequelize.define('LeaveRequest', {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     user_id: { type: DataTypes.INTEGER, allowNull: false },
//     leave_type_id: { type: DataTypes.INTEGER, allowNull: false },
//     leave_mode: { type: DataTypes.ENUM('full_day', 'half_day', 'hours_permission'), allowNull: false },
//     number_of_days: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
//     start_date: { type: DataTypes.DATEONLY, allowNull: false },
//     end_date: { type: DataTypes.DATEONLY, allowNull: true },
//     start_time: { type: DataTypes.TIME, allowNull: true },
//     end_time: { type: DataTypes.TIME, allowNull: true },
//     status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'), defaultValue: 'pending' },
//     approved_by: { type: DataTypes.INTEGER, allowNull: true },
//     requested_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
//   }, {
//     tableName: 'leave_request',
//     timestamps: false
//   });

//   LeaveRequest.associate = (models) => {
//     LeaveRequest.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     LeaveRequest.belongsTo(models.LeaveType, { foreignKey: 'leave_type_id' });
//     LeaveRequest.belongsTo(models.User, { foreignKey: 'approved_by', as: 'ApprovedBy' });
//   };

//   return LeaveRequest;
// };

// models/leaverequest.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER, allowNull: false },
    leave_mode: { type: DataTypes.ENUM('full_day', 'half_day', 'hours_permission', 'compulsory'), allowNull: false },
    number_of_days: { type: DataTypes.DECIMAL(4, 1), allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    start_time: { type: DataTypes.TIME, allowNull: true },
    end_time: { type: DataTypes.TIME, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'), defaultValue: 'pending' },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    requested_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reason: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    upload_document: { type: DataTypes.BOOLEAN, allowNull: true },
    // JS property: leave_session -> DB column: Leave_session
    leave_session: { type: DataTypes.STRING(255), allowNull: true, defaultValue: '', field: 'Leave_session' },
    adminReason: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null, field: 'admin_reason' }
  }, {
    tableName: 'leave_request',
    timestamps: false
  });

  LeaveRequest.associate = (models) => {
    LeaveRequest.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    LeaveRequest.belongsTo(models.LeaveType, { foreignKey: 'leave_type_id' });
    LeaveRequest.belongsTo(models.User, { foreignKey: 'approved_by', as: 'ApprovedBy' });
  };

  return LeaveRequest;
};