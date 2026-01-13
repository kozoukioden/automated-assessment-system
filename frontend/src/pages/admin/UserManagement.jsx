import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * User Management Page
 * Manage system users
 */
const UserManagement = () => {
  return (
    <AdminLayout title="User Management">
      <Box>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users, assign roles, and control access permissions.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default UserManagement;
