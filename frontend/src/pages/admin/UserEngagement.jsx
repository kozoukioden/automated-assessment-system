import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * User Engagement Page
 * User engagement metrics and analytics
 */
const UserEngagement = () => {
  return (
    <AdminLayout title="User Engagement">
      <Box>
        <Typography variant="h4" gutterBottom>
          User Engagement
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor user engagement metrics including activity rates, session duration, and participation.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default UserEngagement;
