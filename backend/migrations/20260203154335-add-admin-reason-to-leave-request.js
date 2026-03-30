'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add admin_reason column to leave_request table
     */
    const tableDescription = await queryInterface.describeTable('leave_request');
    
    if (!tableDescription.admin_reason) {
      await queryInterface.addColumn('leave_request', 'admin_reason', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      });
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Remove admin_reason column from leave_request table
     */
    await queryInterface.removeColumn('leave_request', 'admin_reason');
  }
};