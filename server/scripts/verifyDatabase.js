const { sequelize, Test, Question, TestQuestion, User, TestResult } = require('../models');

async function verifyDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection OK!');

    // Force sync all models with database
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create default admin user if none exists
    const adminExists = await User.findOne({
      where: {
        role: 'admin'
      }
    });

    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        is_verified: true
      });
      console.log('Default admin user created');
    }

    // Create default student user if none exists
    const studentExists = await User.findOne({
      where: {
        email: 'unix@gmail.com'
      }
    });

    if (!studentExists) {
      await User.create({
        username: 'Unix User',
        email: 'unix@gmail.com',
        password: '123456',
        role: 'student',
        is_verified: true,
        college: 'Test College'
      });
      console.log('Default student user created');
    }

    // Create sample questions
    const sampleQuestions = [
      {
        question: "What is 25% of 400?",
        option1: "100",
        option2: "150",
        option3: "75",
        option4: "125",
        correctAnswer: 0,
        category: "Numerical",
        difficulty: "Easy"
      },
      {
        question: "If A > B and B > C, then:",
        option1: "A is always greater than C",
        option2: "A is equal to C",
        option3: "C is greater than A",
        option4: "Cannot be determined",
        correctAnswer: 0,
        category: "Logical",
        difficulty: "Medium"
      }
    ];

    // Add sample questions
    for (const q of sampleQuestions) {
      await Question.create(q);
    }
    console.log('Sample questions created');

    // Verify tables
    const userCount = await User.count();
    console.log(`Users in database: ${userCount}`);

    const testCount = await Test.count();
    console.log(`Tests in database: ${testCount}`);

    const questionCount = await Question.count();
    console.log(`Questions in database: ${questionCount}`);

    const testQuestionCount = await TestQuestion.count();
    console.log(`Test-Question associations in database: ${testQuestionCount}`);

    const testResultCount = await TestResult.count();
    console.log(`Test results in database: ${testResultCount}`);

    console.log('Database verification complete!');
  } catch (error) {
    console.error('Database verification failed:', error);
    process.exit(1);
  }
}

verifyDatabase(); 