'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('new_students', 'father_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('new_students', 'birth_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('new_students', 'parents_phone_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('new_students', 'came_in_school', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('new_students', 'approved', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('new_students', 'father_name');
    await queryInterface.removeColumn('new_students', 'birth_date');
    await queryInterface.removeColumn('new_students', 'parents_phone_number');
    await queryInterface.removeColumn('new_students', 'came_in_school');
    await queryInterface.removeColumn('new_students', 'approved');
  },
};
