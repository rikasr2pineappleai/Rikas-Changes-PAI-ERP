'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('service_letter_form', 'form_data', {
        type: Sequelize.TEXT('long'),
        allowNull: true
      });
    } catch (e) {
      console.log('service_letter_form.form_data column may already exist');
    }

    try {
      await queryInterface.addColumn('offer_letter_form', 'form_data', {
        type: Sequelize.TEXT('long'),
        allowNull: true
      });
    } catch (e) {
      console.log('offer_letter_form.form_data column may already exist');
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('service_letter_form', 'form_data');
    } catch (e) {}
    try {
      await queryInterface.removeColumn('offer_letter_form', 'form_data');
    } catch (e) {}
  }
};
