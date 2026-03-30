const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeHistory = sequelize.define('EmployeeHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('education', 'experience'), allowNull: false },
    qualification: { type: DataTypes.STRING(100), allowNull: true },
    institution: { type: DataTypes.STRING(150), allowNull: true },
    year_of_completion: { type: DataTypes.INTEGER, allowNull: true }, // YEAR type
    position: { type: DataTypes.STRING(100), allowNull: true },
    company_name: { type: DataTypes.STRING(150), allowNull: true },
    years_of_experience: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'employee_history',
    timestamps: false
  });

  EmployeeHistory.associate = (models) => {
    EmployeeHistory.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return EmployeeHistory;
};