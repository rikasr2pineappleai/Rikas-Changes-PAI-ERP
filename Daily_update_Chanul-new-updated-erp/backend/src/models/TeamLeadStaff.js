const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamLeadStaff = sequelize.define('TeamLeadStaff', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    team_lead_user_id: { type: DataTypes.INTEGER, allowNull: false },
    staff_user_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'team_lead_staff',
    timestamps: false,
    indexes: [{ unique: true, fields: ['team_lead_user_id', 'staff_user_id'] }]
  });

  TeamLeadStaff.associate = (models) => {
    TeamLeadStaff.belongsTo(models.User, { foreignKey: 'team_lead_user_id', as: 'TeamLead', onDelete: 'CASCADE' });
    TeamLeadStaff.belongsTo(models.User, { foreignKey: 'staff_user_id', as: 'Staff', onDelete: 'CASCADE' });
  };

  return TeamLeadStaff;
};