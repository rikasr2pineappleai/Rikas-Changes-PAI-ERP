const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RoleDepartment = sequelize.define('RoleDepartment', {
    role_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    department_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false }
  }, {
    tableName: 'role_department',
    timestamps: false
  });

  RoleDepartment.associate = (models) => {
    RoleDepartment.belongsTo(models.Role, { foreignKey: 'role_id', onDelete: 'CASCADE' });
    RoleDepartment.belongsTo(models.Department, { foreignKey: 'department_id', onDelete: 'CASCADE' });
  };

  return RoleDepartment;
};