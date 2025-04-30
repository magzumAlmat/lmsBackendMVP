module.exports = (sequelize) => {
    const Exercise = sequelize.define('Exercise', {
      exercise_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
    }, {
      tableName: 'exercises',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    });
  
    return Exercise;
  };