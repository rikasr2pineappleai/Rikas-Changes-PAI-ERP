const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PromotionHistory = sequelize.define('PromotionHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    previous_management_role: { type: DataTypes.STRING(100), allowNull: true },
    management_role: { type: DataTypes.STRING(100), allowNull: false },
    designation: { type: DataTypes.STRING(100), allowNull: true },
    effective_date: { type: DataTypes.DATEONLY, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'promotion_history',
    timestamps: false,
  });

  PromotionHistory.associate = (models) => {
    PromotionHistory.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return PromotionHistory;
};
