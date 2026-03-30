const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Asset = sequelize.define('Asset', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    asset_tag: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: true },
    purchase_date: { type: DataTypes.DATEONLY, allowNull: true },
    cost: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'asset',
    timestamps: false
  });

  Asset.associate = (models) => {
    Asset.belongsTo(models.User, { foreignKey: 'assigned_to', onDelete: 'SET NULL' });
  };

  return Asset;
};