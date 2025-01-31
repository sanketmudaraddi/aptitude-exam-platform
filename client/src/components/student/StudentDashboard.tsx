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
  Edit as TestIcon,
  History as HistoryIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const dashboardItems = [
    {
      title: 'Take Test',
      description: 'Start a new aptitude test',
      icon: <TestIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/student/test'),
    },
    {
      title: 'View Results',
      description: 'Check your test history and scores',
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/student/results'),
    },
    {
      title: 'Profile',
      description: 'View and update your profile',
      icon: <ProfileIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/student/profile'),
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.username}!
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Email:</strong> {user?.email}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>College:</strong> {user?.college || 'Not specified'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Tests Taken:</strong> 0
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {dashboardItems.map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
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
                  <Box sx={{ mb: 2, color: 'primary.main' }}>{item.icon}</Box>
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
            Recent Activity
          </Typography>
          <Typography variant="body1" color="textSecondary">
            No recent activity to display.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentDashboard; 