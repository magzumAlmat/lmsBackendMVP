const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Course = require('./Courses'); // Импорт модели Course
const User = require('../auth/models/User'); // Импорт модели User
const StreamStudent = require('../models/StreamStudents'); // Импорт модели связи

const Stream = sequelize.define('Stream', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'streams',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Устанавливаем связи
Course.hasMany(Stream, { foreignKey: 'courseId', as: 'streams' });
Stream.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(Stream, { foreignKey: 'teacherId', as: 'teachingStreams' });
Stream.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Связь "многие ко многим" между Stream и User (студентами)
Stream.belongsToMany(User, {
  through: StreamStudent,
  as: 'students',
  foreignKey: 'streamId',
});
User.belongsToMany(Stream, {
  through: StreamStudent,
  as: 'enrolledStreams',
  foreignKey: 'userId',
});

module.exports = Stream;