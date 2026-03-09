'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('project_allocation');

    const columnsToAdd = {
      current_project: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      report_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      previous_projects: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      completed_projects: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      project_role: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      project_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      project_contributions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      technologies_used: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      allocation_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      allocation_end: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
    };

    for (const [columnName, columnDef] of Object.entries(columnsToAdd)) {
      if (!tableDescription[columnName]) {
        await queryInterface.addColumn('project_allocation', columnName, columnDef);
      }
    }
  },

  async down(queryInterface) {
    const columns = [
      'current_project', 'start_date', 'report_to', 'previous_projects',
      'completed_projects', 'project_role', 'project_description',
      'project_contributions', 'technologies_used', 'allocation_start', 'allocation_end',
    ];

    for (const col of columns) {
      await queryInterface.removeColumn('project_allocation', col);
    }
  },
};
