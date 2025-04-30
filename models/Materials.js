const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Отложенный импорт модели File
let File;

const Material = sequelize.define('Material', {
  material_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lesson_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'lessons',
      key: 'id',
    },
  },
}, {
  tableName: 'materials',
  timestamps: false,
});

// Устанавливаем связь "один ко многим" после загрузки модели File
Material.associate = (models) => {
  File = models.File; // Получаем модель File из объекта models
  Material.hasMany(File, {
    foreignKey: 'material_id', // Поле material_id в модели File
    as: 'files', // Алиас для связи
  });
};

module.exports = Material;