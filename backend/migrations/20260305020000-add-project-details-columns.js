'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Check if 'previous_projects' column exists
    const tableDescription = await queryInterface.describeTable('project_allocation');
    
    // Add 'previous_projects' column if it doesn't exist
    if (!tableDescription.previous_projects) {
      await queryInterface.addColumn('project_allocation', 'previous_projects', {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }
    
    // Add 'completed_projects' column if it doesn't exist
    if (!tableDescription.completed_projects) {
      await queryInterface.addColumn('project_allocation', 'completed_projects', {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('project_allocation', 'previous_projects');
    await queryInterface.removeColumn('project_allocation', 'completed_projects');
  }
};
