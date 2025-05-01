'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создание таблицы homeworks
    await queryInterface.createTable('homeworks', {
      homework_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      lesson_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'lessons',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'created',
      },
      grade: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Добавление поля homework_id в таблицу files
    await queryInterface.addColumn('Files', 'homework_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'homeworks',
        key: 'homework_id',
      },
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Удаление поля homework_id из таблицы files
    await queryInterface.removeColumn('Files', 'homework_id');
    
    // Удаление таблицы homeworks
    await queryInterface.dropTable('homeworks');
  },
};