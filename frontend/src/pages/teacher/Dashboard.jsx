import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Teacher Dashboard Page
 * Overview of teacher's activities and pending reviews
 */
const Dashboard = () => {
  return (
    <TeacherLayout title="Teacher Dashboard">
      <Box>
        <Typography variant="h4" gutterBottom>
          Teacher Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your dashboard. View your activities, pending reviews, and student performance.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default Dashboard;
