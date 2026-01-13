import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * Teacher Performance Page
 * Teacher performance metrics
 */
const TeacherPerformance = () => {
  return (
    <AdminLayout title="Teacher Performance">
      <Box>
        <Typography variant="h4" gutterBottom>
          Teacher Performance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analyze teacher performance including grading speed, student outcomes, and activity creation.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default TeacherPerformance;
