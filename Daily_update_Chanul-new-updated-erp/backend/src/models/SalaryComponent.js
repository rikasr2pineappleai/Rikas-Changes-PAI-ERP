const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SalaryComponent = sequelize.define('SalaryComponent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM('earning', 'deduction'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    is_taxable: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'salary_component',
    timestamps: false
  });

  SalaryComponent.associate = (models) => {
    // No direct associations from dump
  };

  return SalaryComponent;
};