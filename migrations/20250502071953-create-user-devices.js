'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('UserDevices', {
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
    });

    // Add a unique index on userId and deviceId
    await queryInterface.addIndex('UserDevices', ['userId', 'deviceId'], {
      unique: true,
      name: 'user_devices_userId_deviceId_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('UserDevices');
  },
};