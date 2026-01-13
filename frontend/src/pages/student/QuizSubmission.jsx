import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

/**
 * Quiz Submission Page
 * Page for submitting quiz activity responses
 */
const QuizSubmission = () => {
  return (
    <StudentLayout title="Quiz Submission">
      <Box>
        <Typography variant="h4" gutterBottom>
          Quiz Submission
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Submit your quiz activity responses here.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default QuizSubmission;
