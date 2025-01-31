import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
} from '@mui/material';
import axios from 'axios';

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'numerical';
  options: string[];
  correctAnswer: string;
  points: number;
  category: string;
  explanation?: string;
}

interface Answer {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface TestResult {
  totalScore: number;
  timeTaken: number;
  startTime: string;
  endTime: string;
  status: 'completed' | 'timeout';
  answers: Answer[];
}

const TestResult: React.FC = () => {
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const response = await axios.get<TestResult>('/api/student/result');
      setResult(response.data);
    } catch (error) {
      setError('Failed to load test results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box p={3}>
        <Alert severity="info">No test results found.</Alert>
      </Box>
    );
  }

  const totalQuestions = result.answers.length;
  const correctAnswers = result.answers.filter((a) => a.isCorrect).length;
  const percentage = (result.totalScore / (totalQuestions * 2)) * 100;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Test Results
        </Typography>

        <Box display="flex" gap={3} mb={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Score
            </Typography>
            <Typography variant="h5">
              <Chip
                label={`${result.totalScore} points (${percentage.toFixed(1)}%)`}
                color={getScoreColor(percentage)}
              />
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Correct Answers
            </Typography>
            <Typography variant="h5">
              {correctAnswers} / {totalQuestions}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Time Taken
            </Typography>
            <Typography variant="h5">{formatDuration(result.timeTaken)}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={result.status === 'completed' ? 'Completed' : 'Timed Out'}
              color={result.status === 'completed' ? 'success' : 'error'}
            />
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                <TableCell>Your Answer</TableCell>
                <TableCell>Correct Answer</TableCell>
                <TableCell>Points</TableCell>
                <TableCell>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.answers.map((answer, index) => (
                <TableRow key={answer.question.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {index + 1}. {answer.question.question}
                    </Typography>
                    {answer.question.explanation && !answer.isCorrect && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, fontStyle: 'italic' }}
                      >
                        Explanation: {answer.question.explanation}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{answer.selectedAnswer || '-'}</TableCell>
                  <TableCell>{answer.question.correctAnswer}</TableCell>
                  <TableCell>{answer.question.points}</TableCell>
                  <TableCell>
                    <Chip
                      label={answer.isCorrect ? 'Correct' : 'Incorrect'}
                      color={answer.isCorrect ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TestResult; 