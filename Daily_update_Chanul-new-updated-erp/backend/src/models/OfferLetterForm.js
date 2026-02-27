const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OfferLetterForm = sequelize.define('OfferLetterForm', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    letter_date: { type: DataTypes.DATEONLY, allowNull: false },
    generated_by: { type: DataTypes.INTEGER, allowNull: false },
    generated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    file_path: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM('draft', 'sent', 'cancelled'), defaultValue: 'draft' }
  }, {
    tableName: 'offer_letter_form',
    timestamps: false
  });

  OfferLetterForm.associate = (models) => {
    OfferLetterForm.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    OfferLetterForm.belongsTo(models.User, { foreignKey: 'generated_by', onDelete: 'CASCADE' });
  };

  return OfferLetterForm;
};