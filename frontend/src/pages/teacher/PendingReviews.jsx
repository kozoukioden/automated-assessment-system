import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Pending Reviews Page
 * List of pending student evaluations
 */
const PendingReviews = () => {
  return (
    <TeacherLayout title="Pending Reviews">
      <Box>
        <Typography variant="h4" gutterBottom>
          Pending Reviews
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage pending student submissions awaiting your review.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default PendingReviews;
