const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payroll = sequelize.define('Payroll', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false }, // YEAR for month
    year: { type: DataTypes.INTEGER, allowNull: false },
    gross_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    net_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: { type: DataTypes.ENUM('generated', 'paid', 'held'), defaultValue: 'generated' },
    generated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'payroll',
    timestamps: false
  });

  Payroll.associate = (models) => {
    Payroll.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return Payroll;
};