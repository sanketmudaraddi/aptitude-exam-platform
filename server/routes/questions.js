const express = require('express');
const router = express.Router();
const { Question } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { callLLM } = require('../services/llmService');

// Get all questions (admin and authenticated users)
router.get('/', auth, async (req, res) => {
  try {
    const questions = await Question.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Transform the data to match the frontend format
    const transformedQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: [q.option1, q.option2, q.option3, q.option4],
      correctAnswer: req.user.role === 'admin' ? q.correctAnswer : undefined,
      category: q.category,
      difficulty: q.difficulty,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));

    res.json(transformedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Create a new question (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    console.log('Received request body:', req.body);

    const {
      question,
      option1,
      option2,
      option3,
      option4,
      correctAnswer,
      category,
      difficulty
    } = req.body;

    // Validate required fields
    if (!question || !option1 || !option2 || !option3 || !option4 || correctAnswer === undefined || !category || !difficulty) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['question', 'option1', 'option2', 'option3', 'option4', 'correctAnswer', 'category', 'difficulty']
      });
    }

    // Create the question
    const newQuestion = await Question.create({
      question,
      option1,
      option2,
      option3,
      option4,
      correctAnswer,
      category,
      difficulty
    });
    
    // Transform the response to match frontend format
    const responseData = {
      id: newQuestion.id,
      question: newQuestion.question,
      options: [newQuestion.option1, newQuestion.option2, newQuestion.option3, newQuestion.option4],
      correctAnswer: newQuestion.correctAnswer,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      createdAt: newQuestion.createdAt,
      updatedAt: newQuestion.updatedAt
    };

    console.log('Question created successfully:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ 
      error: 'Failed to create question',
      details: error.message
    });
  }
});

// Update a question (admin only)
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const {
      question: questionText,
      option1,
      option2,
      option3,
      option4,
      correctAnswer,
      category,
      difficulty
    } = req.body;

    await question.update({
      question: questionText,
      option1,
      option2,
      option3,
      option4,
      correctAnswer,
      category,
      difficulty
    });
    
    // Transform the response
    const responseData = {
      id: question.id,
      question: question.question,
      options: [question.option1, question.option2, question.option3, question.option4],
      correctAnswer: question.correctAnswer,
      category: question.category,
      difficulty: question.difficulty,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question', details: error.message });
  }
});

// Delete a question (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    await question.destroy();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question', details: error.message });
  }
});

router.post('/generate', async (req, res) => {
  const { query } = req.body;
  const prompt = `Generate an aptitude question based on the following: ${query}`;
  try {
      const question = await callLLM(prompt); // Function to interact with the LLM
      res.status(200).json({ question });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate question' });
  }
});

router.post('/save', async (req, res) => {
  const { questionText, topic, difficulty } = req.body;
  try {
      const newQuestion = await Question.create({ questionText, topic, difficulty });
      res.status(201).json({ message: 'Question saved successfully', question: newQuestion });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save question' });
  }
});


module.exports = router; 