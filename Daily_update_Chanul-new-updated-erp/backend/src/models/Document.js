const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    document_type: { 
      type: DataTypes.ENUM('nic', 'birth_certificate', 'educational_certificate', 'transcript'), 
      allowNull: false 
    },
    file_path: { type: DataTypes.STRING(255), allowNull: false },
    uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'documents',
    timestamps: false
  });

  Document.associate = (models) => {
    Document.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return Document;
};

