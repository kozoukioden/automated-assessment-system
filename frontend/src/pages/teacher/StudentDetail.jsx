import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Student Detail Page
 * Individual student details and performance
 */
const StudentDetail = () => {
  return (
    <TeacherLayout title="Student Details">
      <Box>
        <Typography variant="h4" gutterBottom>
          Student Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed information about a specific student's performance and submissions.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default StudentDetail;
