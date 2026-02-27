const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TaskDelay = sequelize.define('TaskDelay', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    task_id: { type: DataTypes.INTEGER, allowNull: false },
    delay_reason: { type: DataTypes.TEXT, allowNull: false },
    expected_completion_date: { type: DataTypes.DATE, allowNull: true },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    comments: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'task_delay',
    timestamps: false
  });

  TaskDelay.associate = (models) => {
    TaskDelay.belongsTo(models.Task, { foreignKey: 'task_id', onDelete: 'CASCADE' });
    TaskDelay.belongsTo(models.User, { foreignKey: 'approved_by', as: 'ApprovedByUser' });
  };

  return TaskDelay;
};