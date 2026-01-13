import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * Submission Analytics Page
 * Analytics for student submissions
 */
const SubmissionAnalytics = () => {
  return (
    <AdminLayout title="Submission Analytics">
      <Box>
        <Typography variant="h4" gutterBottom>
          Submission Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analyze submission patterns, trends, and statistics across all activities.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default SubmissionAnalytics;
