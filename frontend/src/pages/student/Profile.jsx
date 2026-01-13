import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

/**
 * Student Profile Page
 * Manage student profile information
 */
const Profile = () => {
  return (
    <StudentLayout title="Profile">
      <Box>
        <Typography variant="h4" gutterBottom>
          Student Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and edit your profile information.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default Profile;
