import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Student List Page
 * List of all students
 */
const StudentList = () => {
  return (
    <TeacherLayout title="Students">
      <Box>
        <Typography variant="h4" gutterBottom>
          Student List
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your students.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default StudentList;
