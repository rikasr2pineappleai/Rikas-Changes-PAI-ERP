'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make project_id nullable in project_allocation table
    await queryInterface.changeColumn('project_allocation', 'project_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert project_id back to NOT NULL
    await queryInterface.changeColumn('project_allocation', 'project_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};
