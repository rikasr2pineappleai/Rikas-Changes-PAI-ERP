const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectAllocation = sequelize.define('ProjectAllocation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id: { type: DataTypes.INTEGER, allowNull: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    role_in_project: { type: DataTypes.STRING(100), allowNull: true },
    allocated_hours: { type: DataTypes.INTEGER, allowNull: true },
    current_project: { type: DataTypes.STRING(255), allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    report_to: { type: DataTypes.INTEGER, allowNull: true },
    previous_projects: { type: DataTypes.TEXT, allowNull: true },
    completed_projects: { type: DataTypes.TEXT, allowNull: true },
    project_role: { type: DataTypes.STRING(255), allowNull: true },
    project_description: { type: DataTypes.TEXT, allowNull: true },
    project_contributions: { type: DataTypes.TEXT, allowNull: true },
    technologies_used: { type: DataTypes.STRING(255), allowNull: true },
    allocation_start: { type: DataTypes.DATEONLY, allowNull: true },
    allocation_end: { type: DataTypes.DATEONLY, allowNull: true }
  }, {
    tableName: 'project_allocation',
    timestamps: false,
    indexes: [{ unique: true, fields: ['project_id', 'user_id'] }]
  });

  ProjectAllocation.associate = (models) => {
    ProjectAllocation.belongsTo(models.Project, { foreignKey: 'project_id', onDelete: 'CASCADE' });
    ProjectAllocation.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return ProjectAllocation;
};