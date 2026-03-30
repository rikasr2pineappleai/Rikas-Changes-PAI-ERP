const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OfferLetterTemplate = sequelize.define('OfferLetterTemplate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    department_id: { type: DataTypes.INTEGER, allowNull: false },
    responsibilities: { type: DataTypes.TEXT, allowNull: true },
    letter_date_placeholder: { type: DataTypes.STRING(50), defaultValue: '{letter_date}' },
    date_of_joining_placeholder: { type: DataTypes.STRING(50), defaultValue: '{date_of_joining}' },
    reporting_manager_placeholder: { type: DataTypes.STRING(50), defaultValue: '{reporting_manager}' },
    reporting_manager_email_placeholder: { type: DataTypes.STRING(50), defaultValue: '{reporting_manager_email}' },
    generated_by_placeholder: { type: DataTypes.STRING(50), defaultValue: '{generated_by}' },
    file_path_template: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
  }, {
    tableName: 'offer_letter_template',
    timestamps: false
  });

  OfferLetterTemplate.associate = (models) => {
    OfferLetterTemplate.belongsTo(models.Role, { foreignKey: 'role_id', onDelete: 'CASCADE' });
    OfferLetterTemplate.belongsTo(models.Department, { foreignKey: 'department_id', onDelete: 'CASCADE' });
  };

  return OfferLetterTemplate;
};