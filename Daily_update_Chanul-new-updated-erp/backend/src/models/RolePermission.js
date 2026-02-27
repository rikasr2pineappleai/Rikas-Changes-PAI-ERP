const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolePermission = sequelize.define('RolePermission', {
    role_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    permission_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false }
  }, {
    tableName: 'role_permission',
    timestamps: false
  });

  RolePermission.associate = (models) => {
    RolePermission.belongsTo(models.Role, { foreignKey: 'role_id', onDelete: 'CASCADE' });
    RolePermission.belongsTo(models.Permission, { foreignKey: 'permission_id', onDelete: 'CASCADE' });
  };

  return RolePermission;
};