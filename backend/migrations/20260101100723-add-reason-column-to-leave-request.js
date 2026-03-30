'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add missing columns to leave_request table
     */
    const tableDescription = await queryInterface.describeTable('leave_request');
    
    if (!tableDescription.reason) {
      await queryInterface.addColumn('leave_request', 'reason', {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: ''
      });
    }
    
    if (!tableDescription.upload_document) {
      await queryInterface.addColumn('leave_request', 'upload_document', {
        type: Sequelize.BOOLEAN,
        allowNull: true
      });
    }
    
    if (!tableDescription.Leave_session) {
      await queryInterface.addColumn('leave_request', 'Leave_session', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: ''
      });
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Remove columns from leave_request table
     */
    await queryInterface.removeColumn('leave_request', 'Leave_session');
    await queryInterface.removeColumn('leave_request', 'upload_document');
    await queryInterface.removeColumn('leave_request', 'reason');
  }
};
