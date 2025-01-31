const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { Question, Test, TestQuestion, User, TestResult } = require('../models');
const sequelize = require('sequelize');

// Verify admin access
router.get('/verify', adminAuth, async (req, res) => {
  try {
    const admin = await User.findOne({
      where: { id: req.user.id, role: 'admin' },
      attributes: ['id', 'username', 'email', 'role', 'is_verified', 'lastLogin']
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    res.json({
      success: true,
      user: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying admin access',
      error: error.message
    });
  }
});

// Get admin dashboard data
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalTests = await Test.count();
    const recentTests = await Test.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['username']
      }]
    });
    const recentResults = await TestResult.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['username', 'email']
        },
        {
          model: Test,
          attributes: ['title']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTests,
        recentTests,
        recentResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// Get all questions
router.get('/questions', adminAuth, async (req, res) => {
  try {
    const questions = await Question.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// Schedule a new test
router.post('/tests', adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      instructions
    } = req.body;

    const test = await Test.create({
      title,
      description,
      duration,
      start_time: startTime,
      end_time: endTime,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      instructions,
      status: 'published',
      created_by: req.user.id
    });

    res.status(201).json(test);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// Add questions to the test
router.post('/tests/:testId/questions', adminAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { questions } = req.body;

    const test = await Test.findByPk(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Add each question
    const createdQuestions = await Promise.all(questions.map(async (q, index) => {
      const question = await Question.create({
        question: q.question,
        option1: q.options[0],
        option2: q.options[1],
        option3: q.options[2],
        option4: q.options[3],
        correctAnswer: q.correctAnswer,
        category: q.category,
        difficulty: q.difficulty
      });

      // Link question to test
      await TestQuestion.create({
        test_id: testId,
        question_id: question.id,
        question_number: index + 1,
        points: q.points || 1
      });

      return question;
    }));

    res.status(201).json(createdQuestions);
  } catch (error) {
    console.error('Error adding questions:', error);
    res.status(500).json({ error: 'Failed to add questions' });
  }
});

// Get all tests
router.get('/tests', adminAuth, async (req, res) => {
  try {
    const tests = await Test.findAll({
      include: [{
        model: Question,
        through: { attributes: ['question_number', 'points'] }
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Get test by ID
router.get('/tests/:id', adminAuth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id, {
      include: [{
        model: Question,
        through: { attributes: ['question_number', 'points'] }
      }]
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test', details: error.message });
  }
});

// Update test status
router.patch('/tests/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const test = await Test.findByPk(req.params.id);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await test.update({ status });
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test status', details: error.message });
  }
});

// Delete test
router.delete('/tests/:id', adminAuth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await test.destroy();
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test', details: error.message });
  }
});

// Get all test results
router.get('/results', adminAuth, async (req, res) => {
  try {
    const results = await TestResult.findAll({
      include: [{
        model: User,
        attributes: ['id', 'username', 'email', 'college']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
});

// Get test result by ID
router.get('/results/:id', adminAuth, async (req, res) => {
  try {
    const result = await TestResult.findByPk(req.params.id, {
      include: [{
        model: User,
        attributes: ['id', 'username', 'email', 'college']
      }]
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching result', error: error.message });
  }
});

// Get statistics
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalQuestions = await Question.count();
    const totalTests = await Test.count();
    
    const averageScore = await TestResult.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'average']],
      raw: true
    });

    const statistics = {
      totalStudents,
      totalQuestions,
      totalTests,
      averageScore: averageScore?.average || 0
    };

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Test route to verify server is working
router.get('/test-server', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Create sample test (GET route for easier testing)
router.get('/create-sample-test', async (req, res) => {
  try {
    // Delete any existing tests (for testing purposes)
    await Test.destroy({ where: {} });
    await Question.destroy({ where: {} });
    await TestQuestion.destroy({ where: {} });

    // Create a test with current time
    const now = new Date();
    const test = await Test.create({
      title: 'Sample Aptitude Test',
      description: 'Basic aptitude test covering numerical, verbal, and logical reasoning',
      duration: 60, // 60 minutes
      start_time: now,
      end_time: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
      total_marks: 50,
      passing_marks: 30,
      instructions: 'Please read each question carefully. Select the best answer from the given options.',
      status: 'published',
      created_by: 1 // Assuming admin has ID 1
    });

    // Sample questions
    const questions = [
      {
        question: 'What comes next in the sequence: 2, 4, 8, 16, __?',
        options: ['24', '32', '28', '20'],
        correctAnswer: 1, // 32
        category: 'Numerical',
        difficulty: 'Easy',
        points: 2
      },
      {
        question: 'If COMPUTER is coded as RFUVQNPC, then how will PRINTER be coded?',
        options: ['QSJOUFQ', 'QSJOUFS', 'QSJASFE', 'QSJOUST'],
        correctAnswer: 0, // QSJOUFQ
        category: 'Logical',
        difficulty: 'Medium',
        points: 3
      },
      {
        question: 'Choose the word that is opposite in meaning to BENEVOLENT.',
        options: ['Malevolent', 'Generous', 'Kind', 'Charitable'],
        correctAnswer: 0, // Malevolent
        category: 'Verbal',
        difficulty: 'Medium',
        points: 2
      }
    ];

    // Add questions to the test
    await Promise.all(questions.map(async (q, index) => {
      const question = await Question.create({
        question: q.question,
        option1: q.options[0],
        option2: q.options[1],
        option3: q.options[2],
        option4: q.options[3],
        correctAnswer: q.correctAnswer,
        category: q.category,
        difficulty: q.difficulty
      });

      await TestQuestion.create({
        test_id: test.id,
        question_id: question.id,
        question_number: index + 1,
        points: q.points
      });
    }));

    // Get the complete test with questions to verify
    const completeTest = await Test.findOne({
      where: { id: test.id },
      include: [{
        model: Question,
        through: { attributes: ['question_number', 'points'] }
      }]
    });

    res.status(201).json({
      message: 'Sample test created successfully',
      testId: test.id,
      examUrl: `/exam/${test.id}`,
      fullUrl: `http://localhost:3000/exam/${test.id}`,
      test: completeTest
    });
  } catch (error) {
    console.error('Error creating sample test:', error);
    res.status(500).json({ 
      error: 'Failed to create sample test', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Create a test with specific ID
router.get('/create-test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { Test, Question, TestQuestion } = require('../models');

    // Delete existing test if it exists
    await Test.destroy({ where: { id: testId } });

    // Create test
    const test = await Test.create({
      id: testId,
      title: 'Sample Aptitude Test',
      description: 'This is a sample test with various types of questions',
      duration: 30, // 30 minutes
      start_time: new Date(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Available for 24 hours
      total_marks: 25,
      passing_marks: 15,
      status: 'published',
      instructions: 'Read each question carefully. Select the best answer from the given options.',
      created_by: 1 // Assuming admin user has ID 1
    });

    // Sample questions
    const questions = [
      {
        question: 'What is 15% of 200?',
        options: ['20', '25', '30', '35'],
        correct_answer: '30',
        category: 'Numerical',
        difficulty: 'Easy',
        points: 5
      },
      {
        question: 'If A is greater than B and B is greater than C, then:',
        options: [
          'A is always greater than C',
          'A is equal to C',
          'C is greater than A',
          'Cannot be determined'
        ],
        correct_answer: 'A is always greater than C',
        category: 'Logical',
        difficulty: 'Medium',
        points: 5
      },
      {
        question: 'Choose the word that is opposite in meaning to "BENEVOLENT"',
        options: ['Malevolent', 'Generous', 'Kind', 'Charitable'],
        correct_answer: 'Malevolent',
        category: 'Verbal',
        difficulty: 'Medium',
        points: 5
      },
      {
        question: 'If 3x + 4 = 16, what is the value of x?',
        options: ['3', '4', '5', '6'],
        correct_answer: '4',
        category: 'Numerical',
        difficulty: 'Easy',
        points: 5
      },
      {
        question: 'Complete the series: 2, 6, 12, 20, __',
        options: ['30', '28', '32', '25'],
        correct_answer: '30',
        category: 'Logical',
        difficulty: 'Medium',
        points: 5
      }
    ];

    // Create questions and link them to the test
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const question = await Question.create({
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        category: q.category,
        difficulty: q.difficulty
      });

      await TestQuestion.create({
        testId: test.id,
        questionId: question.id,
        questionNumber: i + 1,
        points: q.points
      });
    }

    res.json({
      success: true,
      message: 'Test created successfully',
      testId: test.id,
      examUrl: `http://localhost:3000/exam/${test.id}`,
      adminUrl: `http://localhost:3000/admin/tests/${test.id}`
    });

  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test',
      error: error.message
    });
  }
});

// Create a new question
router.post('/questions', adminAuth, async (req, res) => {
  try {
    console.log('Received question data:', req.body); // Debug log

    const { question, option1, option2, option3, option4, correctAnswer, category, difficulty, points } = req.body;
    
    // Validate required fields
    if (!question || !option1 || !option2 || !option3 || !option4 || correctAnswer === undefined || !category || !difficulty) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields',
        receivedData: req.body // Debug info
      });
    }

    // Create the question with explicit data mapping
    const questionData = {
      question: String(question),
      option1: String(option1),
      option2: String(option2),
      option3: String(option3),
      option4: String(option4),
      correctAnswer: Number(correctAnswer),
      category: String(category),
      difficulty: String(difficulty).charAt(0).toUpperCase() + String(difficulty).slice(1).toLowerCase(),
      points: Number(points) || 1
    };

    console.log('Formatted question data:', questionData); // Debug log

    const newQuestion = await Question.create(questionData);

    console.log('Question created:', newQuestion.toJSON()); // Debug log

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: {
        ...newQuestion.toJSON(),
        options: [option1, option2, option3, option4]
      }
    });
  } catch (error) {
    console.error('Error creating question:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Question already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to create question',
      error: error.message
    });
  }
});

// Update a question
router.patch('/questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await question.update(req.body);
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update question',
      error: error.message 
    });
  }
});

// Delete a question
router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.destroy();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Failed to delete question', error: error.message });
  }
});

// Add sample question route (GET for easier testing)
router.get('/create-sample-question', async (req, res) => {
  try {
    const question = await Question.create({
      question: "What is 25% of 400?",
      option1: "100",
      option2: "150",
      option3: "75",
      option4: "125",
      correctAnswer: 0,  // First option (100) is correct
      category: "Numerical",
      difficulty: "Easy"
    });

    res.json({
      success: true,
      message: 'Sample question created successfully',
      question
    });
  } catch (error) {
    console.error('Error creating sample question:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample question',
      error: error.message
    });
  }
});

module.exports = router; 