'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if department_id column exists
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.department_id) {
      await queryInterface.addColumn('users', 'department_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    if (!tableInfo.designation) {
      await queryInterface.addColumn('users', 'designation', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    // Add foreign key constraint if it doesn't exist
    try {
      await queryInterface.addConstraint('users', {
        fields: ['department_id'],
        type: 'foreign key',
        name: 'fk_users_department_id',
        references: {
          table: 'departments',
          field: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    } catch (error) {
      // Constraint might already exist, ignore
      console.log('Foreign key constraint might already exist, continuing...');
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove foreign key constraint first
    try {
      await queryInterface.removeConstraint('users', 'fk_users_department_id');
    } catch (error) {
      // Constraint might not exist, ignore
      console.log('Foreign key constraint might not exist, continuing...');
    }
    
    const tableInfo = await queryInterface.describeTable('users');
    
    if (tableInfo.department_id) {
      await queryInterface.removeColumn('users', 'department_id');
    }
    
    if (tableInfo.designation) {
      await queryInterface.removeColumn('users', 'designation');
    }
  }
};