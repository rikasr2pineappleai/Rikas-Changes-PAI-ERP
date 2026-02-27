const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ServiceLetterForm = sequelize.define('ServiceLetterForm', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    letter_date: { type: DataTypes.DATEONLY, allowNull: false },
    generated_by: { type: DataTypes.INTEGER, allowNull: false },
    generated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    file_path: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'sent', 'cancelled'), defaultValue: 'draft' }
  }, {
    tableName: 'service_letter_form',
    timestamps: false
  });

  ServiceLetterForm.associate = (models) => {
    ServiceLetterForm.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    ServiceLetterForm.belongsTo(models.User, { foreignKey: 'generated_by', onDelete: 'CASCADE' });
  };

  return ServiceLetterForm;
};