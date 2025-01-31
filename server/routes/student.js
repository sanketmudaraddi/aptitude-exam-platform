const express = require('express');
const router = express.Router();
const { studentAuth } = require('../middleware/auth');
const { Question, Test, TestQuestion, TestResult, User } = require('../models');
const { Op } = require('sequelize');

// Access test by unique link
router.get('/test-access/:testId', studentAuth, async (req, res) => {
  try {
    const testId = req.params.testId;
    
    // Find the test
    const test = await Test.findByPk(testId, {
      include: [{
        model: Question,
        through: {
          attributes: ['question_number', 'points'],
          order: [['question_number', 'ASC']]
        }
      }]
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check if test is published
    if (test.status !== 'published') {
      return res.status(403).json({ error: 'Test is not available' });
    }

    // Check if test time is valid
    const now = new Date();
    if (now < test.start_time) {
      return res.status(400).json({ 
        error: 'Test has not started yet',
        startTime: test.start_time
      });
    }
    if (now > test.end_time) {
      return res.status(400).json({ error: 'Test has ended' });
    }

    // Check if student has already attempted this test
    const existingAttempt = await TestResult.findOne({
      where: {
        test_id: test.id,
        user_id: req.user.id
      }
    });

    if (existingAttempt) {
      return res.status(400).json({ error: 'You have already attempted this test' });
    }

    // Create a new test attempt
    const testResult = await TestResult.create({
      test_id: test.id,
      user_id: req.user.id,
      start_time: now,
      end_time: new Date(now.getTime() + test.duration * 60000),
      total_questions: test.Questions.length,
      status: 'in_progress'
    });

    // Transform questions to remove answers and randomize options
    const questions = test.Questions.map(q => {
      // Create array of options with their original indices
      const options = [
        { text: q.option1, index: 0 },
        { text: q.option2, index: 1 },
        { text: q.option3, index: 2 },
        { text: q.option4, index: 3 }
      ];

      // Shuffle options
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        id: q.id,
        question: q.question,
        options: options.map(opt => opt.text),
        optionMapping: options.map(opt => opt.index), // Store original indices
        category: q.category,
        difficulty: q.difficulty,
        points: q.TestQuestion.points,
        questionNumber: q.TestQuestion.question_number
      };
    });

    res.json({
      testId: test.id,
      title: test.title,
      instructions: test.instructions,
      duration: test.duration,
      totalMarks: test.total_marks,
      questions,
      startTime: testResult.start_time,
      endTime: testResult.end_time,
      attemptId: testResult.id
    });
  } catch (error) {
    console.error('Error accessing test:', error);
    res.status(500).json({ error: 'Failed to access test', details: error.message });
  }
});

// Submit test answers
router.post('/test-submit/:attemptId', studentAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    const attemptId = req.params.attemptId;

    // Find the test attempt
    const testResult = await TestResult.findOne({
      where: {
        id: attemptId,
        user_id: req.user.id,
        status: 'in_progress'
      },
      include: [{
        model: Test,
        include: [{
          model: Question,
          through: { attributes: ['question_number', 'points'] }
        }]
      }]
    });

    if (!testResult) {
      return res.status(404).json({ error: 'No active test attempt found' });
    }

    // Check if test time has expired
    if (new Date() > testResult.end_time) {
      return res.status(400).json({ error: 'Test time has expired' });
    }

    // Grade the answers
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    const gradedAnswers = answers.map(answer => {
      const question = testResult.Test.Questions.find(q => q.id === answer.questionId);
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.TestQuestion.points;
        correctAnswers++;
      } else {
        wrongAnswers++;
      }

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points: isCorrect ? question.TestQuestion.points : 0
      };
    });

    // Update test result
    await testResult.update({
      score,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      answers: gradedAnswers,
      end_time: new Date(),
      status: 'completed'
    });

    res.json({
      message: 'Test submitted successfully',
      score,
      totalQuestions: testResult.Test.Questions.length,
      correctAnswers,
      wrongAnswers,
      passingMarks: testResult.Test.passing_marks,
      passed: score >= testResult.Test.passing_marks
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ error: 'Failed to submit test', details: error.message });
  }
});

