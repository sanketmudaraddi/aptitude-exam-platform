import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from '../../utils/axios';

interface Question {
  id?: number;
  question: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
  points: number;
}

const initialQuestion: Question = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  category: 'Numerical',
  difficulty: 'Medium',
  points: 1
};

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [newQuestion, setNewQuestion] = useState<Question>(initialQuestion);

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('/admin/questions');
      // Transform the response data to ensure options array exists
      const transformedQuestions = (Array.isArray(response.data) ? response.data : []).map(q => ({
        ...q,
        // Create options array from individual option fields
        options: [q.option1 || '', q.option2 || '', q.option3 || '', q.option4 || '']
      }));
      setQuestions(transformedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      showSnackbar('Failed to fetch questions', 'error');
      setQuestions([]); // Set empty array on error
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (question?: Question) => {
    if (question) {
      // When editing, create options array from individual option fields
      const options = [
        question.option1 || '',
        question.option2 || '',
        question.option3 || '',
        question.option4 || ''
      ];
      setEditingQuestion({
        ...question,
        options: options // Add options array to editingQuestion
      });
      setNewQuestion({
        ...question,
        options: options
      });
    } else {
      setEditingQuestion(null);
      setNewQuestion(initialQuestion);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuestion(null);
    setNewQuestion(initialQuestion);
  };

  const handleSaveQuestion = async () => {
    try {
      setLoading(true);
      // Validate required fields
      if (!newQuestion.question || !newQuestion.category || !newQuestion.difficulty) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      // Validate options
      if (newQuestion.options.some(opt => !opt.trim())) {
        showSnackbar('Please fill in all options', 'error');
        return;
      }

      // Format the question data to match the server expectations
      const questionData = {
        question: newQuestion.question.trim(),
        option1: newQuestion.options[0].trim(),
        option2: newQuestion.options[1].trim(),
        option3: newQuestion.options[2].trim(),
        option4: newQuestion.options[3].trim(),
        correctAnswer: Number(newQuestion.correctAnswer),
        category: newQuestion.category,
        difficulty: newQuestion.difficulty.toLowerCase(),
        points: Number(newQuestion.points) || 1
      };

      console.log('Sending question data:', questionData); // Debug log

      let response;
      if (editingQuestion?.id) {
        // Update existing question
        response = await axios.patch(`/admin/questions/${editingQuestion.id}`, questionData);
      } else {
        // Add new question
        response = await axios.post('/admin/questions', questionData);
      }

      console.log('Server response:', response.data); // Debug log

      if (response.data.success) {
        showSnackbar(response.data.message, 'success');
        await fetchQuestions(); // Refresh the questions list
        handleCloseDialog();
      } else {
        throw new Error(response.data.message || 'Failed to save question');
      }
    } catch (error: any) {
      console.error('Error saving question:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save question';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await axios.delete(`/admin/questions/${id}`);
      showSnackbar('Question deleted successfully', 'success');
      await fetchQuestions(); // Refresh the questions list
    } catch (error) {
      console.error('Error deleting question:', error);
      showSnackbar('Failed to delete question', 'error');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Question Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Question
          </Button>
        </Box>

        <Grid container spacing={3}>
          {questions && questions.length > 0 ? (
            questions.map((question) => (
              <Grid item xs={12} key={question.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {question.question}
                        </Typography>
                        <Grid container spacing={1}>
                          {(question.options || []).map((option, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                              <Typography
                                color={index === question.correctAnswer ? 'success.main' : 'text.primary'}
                              >
                                {index + 1}. {option}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Category: {question.category} | Difficulty: {question.difficulty} | Points: {question.points}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <IconButton onClick={() => handleOpenDialog(question)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => question.id && handleDeleteQuestion(question.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No questions available. Click "Add Question" to create one.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Question Text"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 3 }}
              />
              
              <Typography variant="h6" gutterBottom>
                Options
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {newQuestion.options.map((option, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Correct Answer</InputLabel>
                    <Select
                      value={newQuestion.correctAnswer}
                      label="Correct Answer"
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: Number(e.target.value) })}
                    >
                      {newQuestion.options.map((_, index) => (
                        <MenuItem key={index} value={index}>
                          Option {index + 1}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newQuestion.category}
                      label="Category"
                      onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    >
                      <MenuItem value="Numerical">Numerical</MenuItem>
                      <MenuItem value="Verbal">Verbal</MenuItem>
                      <MenuItem value="Logical">Logical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={newQuestion.difficulty}
                      label="Difficulty"
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Points"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSaveQuestion} 
              variant="contained"
              disabled={loading}
            >
              {editingQuestion ? 'Update' : 'Add'} Question
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default QuestionManagement; 