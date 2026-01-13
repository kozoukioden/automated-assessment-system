import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

/**
 * Submission Results Page
 * View submission results and feedback
 */
const SubmissionResults = () => {
  return (
    <StudentLayout title="Submission Results">
      <Box>
        <Typography variant="h4" gutterBottom>
          Submission Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your submission results and feedback from evaluations.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default SubmissionResults;
