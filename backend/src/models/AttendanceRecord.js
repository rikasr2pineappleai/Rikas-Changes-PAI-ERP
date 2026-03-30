// const { DataTypes } = require('sequelize');

// module.exports = (sequelize) => {
//   const AttendanceRecord = sequelize.define('AttendanceRecord', {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     user_id: { type: DataTypes.INTEGER, allowNull: false },
//     date: { type: DataTypes.DATEONLY, allowNull: false },
//     clock_in: { type: DataTypes.DATE, allowNull: true },
//     clock_out: { type: DataTypes.DATE, allowNull: true },
//     break_start: { type: DataTypes.DATE, allowNull: true },
//     total_break_duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // in seconds
//     working_hours: { type: DataTypes.FLOAT, defaultValue: 0 }, // in hours
//     status: { type: DataTypes.ENUM('on_time', 'late', 'early_departure', 'absent'), defaultValue: 'absent' },
//     method: { type: DataTypes.ENUM('biometric', 'manual', 'mobile'), defaultValue: 'manual' },
//     is_spoof_detected: { type: DataTypes.BOOLEAN, defaultValue: false },
//     created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
//     updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
//   }, {
//     tableName: 'attendance_record',
//     timestamps: false
//   });

//   AttendanceRecord.associate = (models) => {
//     AttendanceRecord.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//   };

//   return AttendanceRecord;
// };

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AttendanceRecord = sequelize.define('AttendanceRecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    clock_in: { type: DataTypes.DATE, allowNull: true },
    clock_out: { type: DataTypes.DATE, allowNull: true },
    break_start: { type: DataTypes.DATE, allowNull: true },
    total_break_duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // in seconds
    working_hours: { type: DataTypes.FLOAT, defaultValue: 0 }, // in hours
    status: { type: DataTypes.ENUM('on_time', 'late', 'early_arrival', 'early_departure', 'absent'), defaultValue: 'absent' },
    method: { type: DataTypes.ENUM('biometric', 'manual', 'mobile'), defaultValue: 'manual' },
    is_spoof_detected: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'attendance_record',
    timestamps: false
  });

  AttendanceRecord.associate = (models) => {
    AttendanceRecord.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return AttendanceRecord;
};