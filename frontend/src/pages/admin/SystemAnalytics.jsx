import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * System Analytics Page
 * System-wide analytics and metrics
 */
const SystemAnalytics = () => {
  return (
    <AdminLayout title="System Analytics">
      <Box>
        <Typography variant="h4" gutterBottom>
          System Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View comprehensive system analytics including usage patterns, performance metrics, and trends.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default SystemAnalytics;
