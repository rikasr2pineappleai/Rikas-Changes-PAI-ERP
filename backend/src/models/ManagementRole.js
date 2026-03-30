const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ManagementRole = sequelize.define('ManagementRole', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role_name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'management_roles',
    timestamps: false
  });

  ManagementRole.associate = (models) => {
    // Association can be added if needed
  };

  return ManagementRole;
};