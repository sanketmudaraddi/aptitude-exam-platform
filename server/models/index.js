const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Import models
const User = require('./User')(sequelize);
const Question = require('./Question')(sequelize);
const Test = require('./Test')(sequelize);
const TestQuestion = require('./TestQuestion')(sequelize);
const TestResult = require('./TestResult')(sequelize);

// Set up associations
Test.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(Test, { foreignKey: 'created_by' });

Test.belongsToMany(Question, { 
  through: TestQuestion,
  foreignKey: 'testId',
  otherKey: 'questionId'
});
Question.belongsToMany(Test, { 
  through: TestQuestion,
  foreignKey: 'questionId',
  otherKey: 'testId'
});

TestResult.belongsTo(Test, {
  foreignKey: 'test_id'
});

Test.hasMany(TestResult, {
  foreignKey: 'test_id'
});

TestResult.belongsTo(User, {
  foreignKey: 'user_id'
});

User.hasMany(TestResult, {
  foreignKey: 'user_id'
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Question,
  Test,
  TestQuestion,
  TestResult
}; 