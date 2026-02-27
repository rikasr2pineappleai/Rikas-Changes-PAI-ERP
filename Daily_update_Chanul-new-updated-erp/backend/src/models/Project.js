const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    client_id: { type: DataTypes.INTEGER, allowNull: true },
    project_type: { type: DataTypes.ENUM('internal', 'client'), allowNull: false },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'), defaultValue: 'active' },
    pm_user_id: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    tableName: 'project',
    timestamps: false
  });

  Project.associate = (models) => {
    Project.belongsTo(models.Client, { foreignKey: 'client_id' });
    Project.belongsTo(models.User, { foreignKey: 'pm_user_id', as: 'PM' });
    Project.hasMany(models.ProjectAllocation, { foreignKey: 'project_id', onDelete: 'CASCADE' });
    Project.hasMany(models.Task, { foreignKey: 'project_id', onDelete: 'CASCADE' });
    Project.hasMany(models.Defect, { foreignKey: 'project_id', onDelete: 'SET NULL' });
  };

  return Project;
};