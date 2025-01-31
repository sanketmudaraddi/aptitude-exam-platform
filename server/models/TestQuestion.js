const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestQuestion = sequelize.define('TestQuestion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    testId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'tests',
        key: 'id'
      }
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id'
      }
    },
    questionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    tableName: 'test_questions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['test_id']
      },
      {
        fields: ['question_id']
      },
      {
        unique: true,
        fields: ['test_id', 'question_number']
      }
    ]
  });

  return TestQuestion;
}; 