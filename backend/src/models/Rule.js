const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rule = sequelize.define('Rule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    rule_text: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'halt', 'inactive'), defaultValue: 'active' }
  }, {
    tableName: 'rule',
    timestamps: false
  });

  Rule.associate = (models) => {
    Rule.belongsTo(models.RuleCategory, { foreignKey: 'category_id', onDelete: 'CASCADE' });
  };

  return Rule;
};