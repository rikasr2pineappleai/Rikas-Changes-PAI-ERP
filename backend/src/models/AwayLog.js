const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AwayLog = sequelize.define('AwayLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false }, // YEAR for month? Assuming month as int
    year: { type: DataTypes.INTEGER, allowNull: false },
    gross_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    net_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: { type: DataTypes.ENUM('generated', 'paid', 'held', 'cancelled'), defaultValue: 'generated' },
    generated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'away_log',
    timestamps: false,
    indexes: [{ fields: ['user_id', 'year', 'month'] }]
  });

  AwayLog.associate = (models) => {
    AwayLog.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return AwayLog;
};