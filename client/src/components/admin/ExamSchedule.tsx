import React, { useState } from 'react';
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
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

interface ExamSchedule {
  id: number;
  title: string;
  description: string;
  startTime: Date;
  duration: number;
  categories: string[];
  difficulty: string;
  status: 'upcoming' | 'active' | 'completed';
  link: string;
}

const ExamSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<ExamSchedule>>({
    title: '',
    description: '',
    startTime: new Date(),
    duration: 60,
    categories: [],
    difficulty: '',
    status: 'upcoming',
  });

  const handleOpenDialog = (schedule?: ExamSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setNewSchedule(schedule);
    } else {
      setEditingSchedule(null);
      setNewSchedule({
        title: '',
        description: '',
        startTime: new Date(),
        duration: 60,
        categories: [],
        difficulty: '',
        status: 'upcoming',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSchedule(null);
  };

  const handleSaveSchedule = () => {
    const examLink = generateExamLink();
    if (editingSchedule) {
      setSchedules(schedules.map(s =>
        s.id === editingSchedule.id
          ? { ...newSchedule, id: editingSchedule.id, link: examLink } as ExamSchedule
          : s
      ));
    } else {
      setSchedules([
        ...schedules,
        { ...newSchedule, id: Date.now(), link: examLink } as ExamSchedule,
      ]);
    }
    handleCloseDialog();
  };

  const handleDeleteSchedule = (id: number) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const generateExamLink = () => {
    // Generate a unique exam link
    const baseUrl = window.location.origin;
    const uniqueId = Math.random().toString(36).substring(2, 15);
    return `${baseUrl}/exam/${uniqueId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'active':
        return 'success';
      case 'completed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Exam Schedule
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Schedule New Exam
          </Button>
        </Box>

        <Grid container spacing={3}>
          {schedules.map((schedule) => (
            <Grid item xs={12} key={schedule.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {schedule.title}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {schedule.description}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item>
                          <Typography variant="body2">
                            Start: {new Date(schedule.startTime).toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Typography variant="body2">
                            Duration: {schedule.duration} minutes
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={schedule.status}
                          color={getStatusColor(schedule.status)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          label={schedule.difficulty}
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {schedule.categories.map((category, index) => (
                          <Chip
                            key={index}
                            label={category}
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        ))}
                      </Box>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                          Exam Link: {schedule.link}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(schedule.link)}
                          color="primary"
                        >
                          <CopyIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleOpenDialog(schedule)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteSchedule(schedule.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingSchedule ? 'Edit Exam Schedule' : 'Schedule New Exam'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Exam Title"
                value={newSchedule.title}
                onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Description"
                value={newSchedule.description}
                onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 3 }}
              />

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Start Time"
                      value={newSchedule.startTime}
                      onChange={(newValue: Date | null) => {
                        setNewSchedule({ ...newSchedule, startTime: newValue || new Date() });
                      }}
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duration (minutes)"
                    type="number"
                    value={newSchedule.duration}
                    onChange={(e) => setNewSchedule({ ...newSchedule, duration: Number(e.target.value) })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Categories</InputLabel>
                    <Select
                      multiple
                      value={newSchedule.categories}
                      label="Categories"
                      onChange={(e) => setNewSchedule({
                        ...newSchedule,
                        categories: typeof e.target.value === 'string'
                          ? [e.target.value]
                          : e.target.value,
                      })}
                    >
                      <MenuItem value="Numerical">Numerical</MenuItem>
                      <MenuItem value="Verbal">Verbal</MenuItem>
                      <MenuItem value="Logical">Logical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={newSchedule.difficulty}
                      label="Difficulty"
                      onChange={(e) => setNewSchedule({ ...newSchedule, difficulty: e.target.value })}
                    >
                      <MenuItem value="Easy">Easy</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveSchedule} variant="contained">
              {editingSchedule ? 'Update' : 'Schedule'} Exam
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ExamSchedule; 