import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * Analytics Export Page
 * Export analytics data
 */
const AnalyticsExport = () => {
  return (
    <AdminLayout title="Analytics Export">
      <Box>
        <Typography variant="h4" gutterBottom>
          Analytics Export
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Export analytics data and reports in various formats.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default AnalyticsExport;
