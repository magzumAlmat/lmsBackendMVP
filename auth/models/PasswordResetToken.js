const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('./User');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: false,
});

PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });

module.exports = PasswordResetToken;