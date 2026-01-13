import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

const WritingSubmission = () => {
  return (
    <StudentLayout title="Writing Submission">
      <Box>
        <Typography variant="h4" gutterBottom>
          Writing Activity Submission
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Write and submit your writing activity.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default WritingSubmission;
