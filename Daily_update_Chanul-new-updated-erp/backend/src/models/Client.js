const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_name: { type: DataTypes.STRING(150), allowNull: false },
    contact_person: { type: DataTypes.STRING(100), allowNull: true },
    email: { type: DataTypes.STRING(100), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true }
  }, {
    tableName: 'client',
    timestamps: false
  });

  Client.associate = (models) => {
    Client.hasMany(models.Project, { foreignKey: 'client_id', onDelete: 'SET NULL' });
    Client.hasMany(models.Ticket, { foreignKey: 'client_id', onDelete: 'SET NULL' });
  };

  return Client;
};