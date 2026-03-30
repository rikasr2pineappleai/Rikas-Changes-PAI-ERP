'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('employee_detail', 'end_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'joined_date'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('employee_detail', 'end_date');
  }
};