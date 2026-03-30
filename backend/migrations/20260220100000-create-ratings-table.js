'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Create ratings table
     */
    await queryInterface.createTable('ratings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      rater_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      rater_designation: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Designation of the rater at time of rating (TL, PM, COO, CTO, CEO)'
      },
      criteria: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Name of the performance criteria being rated'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10
        },
        comment: 'Rating score from 1-10'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional remarks for this criteria'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create index for faster queries
    await queryInterface.addIndex('ratings', ['employee_id']);
    await queryInterface.addIndex('ratings', ['rater_id']);
    await queryInterface.addIndex('ratings', ['employee_id', 'rater_id']);
    await queryInterface.addIndex('ratings', ['criteria']);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Drop ratings table
     */
    await queryInterface.dropTable('ratings');
  }
};