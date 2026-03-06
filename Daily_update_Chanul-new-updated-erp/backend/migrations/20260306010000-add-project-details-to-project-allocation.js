'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('project_allocation', 'project_role', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('project_allocation', 'project_description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('project_allocation', 'project_contributions', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('project_allocation', 'technologies_used', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('project_allocation', 'allocation_start', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addColumn('project_allocation', 'allocation_end', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('project_allocation', 'project_role');
    await queryInterface.removeColumn('project_allocation', 'project_description');
    await queryInterface.removeColumn('project_allocation', 'project_contributions');
    await queryInterface.removeColumn('project_allocation', 'technologies_used');
    await queryInterface.removeColumn('project_allocation', 'allocation_start');
    await queryInterface.removeColumn('project_allocation', 'allocation_end');
  }
};
