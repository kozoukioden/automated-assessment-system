import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Create Rubric Page
 * Create new evaluation rubric
 */
const CreateRubric = () => {
  return (
    <TeacherLayout title="Create Rubric">
      <Box>
        <Typography variant="h4" gutterBottom>
          Create New Rubric
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new evaluation rubric for assessing student work.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default CreateRubric;
