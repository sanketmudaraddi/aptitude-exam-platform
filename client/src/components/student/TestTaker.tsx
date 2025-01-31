import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'numerical';
  options: string[];
  points: number;
  category: string;
}

interface Answer {
  questionId: string;
  selectedAnswer: string;
}

const TestTaker: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchQuestions();
    const startTime = Date.now();
    localStorage.setItem('testStartTime', startTime.toString());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get<Question[]>('/api/student/test');
      setQuestions(response.data);
      setAnswers(response.data.map((q) => ({ questionId: q.id, selectedAnswer: '' })));
    } catch (error) {
      setError('Failed to load test questions. Please try again.');
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex].selectedAnswer = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const startTime = parseInt(localStorage.getItem('testStartTime') || '0');
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000 / 60); // Convert to minutes

      await axios.post('/api/student/submit', {
        answers,
        timeTaken,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });

      navigate('/result');
    } catch (error) {
      setError('Failed to submit test. Please try again.');
    }
  };

  if (questions.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Loading test...
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <Typography variant="h6" color="error">
            Time Left: {formatTime(timeLeft)}
          </Typography>
        </Box>

        <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />

        <Typography variant="body1" gutterBottom>
          {currentQuestion.question}
        </Typography>

        {currentQuestion.type === 'multiple-choice' && (
          <RadioGroup
            value={currentAnswer.selectedAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            {currentQuestion.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        )}

        {currentQuestion.type === 'true-false' && (
          <RadioGroup
            value={currentAnswer.selectedAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            <FormControlLabel value="true" control={<Radio />} label="True" />
            <FormControlLabel value="false" control={<Radio />} label="False" />
          </RadioGroup>
        )}

        {currentQuestion.type === 'numerical' && (
          <Box mt={2}>
            <input
              type="number"
              value={currentAnswer.selectedAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              style={{
                padding: '8px',
                fontSize: '16px',
                width: '200px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </Box>
        )}

        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setConfirmSubmit(true)}
            >
              Submit Test
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your test? You cannot change your answers after
            submission.
          </Typography>
          <Box mt={2}>
            <Typography color="error">
              Unanswered Questions:{' '}
              {answers.filter((a) => !a.selectedAnswer).length}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestTaker; 