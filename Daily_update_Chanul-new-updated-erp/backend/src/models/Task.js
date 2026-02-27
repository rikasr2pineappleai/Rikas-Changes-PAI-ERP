const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    assigned_to: { type: DataTypes.INTEGER, allowNull: false },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
    status: { type: DataTypes.ENUM('to_do', 'in_progress', 'testing', 'done', 'blocked', 'pending'), defaultValue: 'to_do' },
    deadline: { type: DataTypes.DATE, allowNull: true },
    assigner_deadline: { type: DataTypes.DATE, allowNull: true },
    staff_deadline: { type: DataTypes.DATE, allowNull: true },
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    assigned_by: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    tableName: 'task',
    timestamps: false
  });

  Task.associate = (models) => {
    Task.belongsTo(models.Project, { foreignKey: 'project_id', onDelete: 'CASCADE' });
    Task.belongsTo(models.User, { foreignKey: 'assigned_to', onDelete: 'CASCADE' });
    Task.belongsTo(models.User, { foreignKey: 'assigned_by', onDelete: 'CASCADE' });
    Task.hasMany(models.TaskDelay, { foreignKey: 'task_id', onDelete: 'CASCADE' });
  };

  return Task;
};