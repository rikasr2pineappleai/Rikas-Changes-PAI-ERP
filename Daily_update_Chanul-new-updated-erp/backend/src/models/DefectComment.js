const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DefectComment = sequelize.define('DefectComment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    defect_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: false },
    attachment: { type: DataTypes.STRING(255), allowNull: true },
    commented_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'defect_comment',
    timestamps: false
  });

  DefectComment.associate = (models) => {
    DefectComment.belongsTo(models.Defect, { foreignKey: 'defect_id', onDelete: 'CASCADE' });
    DefectComment.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return DefectComment;
};