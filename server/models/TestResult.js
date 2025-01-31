const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestResult = sequelize.define('TestResult', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    test_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'tests',
        key: 'id'
      },
      field: 'test_id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'start_time'
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_questions'
    },
    correct_answers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'correct_answers'
    },
    wrong_answers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'wrong_answers'
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'abandoned'),
      defaultValue: 'in_progress'
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object containing question IDs and selected answers'
    }
  }, {
    tableName: 'test_results',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['test_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  return TestResult;
}; 