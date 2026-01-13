import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Teacher Analytics Page
 * Analytics and insights for teacher
 */
const TeacherAnalytics = () => {
  return (
    <TeacherLayout title="Analytics">
      <Box>
        <Typography variant="h4" gutterBottom>
          Teacher Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View analytics and insights about your teaching activities and student performance.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default TeacherAnalytics;
