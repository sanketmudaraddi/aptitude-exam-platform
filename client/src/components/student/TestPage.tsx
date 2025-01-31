import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Question {
  id: number;
  question: string;
  options: string[];
  optionMapping: number[];
  category: string;
  difficulty: string;
  points: number;
  questionNumber: number;
}

interface Answer {
  questionId: number;
  selectedAnswer: number;
}

interface TestData {
  testId: number;
  title: string;
  instructions: string;
  duration: number;
  totalMarks: number;
  questions: Question[];
  startTime: string;
  endTime: string;
  attemptId: string;
}

const TestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (testData) {
      // Initialize answers array
      setAnswers(testData.questions.map(q => ({
        questionId: q.id,
        selectedAnswer: -1 // -1 means no answer selected
      })));

      // Calculate initial time left
      const endTime = new Date(testData.endTime).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((endTime - now) / 1000)));
    }
  }, [testData]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/student/test-access/${testId}`);
      setTestData(response.data);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    if (!testData) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: testData.questions[currentQuestionIndex].id,
      selectedAnswer: parseInt(value)
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (testData && currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!testData) return;

    try {
      const response = await axios.post(`/api/student/test-submit/${testData.attemptId}`, {
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer
        }))
      });

      navigate('/student/result', { 
        state: { 
          result: response.data,
          testTitle: testData.title
        } 
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit test');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>Loading test...</Typography>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (!testData) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">Test not found</Alert>
        </Box>
      </Container>
    );
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testData.questions.length) * 100;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom>{testData.title}</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Typography variant="subtitle1">
                  Question {currentQuestionIndex + 1} of {testData.questions.length}
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="subtitle1" color="error">
                  Time Left: {formatTime(timeLeft)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Progress Bar */}
          <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />

          {/* Question Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Question {currentQuestion.questionNumber}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {currentQuestion.question}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <RadioGroup
                  value={currentAnswer?.selectedAnswer.toString() || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={currentQuestion.optionMapping[index].toString()}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </Box>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => setConfirmSubmit(true)}
            >
              Submit Test
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={currentQuestionIndex === testData.questions.length - 1}
            >
              Next
            </Button>
          </Box>
        </Paper>

        {/* Submit Confirmation Dialog */}
        <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to submit the test? You cannot change your answers after submission.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography>
                Answered: {answers.filter(a => a.selectedAnswer !== -1).length} of {testData.questions.length} questions
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
    </Container>
  );
};

export default TestPage; 