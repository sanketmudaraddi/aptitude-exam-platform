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
  Divider,
  Stack
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

interface ExamData {
  examId: number;
  title: string;
  instructions: string;
  duration: number;
  totalMarks: number;
  questions: Question[];
  startTime: string;
  endTime: string;
  attemptId: string;
}

const ExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentDetailsStr = sessionStorage.getItem('examUserDetails');
    if (!studentDetailsStr) {
      navigate(`/exam/${examId}`);
      return;
    }
    const studentDetails = JSON.parse(studentDetailsStr);
    fetchExam(studentDetails);
  }, [examId]);

  useEffect(() => {
    if (examData) {
      setAnswers(examData.questions.map(q => ({
        questionId: q.id,
        selectedAnswer: -1
      })));

      const endTime = new Date(examData.endTime).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((endTime - now) / 1000)));
    }
  }, [examData]);

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

  const fetchExam = async (studentDetails: any) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/student/exam-access/${examId}`, {
        params: studentDetails
      });
      setExamData(response.data);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load exam');
      if (error.response?.status === 404 || error.response?.status === 401) {
        navigate(`/exam/${examId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    if (!examData) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: examData.questions[currentQuestionIndex].id,
      selectedAnswer: parseInt(value)
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (examData && currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!examData) return;

    try {
      const studentDetails = sessionStorage.getItem('examUserDetails');
      const response = await axios.post(`/api/student/exam-submit/${examData.attemptId}`, {
        studentDetails: JSON.parse(studentDetails || '{}'),
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer
        }))
      });

      sessionStorage.removeItem('examUserDetails');

      navigate('/student/result', { 
        state: { 
          result: response.data,
          examTitle: examData.title
        } 
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit exam');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>Loading exam...</Typography>
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

  if (!examData) {
    return (
      <Container>
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">Exam not found</Alert>
        </Box>
      </Container>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examData.questions.length) * 100;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>{examData.title}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total Questions: {examData.questions.length} | Total Marks: {examData.totalMarks}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: { md: 'right' } }}>
                <Typography variant="h5" color="error">
                  Time Left: {formatTime(timeLeft)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Question {currentQuestionIndex + 1} of {examData.questions.length}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Progress Bar */}
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            mb: 3,
            backgroundColor: 'grey.200'
          }} 
        />

        {/* Question Card */}
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Question {currentQuestion.questionNumber}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {currentQuestion.question}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Category: {currentQuestion.category} | Points: {currentQuestion.points}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <RadioGroup
              value={currentAnswer?.selectedAnswer.toString() || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
            >
              <Stack spacing={2}>
                {currentQuestion.options.map((option, index) => (
                  <Paper 
                    key={index} 
                    variant="outlined"
                    sx={{ 
                      p: 1,
                      borderColor: currentAnswer?.selectedAnswer === currentQuestion.optionMapping[index] 
                        ? 'primary.main' 
                        : 'grey.300',
                      bgcolor: currentAnswer?.selectedAnswer === currentQuestion.optionMapping[index]
                        ? 'primary.50'
                        : 'transparent'
                    }}
                  >
                    <FormControlLabel
                      value={currentQuestion.optionMapping[index].toString()}
                      control={<Radio />}
                      label={
                        <Typography variant="body1">
                          {String.fromCharCode(65 + index)}. {option}
                        </Typography>
                      }
                      sx={{ 
                        margin: 0,
                        width: '100%'
                      }}
                    />
                  </Paper>
                ))}
              </Stack>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Grid container spacing={2} justifyContent="space-between">
          <Grid item>
            <Button
              variant="contained"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              size="large"
            >
              Previous
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="error"
              onClick={() => setConfirmSubmit(true)}
              size="large"
            >
              Submit Exam
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={currentQuestionIndex === examData.questions.length - 1}
              size="large"
            >
              Next
            </Button>
          </Grid>
        </Grid>

        {/* Submit Confirmation Dialog */}
        <Dialog 
          open={confirmSubmit} 
          onClose={() => setConfirmSubmit(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Are you sure you want to submit the exam? You cannot change your answers after submission.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Summary:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="text.secondary">
                    Total Questions: {examData.questions.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary">
                    Answered: {answers.filter(a => a.selectedAnswer !== -1).length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="text.secondary">
                    Unanswered: {answers.filter(a => a.selectedAnswer === -1).length}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmSubmit(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Confirm Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ExamPage; 