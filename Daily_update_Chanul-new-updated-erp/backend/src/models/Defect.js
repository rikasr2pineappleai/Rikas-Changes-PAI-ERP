const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Defect = sequelize.define('Defect', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    reporter_id: { type: DataTypes.INTEGER, allowNull: false },
    assignee_id: { type: DataTypes.INTEGER, allowNull: true },
    project_id: { type: DataTypes.INTEGER, allowNull: true },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
    status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed', 'reopened'), defaultValue: 'open' },
    reported_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'defect',
    timestamps: false
  });

  Defect.associate = (models) => {
    Defect.belongsTo(models.User, { foreignKey: 'reporter_id', as: 'Reporter', onDelete: 'CASCADE' });
    Defect.belongsTo(models.User, { foreignKey: 'assignee_id', as: 'Assignee', onDelete: 'SET NULL' });
    Defect.belongsTo(models.Project, { foreignKey: 'project_id', onDelete: 'SET NULL' });
    Defect.hasMany(models.DefectComment, { foreignKey: 'defect_id', onDelete: 'CASCADE' });
  };

  return Defect;
};