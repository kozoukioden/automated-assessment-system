import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Rubric Management Page
 * Manage evaluation rubrics
 */
const RubricManagement = () => {
  return (
    <TeacherLayout title="Rubric Management">
      <Box>
        <Typography variant="h4" gutterBottom>
          Rubric Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, edit, and manage your evaluation rubrics.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default RubricManagement;
