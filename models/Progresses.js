const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Progress = sequelize.define('Progress', {
  progress_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'lessons',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'not_started',
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isfinished: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'no',
  },
}, {
  tableName: 'progresses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = {Progress};
