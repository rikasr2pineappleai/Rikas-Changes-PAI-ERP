'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Check if 'current_project' column exists
    const tableDescription = await queryInterface.describeTable('project_allocation');
    
    // Add 'current_project' column if it doesn't exist
    if (!tableDescription.current_project) {
      await queryInterface.addColumn('project_allocation', 'current_project', {
        type: DataTypes.STRING(255),
        allowNull: true
      });
    }
    
    // Add 'start_date' column if it doesn't exist
    if (!tableDescription.start_date) {
      await queryInterface.addColumn('project_allocation', 'start_date', {
        type: DataTypes.DATEONLY,
        allowNull: true
      });
    }
    
    // Add 'report_to' column if it doesn't exist
    if (!tableDescription.report_to) {
      await queryInterface.addColumn('project_allocation', 'report_to', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('project_allocation', 'current_project');
    await queryInterface.removeColumn('project_allocation', 'start_date');
    await queryInterface.removeColumn('project_allocation', 'report_to');
  }
};
