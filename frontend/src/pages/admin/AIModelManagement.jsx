import { Typography, Box } from '@mui/material';
import AdminLayout from '../../components/common/Layout/AdminLayout';

/**
 * AI Model Management Page
 * Manage AI models and configurations
 */
const AIModelManagement = () => {
  return (
    <AdminLayout title="AI Model Management">
      <Box>
        <Typography variant="h4" gutterBottom>
          AI Model Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure and manage AI models used for assessment and evaluation.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default AIModelManagement;
