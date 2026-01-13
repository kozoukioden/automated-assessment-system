import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

/**
 * My Progress Page
 * View progress charts and reports
 */
const MyProgress = () => {
  return (
    <StudentLayout title="My Progress">
      <Box>
        <Typography variant="h4" gutterBottom>
          My Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your learning progress with charts and detailed reports.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default MyProgress;
