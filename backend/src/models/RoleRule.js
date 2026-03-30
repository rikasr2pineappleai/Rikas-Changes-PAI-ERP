const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RoleRule = sequelize.define('RoleRule', {
    role_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    rule_category_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false }
  }, {
    tableName: 'role_rule',
    timestamps: false
  });

  RoleRule.associate = (models) => {
    RoleRule.belongsTo(models.Role, { foreignKey: 'role_id', onDelete: 'CASCADE' });
    RoleRule.belongsTo(models.RuleCategory, { foreignKey: 'rule_category_id', onDelete: 'CASCADE' });
  };

  return RoleRule;
};