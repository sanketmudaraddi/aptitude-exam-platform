const { sequelize, Question } = require('../models');

async function createSampleQuestion() {
  try {
    await sequelize.sync();

    const question = await Question.create({
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correct_answer: "4",
      category: "Numerical",
      difficulty: "Easy"
    });

    console.log('Question created successfully:', question.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Error creating question:', error);
    process.exit(1);
  }
}

createSampleQuestion(); 