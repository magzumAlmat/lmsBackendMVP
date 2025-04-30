const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Course = require('./Courses');
const Homework = require('./Homeworks'); // Импортируем модель Homework

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isReviewLesson: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  priority_config: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: { EditorJS: 1, Video: 2, AdditionalMaterials: 3 },
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'lessons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Устанавливаем связи
Lesson.associate = (models) => {
  Lesson.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
  Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons' });

  // Связь с Homework
  Lesson.hasMany(models.Homework, {
    foreignKey: 'lesson_id',
    as: 'homeworks',
  });
};





module.exports = Lesson;