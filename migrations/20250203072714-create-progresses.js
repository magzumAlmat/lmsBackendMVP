'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('progresses', {
      progress_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users', // Указываем имя таблицы (модели)
          key: 'id',      // Указываем первичный ключ в таблице Users
        },
        allowNull: false,
      },
      lesson_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'lessons',
          key: 'id',
        },
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'not_started',
      },
      isfinished: {
        type: Sequelize.STRING(50),
        defaultValue: 'no',
      },
      completed_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('progresses');
  },
};