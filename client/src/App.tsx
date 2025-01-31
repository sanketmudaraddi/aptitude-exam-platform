import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import VerifyEmail from './components/auth/VerifyEmail';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import GenerateQuestion from './components/admin/GenerateQuestion';
// Admin Components
import AdminRoutes from './routes/AdminRoutes';
import Layout from './components/common/Layout';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import TestPage from './components/student/TestPage';
import TestResult from './components/student/TestResult';
import ExamLogin from './components/student/ExamLogin';
import ExamPage from './components/student/ExamPage';

// Layout and Common Components
import PrivateRoute from './components/common/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <PrivateRoute role="admin">
                <Layout>
                  <AdminRoutes />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/admin/create-question" element={<GenerateQuestion />} />

            {/* Student Routes */}
            <Route path="/student" element={
              <PrivateRoute role="student">
                <Layout>
                  <StudentDashboard />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/test/:testId" element={
              <PrivateRoute role="student">
                <TestPage />
              </PrivateRoute>
            } />
            <Route path="/exam/:examId" element={<ExamLogin />} />
            <Route path="/exam/:examId/questions" element={<ExamPage />} />
            <Route path="/student/result" element={
              <PrivateRoute role="student">
                <Layout>
                  <TestResult />
                </Layout>
              </PrivateRoute>
            } />

            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 