const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StreamStudent = sequelize.define('StreamStudent', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  streamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'streams', // Название таблицы потоков
      key: 'id',
    },
    onDelete: 'CASCADE', // Если поток удаляется, все записи в таблице связи тоже удаляются
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Название таблицы пользователей
      key: 'id',
    },
    onDelete: 'CASCADE', // Если пользователь удаляется, запись в таблице связи тоже удаляется
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Дата присоединения студента к потоку
  },
}, {
  tableName: 'stream_students',
  timestamps: false,
});

module.exports = StreamStudent;