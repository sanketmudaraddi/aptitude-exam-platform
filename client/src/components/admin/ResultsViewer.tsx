import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface TestResult {
  id: number;
  userId: number;
  username: string;
  college: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  submittedAt: string;
  answers: {
    questionId: number;
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
}

interface Filters {
  college: string;
  scoreRange: string;
  dateRange: string;
}

const initialFilters: Filters = {
  college: '',
  scoreRange: 'all',
  dateRange: 'all',
};

const ResultsViewer: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [colleges, setColleges] = useState<string[]>([]);

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(filters.college && { college: filters.college }),
        ...(filters.scoreRange !== 'all' && { scoreRange: filters.scoreRange }),
        ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
      });

      const response = await axios.get(`/api/admin/results?${params}`);
      setResults(response.data.results);
      setTotalPages(Math.ceil(response.data.total / 10));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch test results');
    } finally {
      setLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await axios.get('/api/admin/colleges');
      setColleges(response.data.colleges);
    } catch (err: any) {
      console.error('Failed to fetch colleges:', err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, filters]);

  useEffect(() => {
    fetchColleges();
  }, []);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleViewDetails = (result: TestResult) => {
    setSelectedResult(result);
    setDetailsOpen(true);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const applyFilters = () => {
    setPage(1);
    setFilterDialogOpen(false);
    fetchResults();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Test Results
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterDialogOpen(true)}
        >
          Filter Results
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>College</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Time Taken</TableCell>
              <TableCell align="right">Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>{result.username}</TableCell>
                <TableCell>{result.college}</TableCell>
                <TableCell align="right">
                  {result.score}/{result.totalQuestions}
                </TableCell>
                <TableCell align="right">{formatTime(result.timeTaken)}</TableCell>
                <TableCell align="right">
                  {new Date(result.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleViewDetails(result)}
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Results</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>College</InputLabel>
            <Select
              value={filters.college}
              onChange={(e) =>
                setFilters({ ...filters, college: e.target.value as string })
              }
              label="College"
            >
              <MenuItem value="">All Colleges</MenuItem>
              {colleges.map((college) => (
                <MenuItem key={college} value={college}>
                  {college}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Score Range</InputLabel>
            <Select
              value={filters.scoreRange}
              onChange={(e) =>
                setFilters({ ...filters, scoreRange: e.target.value as string })
              }
              label="Score Range"
            >
              <MenuItem value="all">All Scores</MenuItem>
              <MenuItem value="0-40">0-40%</MenuItem>
              <MenuItem value="41-60">41-60%</MenuItem>
              <MenuItem value="61-80">61-80%</MenuItem>
              <MenuItem value="81-100">81-100%</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Date Range</InputLabel>
            <Select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters({ ...filters, dateRange: e.target.value as string })
              }
              label="Date Range"
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button onClick={applyFilters} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Result Details</DialogTitle>
        <DialogContent>
          {selectedResult && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Student Information
                </Typography>
                <Typography>Name: {selectedResult.username}</Typography>
                <Typography>College: {selectedResult.college}</Typography>
                <Typography>
                  Score: {selectedResult.score}/{selectedResult.totalQuestions}
                </Typography>
                <Typography>
                  Time Taken: {formatTime(selectedResult.timeTaken)}
                </Typography>
                <Typography>
                  Date: {new Date(selectedResult.submittedAt).toLocaleString()}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Question Details
              </Typography>
              {selectedResult.answers.map((answer, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography gutterBottom>
                    Question {index + 1}: {answer.question}
                  </Typography>
                  <Typography color={answer.isCorrect ? 'success.main' : 'error.main'}>
                    Selected Answer: Option {answer.selectedAnswer + 1}
                    {!answer.isCorrect && 
                      ` (Correct: Option ${answer.correctAnswer + 1})`}
                  </Typography>
                </Paper>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ResultsViewer; 