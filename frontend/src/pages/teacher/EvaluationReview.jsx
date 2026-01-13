import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Evaluation Review Page
 * Review and grade student evaluations
 */
const EvaluationReview = () => {
  return (
    <TeacherLayout title="Evaluation Review">
      <Box>
        <Typography variant="h4" gutterBottom>
          Evaluation Review
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review AI-generated evaluations and provide final grades and feedback.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default EvaluationReview;
