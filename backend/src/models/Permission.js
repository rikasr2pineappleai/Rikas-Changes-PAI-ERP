const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    module: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    level: { type: DataTypes.ENUM('own', 'team', 'department', 'all'), allowNull: false }
  }, {
    tableName: 'permission',
    timestamps: false,
    indexes: [{ unique: true, fields: ['module', 'action', 'level'] }]
  });

  Permission.associate = (models) => {
    Permission.belongsToMany(models.Role, { through: models.RolePermission, foreignKey: 'permission_id' });
  };

  return Permission;
};