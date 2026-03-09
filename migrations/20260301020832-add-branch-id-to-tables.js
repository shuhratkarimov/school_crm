'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Qo'shish
    const tables = ['users', 'students', 'teachers', 'groups', 'payments', 'expenses', 'notes'];
    for (const table of tables) {
      await queryInterface.addColumn(table, 'branch_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'branches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });

      await queryInterface.addIndex(table, ['branch_id']);
    }

    // Eski datani default branch bilan update qilish
    const defaultBranchId = 'PUT_DEFAULT_BRANCH_UUID'; // <--- O'zgartir
    await queryInterface.sequelize.query(`
      UPDATE users SET branch_id = '${defaultBranchId}' WHERE role NOT IN ('director','superadmin');
      UPDATE students SET branch_id = '${defaultBranchId}';
      UPDATE teachers SET branch_id = '${defaultBranchId}';
      UPDATE groups SET branch_id = '${defaultBranchId}';
      UPDATE payments SET branch_id = '${defaultBranchId}';
      UPDATE expenses SET branch_id = '${defaultBranchId}';
      UPDATE notes SET branch_id = '${defaultBranchId}';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Rollback
    const tables = ['users', 'students', 'teachers', 'groups', 'payments', 'expenses', 'notes'];
    for (const table of tables) {
      await queryInterface.removeColumn(table, 'branch_id');
    }
  }
};