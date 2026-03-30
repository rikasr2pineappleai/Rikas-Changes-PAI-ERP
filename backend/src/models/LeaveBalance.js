// const { DataTypes } = require('sequelize');

// module.exports = (sequelize) => {
//   const LeaveBalance = sequelize.define('LeaveBalance', {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     user_id: { type: DataTypes.INTEGER, allowNull: false },
//     leave_type_id: { type: DataTypes.INTEGER, allowNull: false },
//     year: { type: DataTypes.INTEGER, allowNull: false }, // YEAR type
//     leave_taken: { type: DataTypes.DECIMAL(4, 1), defaultValue: 0 },
//     leave_balance: { type: DataTypes.DECIMAL(4, 1), allowNull: false }
//   }, {
//     tableName: 'leave_balance',
//     timestamps: false,
//     indexes: [{ unique: true, fields: ['user_id', 'leave_type_id', 'year'] }]
//   });

//   LeaveBalance.associate = (models) => {
//     LeaveBalance.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
//     LeaveBalance.belongsTo(models.LeaveType, { foreignKey: 'leave_type_id', onDelete: 'CASCADE' });
//   };

//   return LeaveBalance;
// };

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveBalance = sequelize.define('LeaveBalance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false }, // YEAR type
    leave_taken: { type: DataTypes.DECIMAL(4, 1), defaultValue: 0 },
    leave_balance: { type: DataTypes.DECIMAL(4, 1), allowNull: false }
  }, {
    tableName: 'leave_balance',
    timestamps: false,
    indexes: [{ unique: true, fields: ['user_id', 'leave_type_id', 'year'] }]
  });

  LeaveBalance.associate = (models) => {
    LeaveBalance.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    LeaveBalance.belongsTo(models.LeaveType, { foreignKey: 'leave_type_id', onDelete: 'CASCADE' });
  };

  return LeaveBalance;
};