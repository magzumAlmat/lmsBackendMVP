const Role = require('../auth/models/Role');
const User = require('../auth/models/User'); // Импортируем модель User
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs'); // Импортируем bcrypt для хеширования паролей

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создаем роли
    await Role.bulkCreate([
      { name: 'admin' },
      { name: 'teacher' }, // Тот, кто держит уже билборды и его проверяет инспектор
      { name: 'student' }, // Тот, кто будет закупать рекламу и отдавать на проверку
    ]);

    // Получаем созданные роли для использования их ID
    const roles = await Role.findAll();
    const adminRole = roles.find((role) => role.name === 'admin');
    const teacherRole = roles.find((role) => role.name === 'teacher');
    const studentRole = roles.find((role) => role.name === 'student');

    // Хешируем пароли для пользователей
    const hashedPasswordAdmin = await bcrypt.hash('1', 10);
    const hashedPasswordTeacher = await bcrypt.hash('1', 10);
    const hashedPasswordStudent = await bcrypt.hash('1', 10);

    // Создаем пользователей с привязкой к ролям
    await User.bulkCreate([
      {
        email: 'admin@example.com',
        password: hashedPasswordAdmin,
        phone: '1234567890',
        name: 'Admin',
        lastname: 'User',
        roleId: adminRole.id,
      },
      {
        email: 'teacher@example.com',
        password: hashedPasswordTeacher,
        phone: '0987654321',
        name: 'Teacher',
        lastname: 'User',
        roleId: teacherRole.id,
      },
      {
        email: 'student@example.com',
        password: hashedPasswordStudent,
        phone: '5555555555',
        name: 'Student',
        lastname: 'User',
        roleId: studentRole.id,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем пользователей и роли
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Roles', null, {});
  },
};