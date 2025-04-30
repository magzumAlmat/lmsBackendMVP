'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Проверяем, существует ли столбец material_id
    const tableInfo = await queryInterface.describeTable('Files');
    if (!tableInfo.material_id) {
      await queryInterface.addColumn('Files', 'material_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'materials',
          key: 'material_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      });
    } else {
      console.log('Column "material_id" already exists in table "Files". Skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем столбец material_id, если он существует
    const tableInfo = await queryInterface.describeTable('Files');
    if (tableInfo.material_id) {
      await queryInterface.removeColumn('Files', 'material_id');
    } else {
      console.log('Column "material_id" does not exist in table "Files". Skipping...');
    }
  },
};