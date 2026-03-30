const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ServiceLetterTemplate = sequelize.define('ServiceLetterTemplate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    department_id: { type: DataTypes.INTEGER, allowNull: false },
    designation: { type: DataTypes.STRING(100), allowNull: true },
    responsibilities: { type: DataTypes.TEXT, allowNull: true },
    letter_date_placeholder: { type: DataTypes.STRING(50), defaultValue: '{letter_date}' },
    date_of_joining_placeholder: { type: DataTypes.STRING(50), defaultValue: '{date_of_joining}' },
    generated_by_placeholder: { type: DataTypes.STRING(50), defaultValue: '{generated_by}' },
    file_path_template: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    tableName: 'service_letter_template',
    timestamps: false
  });

  ServiceLetterTemplate.associate = (models) => {
    ServiceLetterTemplate.belongsTo(models.Role, { foreignKey: 'role_id', onDelete: 'CASCADE' });
    ServiceLetterTemplate.belongsTo(models.Department, { foreignKey: 'department_id', onDelete: 'CASCADE' });
  };

  return ServiceLetterTemplate;
};