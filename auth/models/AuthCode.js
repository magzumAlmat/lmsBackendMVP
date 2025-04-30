const {DataTypes} = require('sequelize')
const sequelize = require('../../config/db')
//asdads
const AuthCode = sequelize.define('AuthCode', {
  email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
  link:{
    type: DataTypes.STRING,
    allowNull: true,
  },

  valid_till:{
    type: DataTypes.DATE,
    allowNull: true,
  },
},{
  timestamps:true,}
)


module.exports = AuthCode;
