'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promotion_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      previous_management_role: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      management_role: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      designation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      effective_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('promotion_history', ['user_id', 'effective_date']);
    await queryInterface.addIndex('promotion_history', ['user_id', 'management_role']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('promotion_history');
  },
};
