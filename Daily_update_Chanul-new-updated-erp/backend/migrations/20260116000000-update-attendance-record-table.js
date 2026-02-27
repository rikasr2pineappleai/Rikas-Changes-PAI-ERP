'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Check if 'method' column exists
    const tableDescription = await queryInterface.describeTable('attendance_record');
    
    // Add 'method' column if it doesn't exist
    if (!tableDescription.method) {
      await queryInterface.addColumn('attendance_record', 'method', {
        type: DataTypes.ENUM('biometric', 'manual', 'mobile'),
        defaultValue: 'manual',
        allowNull: true
      });
    }
    
    // Add 'is_spoof_detected' column if it doesn't exist
    if (!tableDescription.is_spoof_detected) {
      await queryInterface.addColumn('attendance_record', 'is_spoof_detected', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
      });
    }
    
    // Update status ENUM to include 'early_arrival'
    await queryInterface.sequelize.query(`
      ALTER TABLE attendance_record 
      MODIFY COLUMN status ENUM('on_time', 'late', 'early_arrival', 'early_departure', 'absent') 
      DEFAULT 'absent'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('attendance_record', 'method');
    await queryInterface.removeColumn('attendance_record', 'is_spoof_detected');
    
    // Revert status ENUM to original values
    await queryInterface.sequelize.query(`
      ALTER TABLE attendance_record 
      MODIFY COLUMN status ENUM('on_time', 'late', 'early_departure', 'absent') 
      DEFAULT 'absent'
    `);
  }
};
