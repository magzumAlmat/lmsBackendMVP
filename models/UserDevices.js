const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import the sequelize instance
const User = require('../auth/models/User'); // Import User for associations

const UserDevices = sequelize.define('UserDevices', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  deviceId: {
    type: DataTypes.STRING(64), // For SHA-256 or UUID
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'UserDevices',
  timestamps: false, // Only createdAt is needed, as per migration
});

// Define associations
UserDevices.associate = (models) => {
  UserDevices.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
};

module.exports = UserDevices;