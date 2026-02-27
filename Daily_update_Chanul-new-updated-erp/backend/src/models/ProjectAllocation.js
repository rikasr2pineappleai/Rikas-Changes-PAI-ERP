const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProjectAllocation = sequelize.define('ProjectAllocation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    role_in_project: { type: DataTypes.STRING(100), allowNull: true },
    allocated_hours: { type: DataTypes.INTEGER, allowNull: true }
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