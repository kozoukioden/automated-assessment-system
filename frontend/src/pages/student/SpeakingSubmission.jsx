import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

const SpeakingSubmission = () => {
  return (
    <StudentLayout title="Speaking Submission">
      <Box>
        <Typography variant="h4" gutterBottom>
          Speaking Activity Submission
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Record and submit your speaking activity.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default SpeakingSubmission;
