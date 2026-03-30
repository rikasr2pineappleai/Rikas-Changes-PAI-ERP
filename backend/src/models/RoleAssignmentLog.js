const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RoleAssignmentLog = sequelize.define('RoleAssignmentLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    old_role_id: { type: DataTypes.INTEGER, allowNull: true },
    new_role_id: { type: DataTypes.INTEGER, allowNull: false },
    changed_by: { type: DataTypes.INTEGER, allowNull: false },
    changed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reason: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'role_assignment_log',
    timestamps: false
  });

  RoleAssignmentLog.associate = (models) => {
    RoleAssignmentLog.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    RoleAssignmentLog.belongsTo(models.Role, { foreignKey: 'old_role_id', as: 'OldRole' });
    RoleAssignmentLog.belongsTo(models.Role, { foreignKey: 'new_role_id', as: 'NewRole' });
    RoleAssignmentLog.belongsTo(models.User, { foreignKey: 'changed_by', as: 'ChangedBy' });
  };

  return RoleAssignmentLog;
};