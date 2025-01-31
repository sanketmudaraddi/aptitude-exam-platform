import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  PeopleAlt as PeopleIcon,
  QuestionAnswer as QuestionIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardItems = [
    {
      title: 'Manage Questions',
      description: 'Create, edit, and delete test questions',
      icon: <QuestionIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/admin/questions'),
      color: 'primary.main',
    },
    {
      title: 'Schedule Exam',
      description: 'Create and manage exam schedules',
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/admin/schedule'),
      color: '#2e7d32', // green
    },
    {
      title: 'View Results',
      description: 'View and analyze student test results',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/admin/results'),
      color: '#ed6c02', // orange
    },
    {
      title: 'Manage Students',
      description: 'View and manage student accounts',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/admin/students'),
      color: '#0288d1', // blue
    },

    {
      title: 'Create Question',
      description: 'Create a new question',
      icon: <QuestionIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/admin/create-question'),
      color: '#0288d1', // blue
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Admin Dashboard
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>

        <Grid container spacing={3}>
          {dashboardItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2, color: item.color }}>{item.icon}</Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {item.title}
                  </Typography>
                  <Typography color="textSecondary">{item.description}</Typography>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={item.action}
                    sx={{ mt: 'auto' }}
                  >
                    Access
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  0
                </Typography>
                <Typography variant="body1">Total Students</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                  0
                </Typography>
                <Typography variant="body1">Active Tests</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#ed6c02' }}>
                  0
                </Typography>
                <Typography variant="body1">Tests Completed</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#0288d1' }}>
                  0
                </Typography>
                <Typography variant="body1">Questions Created</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard; 