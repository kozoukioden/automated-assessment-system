import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * Audit Logs Page
 * View system audit logs
 */
const AuditLogs = () => {
  return (
    <AdminLayout title="Audit Logs">
      <Box>
        <Typography variant="h4" gutterBottom>
          Audit Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed audit logs of system activities and user actions.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default AuditLogs;
