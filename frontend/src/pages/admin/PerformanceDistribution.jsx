import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * Performance Distribution Page
 * Performance distribution analytics
 */
const PerformanceDistribution = () => {
  return (
    <AdminLayout title="Performance Distribution">
      <Box>
        <Typography variant="h4" gutterBottom>
          Performance Distribution
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View performance distribution across students, activities, and time periods.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default PerformanceDistribution;
