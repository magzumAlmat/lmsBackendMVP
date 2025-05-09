const Sequelize = require('sequelize');
const sequelize = require('../config/db');
const fs = require('fs').promises;
// Импортируем модели
const Course = require('./Courses');
const Lesson = require('./Lessons');
const Material = require('./Materials');
const File = require('./File');
const Homework = require('./HomeWorks');
const User = require('../auth/models/User'); // Путь к User соответствует вашему проекту
const UserDevices=require('./UserDevices')

// Объект для хранения моделей
const models = {
  Course,
  Lesson,
  Material,
  File,
  Homework,
  User,
  UserDevices,
};





// Регистрируем ассоциации
Object.values(models).forEach((model) => {
  if (model.associate) {
    console.log(`Registering associations for ${model.name}`); // Логирование для отладки
    model.associate(models);
  }
});

// Добавляем sequelize и Sequelize в объект моделей
models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;