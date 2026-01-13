import { Typography, Box } from '@mui/material';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';

/**
 * Activity Management Page
 * Manage and organize teaching activities
 */
const ActivityManagement = () => {
  return (
    <TeacherLayout title="Activity Management">
      <Box>
        <Typography variant="h4" gutterBottom>
          Activity Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, edit, and manage all your teaching activities.
        </Typography>
      </Box>
    </TeacherLayout>
  );
};

export default ActivityManagement;
