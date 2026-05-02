'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE student_groups SET month = 'Sentyabr' WHERE month = 'Sentabr';
      UPDATE student_groups SET month = 'Oktyabr' WHERE month = 'Oktabr';
      UPDATE payments SET for_which_month = 'Sentyabr' WHERE for_which_month = 'Sentabr';
      UPDATE payments SET for_which_month = 'Oktyabr' WHERE for_which_month = 'Oktabr';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE student_groups SET month = 'Sentabr' WHERE month = 'Sentyabr';
      UPDATE student_groups SET month = 'Oktabr' WHERE month = 'Oktyabr';
      UPDATE payments SET for_which_month = 'Sentabr' WHERE for_which_month = 'Sentyabr';
      UPDATE payments SET for_which_month = 'Oktabr' WHERE for_which_month = 'Oktyabr';
    `);
  },
};
