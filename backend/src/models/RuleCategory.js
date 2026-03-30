const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RuleCategory = sequelize.define('RuleCategory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'rule_category',
    timestamps: false
  });

  RuleCategory.associate = (models) => {
    RuleCategory.belongsToMany(models.Role, { through: models.RoleRule, foreignKey: 'rule_category_id' });
    RuleCategory.hasMany(models.Rule, { foreignKey: 'category_id', onDelete: 'CASCADE' });
  };

  return RuleCategory;
};