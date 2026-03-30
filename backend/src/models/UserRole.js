const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserRole = sequelize.define('UserRole', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    role_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    assigned_by: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'user_role',
    timestamps: false
  });

  UserRole.associate = (models) => {
    UserRole.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    UserRole.belongsTo(models.Role, { foreignKey: 'role_id', onDelete: 'CASCADE' });
    UserRole.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'AssignedByUser' });
  };

  return UserRole;
};