// Get available tests for student
router.get('/tests', studentAuth, async (req, res) => {
  try {
    const tests = await Test.findAll({
      where: {
        status: 'published',
        start_time: {
          [Op.lte]: new Date() // Tests that have started
        },
        end_time: {
          [Op.gt]: new Date() // Tests that haven't ended
        }
      },
      attributes: ['id', 'title', 'description', 'start_time', 'end_time', 'duration', 'total_marks', 'passing_marks', 'instructions'],
      order: [['start_time', 'ASC']]
    });

    // Check if student has already attempted each test
    const testsWithAttempts = await Promise.all(tests.map(async (test) => {
      const attempt = await TestResult.findOne({
        where: {
          test_id: test.id,
          user_id: req.user.id
        }
      });

      // Generate test link
      const testLink = `/test/${test.id}`;

      return {
        ...test.toJSON(),
        attempted: !!attempt,
        testLink
      };
    }));

    res.json(testsWithAttempts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available tests', details: error.message });
  }
});

// Get test results
router.get('/results', studentAuth, async (req, res) => {
  try {
    const results = await TestResult.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Test,
        attributes: ['title', 'total_marks', 'passing_marks']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results', details: error.message });
  }
});

// Verify email and password for exam access
router.post('/exam-verify/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const { email, password } = req.body;

    console.log('Verifying exam access:', { examId, email });

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email not found. Please check your email or register.'
      });
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please try again.'
      });
    }

    // Check if exam exists and is published
    const test = await Test.findOne({
      where: { 
        id: examId,
        status: 'published'
      },
      include: [{
        model: Question,
        through: TestQuestion
      }]
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found or not available.'
      });
    }

    // Check if exam has questions
    if (!test.Questions || test.Questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam has no questions.'
      });
    }

    // Check if exam is within time window
    const now = new Date();
    if (now < test.start_time || now > test.end_time) {
      return res.status(403).json({
        success: false,
        message: 'Exam is not currently available.'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      exam: {
        id: test.id,
        title: test.title,
        duration: test.duration,
        totalMarks: test.total_marks,
        questionCount: test.Questions.length
      }
    });

  } catch (error) {
    console.error('Error verifying exam access:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying exam access',
      error: error.message
    });
  }
});

// Access exam by unique link (update existing route)
router.get('/exam-access/:examId', async (req, res) => {
  try {
    const examId = req.params.examId;
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ 
      where: { 
        email,
        role: 'student',
        is_verified: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the test (exam)
    const test = await Test.findOne({
      where: {
        id: examId,
        status: 'published'
      },
      include: [{
        model: Question,
        through: {
          attributes: ['question_number', 'points'],
          order: [['question_number', 'ASC']]
        }
      }]
    });

    if (!test) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if test time is valid
    const now = new Date();
    if (now < test.start_time) {
      return res.status(400).json({ 
        error: 'Exam has not started yet',
        startTime: test.start_time
      });
    }
    if (now > test.end_time) {
      return res.status(400).json({ error: 'Exam has ended' });
    }

    // Check if student has already attempted this exam
    const existingAttempt = await TestResult.findOne({
      where: {
        test_id: test.id,
        user_id: user.id
      }
    });

    if (existingAttempt) {
      return res.status(400).json({ error: 'You have already attempted this exam' });
    }

    // Create a new exam attempt
    const testResult = await TestResult.create({
      test_id: test.id,
      user_id: user.id,
      start_time: now,
      end_time: new Date(now.getTime() + test.duration * 60000),
      total_questions: test.Questions.length,
      status: 'in_progress'
    });

    // Transform questions to remove answers and randomize options
    const questions = test.Questions.map(q => {
      // Create array of options with their original indices
      const options = [
        { text: q.option1, index: 0 },
        { text: q.option2, index: 1 },
        { text: q.option3, index: 2 },
        { text: q.option4, index: 3 }
      ];

      // Shuffle options
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        id: q.id,
        question: q.question,
        options: options.map(opt => opt.text),
        optionMapping: options.map(opt => opt.index),
        category: q.category,
        difficulty: q.difficulty,
        points: q.TestQuestion.points,
        questionNumber: q.TestQuestion.question_number
      };
    });

    res.json({
      examId: test.id,
      title: test.title,
      instructions: test.instructions,
      duration: test.duration,
      totalMarks: test.total_marks,
      questions,
      startTime: testResult.start_time,
      endTime: testResult.end_time,
      attemptId: testResult.id
    });
  } catch (error) {
    console.error('Error accessing exam:', error);
    res.status(500).json({ error: 'Failed to access exam', details: error.message });
  }
});

// Submit exam answers
router.post('/exam-submit/:attemptId', studentAuth, async (req, res) => {
  try {
    const { answers } = req.body;
    const attemptId = req.params.attemptId;

    // Find the exam attempt
    const testResult = await TestResult.findOne({
      where: {
        id: attemptId,
        user_id: req.user.id,
        status: 'in_progress'
      },
      include: [{
        model: Test,
        include: [{
          model: Question,
          through: { attributes: ['question_number', 'points'] }
        }]
      }]
    });

    if (!testResult) {
      return res.status(404).json({ error: 'No active exam attempt found' });
    }

    // Check if exam time has expired
    if (new Date() > testResult.end_time) {
      return res.status(400).json({ error: 'Exam time has expired' });
    }

    // Grade the answers
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    const gradedAnswers = answers.map(answer => {
      const question = testResult.Test.Questions.find(q => q.id === answer.questionId);
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.TestQuestion.points;
        correctAnswers++;
      } else {
        wrongAnswers++;
      }

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points: isCorrect ? question.TestQuestion.points : 0
      };
    });

    // Update test result
    await testResult.update({
      score,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      answers: gradedAnswers,
      end_time: new Date(),
      status: 'completed'
    });

    res.json({
      message: 'Exam submitted successfully',
      score,
      totalQuestions: testResult.Test.Questions.length,
      correctAnswers,
      wrongAnswers,
      passingMarks: testResult.Test.passing_marks,
      passed: score >= testResult.Test.passing_marks
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ error: 'Failed to submit exam', details: error.message });
  }
});

module.exports = router; 