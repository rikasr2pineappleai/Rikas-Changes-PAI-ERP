const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dept_name: { type: DataTypes.STRING(100), allowNull: false },
    hod_user_id: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'department',
    timestamps: false
  });

  Department.associate = (models) => {
    // HOD User
    Department.belongsTo(models.User, { foreignKey: 'hod_user_id' });
    // RoleDepartment
    Department.belongsToMany(models.Role, { through: models.RoleDepartment, foreignKey: 'department_id' });
    // OfferLetterTemplate
    Department.hasMany(models.OfferLetterTemplate, { foreignKey: 'department_id' });
    // ServiceLetterTemplate
    Department.hasMany(models.ServiceLetterTemplate, { foreignKey: 'department_id' });
  };

  return Department;
};