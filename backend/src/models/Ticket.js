const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Ticket = sequelize.define('Ticket', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_type: { type: DataTypes.ENUM('client', 'internal'), allowNull: false },
    client_id: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    raised_by: { type: DataTypes.INTEGER, allowNull: false },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'), defaultValue: 'open' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'ticket',
    timestamps: false
  });

  Ticket.associate = (models) => {
    Ticket.belongsTo(models.Client, { foreignKey: 'client_id', onDelete: 'SET NULL' });
    Ticket.belongsTo(models.User, { foreignKey: 'raised_by', onDelete: 'CASCADE' });
    Ticket.belongsTo(models.User, { foreignKey: 'assigned_to', onDelete: 'SET NULL' });
  };

  return Ticket;
};