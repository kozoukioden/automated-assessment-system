import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Create Activity Page
 * Create new teaching activities
 */
const CreateActivity = () => {
  return (
    <TeacherLayout title="Create Activity">
      <Box>
        <Typography variant="h4" gutterBottom>
          Create New Activity
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new activity for your students.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default CreateActivity;
