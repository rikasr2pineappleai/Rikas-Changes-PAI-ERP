const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rating = sequelize.define('Rating', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    employee_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rater_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rater_designation: { 
      type: DataTypes.STRING(100), 
      allowNull: true,
      comment: 'Designation of the rater (TL, PM, COO, CTO, CEO)'
    },
    criteria: { 
      type: DataTypes.STRING(255), 
      allowNull: false 
    },
    rating: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      }
    },
    remarks: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    created_at: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
    },
    updated_at: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
    }
  }, {
    tableName: 'ratings',
    timestamps: false,
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['rater_id'] },
      { fields: ['employee_id', 'rater_id'] },
      { fields: ['criteria'] }
    ]
  });

  Rating.associate = (models) => {
    // Employee being rated
    Rating.belongsTo(models.User, { 
      foreignKey: 'employee_id', 
      as: 'Employee' 
    });
    
    // User who gave the rating
    Rating.belongsTo(models.User, { 
      foreignKey: 'rater_id', 
      as: 'Rater' 
    });
  };

  return Rating;
};