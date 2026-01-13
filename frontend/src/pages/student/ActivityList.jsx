import { Typography, Box } from '@mui/material';
import StudentLayout from '../../components/common/Layout/StudentLayout';

const ActivityList = () => {
  return (
    <StudentLayout title="Activities">
      <Box>
        <Typography variant="h4" gutterBottom>
          Activities
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and select activities to complete.
        </Typography>
      </Box>
    </StudentLayout>
  );
};

export default ActivityList;
