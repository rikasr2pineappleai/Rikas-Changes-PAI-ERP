const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role_name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'roles',
    timestamps: false
  });

  Role.associate = (models) => {
    // UserRole
    Role.belongsToMany(models.User, { through: models.UserRole, foreignKey: 'role_id' });
    // RoleAssignmentLog
    Role.hasMany(models.RoleAssignmentLog, { foreignKey: 'old_role_id', as: 'OldRolesInLogs' });
    Role.hasMany(models.RoleAssignmentLog, { foreignKey: 'new_role_id', as: 'NewRolesInLogs' });
    // RoleDepartment
    Role.belongsToMany(models.Department, { through: models.RoleDepartment, foreignKey: 'role_id' });
    // RolePermission
    Role.belongsToMany(models.Permission, { through: models.RolePermission, foreignKey: 'role_id' });
    // RoleRule
    Role.belongsToMany(models.RuleCategory, { through: models.RoleRule, foreignKey: 'role_id' });
    // OfferLetterTemplate
    Role.hasMany(models.OfferLetterTemplate, { foreignKey: 'role_id' });
    // ServiceLetterTemplate
    Role.hasMany(models.ServiceLetterTemplate, { foreignKey: 'role_id' });
  };

  return Role;
};