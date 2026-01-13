import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

/**
 * Student Dashboard Page
 * Overview of student's activities and progress
 */
const Dashboard = () => {
  return (
    <StudentLayout title="Student Dashboard">
      <Box>
        <Typography variant="h4" gutterBottom>
          Student Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your dashboard. This page will display your activities, progress, and recent submissions.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default Dashboard;
