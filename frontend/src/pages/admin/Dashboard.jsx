import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * Admin Dashboard Page
 * Overview of system metrics and activity
 */
const Dashboard = () => {
  return (
    <AdminLayout title="Admin Dashboard">
      <Box>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the admin dashboard. Monitor system activity, user metrics, and overall performance.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default Dashboard;
