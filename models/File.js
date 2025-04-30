const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Material = require("./Materials");
const Homework = require("./HomeWorks"); // Импортируем модель Homework

const File = sequelize.define("File", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  material_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "materials",
      key: "material_id",
    },
    allowNull: true,
  },
  homework_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "homeworks",
      key: "homework_id",
    },
    allowNull: true,
  },
});

// Устанавливаем связи
File.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material',
});

File.belongsTo(Homework, {
  foreignKey: 'homework_id',
  as: 'homework',
});

module.exports = File;