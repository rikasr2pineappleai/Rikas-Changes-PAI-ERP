const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainerTrainee = sequelize.define('TrainerTrainee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    trainer_user_id: { type: DataTypes.INTEGER, allowNull: false },
    trainee_user_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'trainer_trainee',
    timestamps: false,
    indexes: [{ unique: true, fields: ['trainer_user_id', 'trainee_user_id'] }]
  });

  TrainerTrainee.associate = (models) => {
    TrainerTrainee.belongsTo(models.User, { foreignKey: 'trainer_user_id', as: 'Trainer', onDelete: 'CASCADE' });
    TrainerTrainee.belongsTo(models.User, { foreignKey: 'trainee_user_id', as: 'Trainee', onDelete: 'CASCADE' });
  };

  return TrainerTrainee;
};