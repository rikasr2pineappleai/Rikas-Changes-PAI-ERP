const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const EmployeeDetail = sequelize.define('EmployeeDetail', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    joined_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    image_path: { type: DataTypes.STRING(255), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true }
  }, {
    tableName: 'employee_detail',
    timestamps: false
  });

  EmployeeDetail.associate = (models) => {
    EmployeeDetail.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return EmployeeDetail;
};