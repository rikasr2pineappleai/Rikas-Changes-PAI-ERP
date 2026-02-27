const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    category: { type: DataTypes.STRING(100), allowNull: true },
    expense_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    receipt_path: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'expense',
    timestamps: false
  });

  Expense.associate = (models) => {
    Expense.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return Expense;
};