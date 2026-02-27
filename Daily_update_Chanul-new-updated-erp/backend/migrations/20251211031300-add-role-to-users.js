'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'employee'),
      defaultValue: 'employee',
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    await queryInterface.removeColumn('users', 'role');
  }
};