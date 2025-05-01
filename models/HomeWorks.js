const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Lesson = require('./Lessons');
const User = require('../auth/models/User'); // Предполагается, что модель User уже существует
const File = require('./File');

const Homework = sequelize.define('Homework', {
  homework_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER, // или UUID, если в User используется UUID
    allowNull: false,
    references: {
      model: 'users',
      key: 'id', // или другой ключ, если в User используется другой первичный ключ
    },
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lessons',
      key: 'id',
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'not_checked',
  },
  grade: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'homeworks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Устанавливаем связи
Homework.associate = (models) => {
  // Связь с User
  Homework.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // Связь с Lesson
  Homework.belongsTo(models.Lesson, {
    foreignKey: 'lesson_id',
    as: 'lesson',
  });

  // Связь с File (один ко многим)
  Homework.hasMany(models.File, {
    foreignKey: 'homework_id', // Новое поле в таблице File
    as: 'files',
  });
};

module.exports = Homework;