const {DataTypes} = require('sequelize')
const sequelize = require('../../config/db')
const Role = require('./Role')
const Company = require('./Company')
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      areasofactivity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      review: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jwt_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
   

},{
    timestamps:false,})

User.belongsTo(Role,{foreignKey:'roleId'})
// User.belongsTo(Company,{foreignKey:'companyId'})




User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  
  // Хеширование пароля перед сохранением
  User.beforeCreate(async (user) => {
    if (user.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  
module.exports = User;
