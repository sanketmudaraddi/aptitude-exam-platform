import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import QuestionManagement from '../components/admin/QuestionManagement';
import ExamSchedule from '../components/admin/ExamSchedule';
import ResultsView from '../components/admin/ResultsView';
import { useAuth } from '../contexts/AuthContext';

const AdminRoutes: React.FC = () => {
  const { user } = useAuth();

  // Protect admin routes
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="questions" element={<QuestionManagement />} />
      <Route path="schedule" element={<ExamSchedule />} />
      <Route path="results" element={<ResultsView />} />
      {/* Redirect any unmatched routes to admin dashboard */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes; 