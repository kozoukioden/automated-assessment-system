import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import DataTable from '../../components/common/UI/DataTable';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';

/**
 * Student List Page
 * View all students and their performance overview
 */
const StudentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Student Dialog
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/teacher/students');
      setStudents(response.data?.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      setAddError('Please fill in all fields');
      return;
    }

    if (newStudent.password.length < 6) {
      setAddError('Password must be at least 6 characters');
      return;
    }

    setIsAdding(true);
    setAddError('');

    try {
      await api.post('/teacher/students', newStudent);
      setAddSuccess('Student added successfully!');
      setNewStudent({ name: '', email: '', password: '' });
      fetchStudents(); // Refresh the list
      setTimeout(() => {
        setOpenAddDialog(false);
        setAddSuccess('');
      }, 1500);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add student');
    } finally {
      setIsAdding(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const getPerformanceColor = (avgScore) => {
    if (avgScore >= 90) return 'success';
    if (avgScore >= 75) return 'info';
    if (avgScore >= 60) return 'warning';
    return 'error';
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = [
    {
      id: 'avatar',
      label: '',
      align: 'center',
      format: (value, row) => (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 40,
            height: 40,
          }}
        >
          {getInitials(row.name || row.email)}
        </Avatar>
      ),
    },
    {
      id: 'name',
      label: 'Student Name',
      minWidth: 200,
      format: (value) => value || 'Unknown',
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
      format: (value) => value || 'N/A',
    },
    {
      id: 'studentId',
      label: 'Student ID',
      format: (value) => value || 'N/A',
    },
    {
      id: 'submissionCount',
      label: 'Submissions',
      align: 'center',
      format: (value) => value || 0,
    },
    {
      id: 'avgScore',
      label: 'Avg Score',
      align: 'center',
      format: (value) => (
        <Chip
          label={value ? `${value.toFixed(1)}%` : 'N/A'}
          size="small"
          color={value ? getPerformanceColor(value) : 'default'}
        />
      ),
    },
    {
      id: 'lastSubmission',
      label: 'Last Activity',
      format: (value) => {
        if (!value) return 'No submissions';
        const date = new Date(value);
        const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        if (daysAgo === 0) return 'Today';
        if (daysAgo === 1) return 'Yesterday';
        return `${daysAgo} days ago`;
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      format: (value, row) => (
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teacher/students/${row._id}`);
          }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  if (loading) {
    return (
      <TeacherLayout title="Students">
        <LoadingSpinner message="Loading students..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title="Students">
        <ErrorMessage
          title="Error Loading Students"
          message={error}
          onRetry={fetchStudents}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title="Students">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Student List
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View student performance and track their progress.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Student
          </Button>
        </Box>

        {/* Search */}
        <CustomCard>
          <TextField
            placeholder="Search students by name, email, or ID..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CustomCard>
      </Box>

      {/* Students Table */}
      <CustomCard title={`Students (${filteredStudents.length})`}>
        <DataTable
          columns={columns}
          rows={filteredStudents}
          emptyMessage="No students found"
          emptyIcon={PeopleIcon}
          onRowClick={(row) => navigate(`/teacher/students/${row._id}`)}
        />
      </CustomCard>

      {/* Add Student Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          {addError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addError}
            </Alert>
          )}
          {addSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {addSuccess}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newStudent.password}
            onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
            helperText="Minimum 6 characters"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleAddStudent} variant="contained" disabled={isAdding}>
            {isAdding ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>
    </TeacherLayout>
  );
};

export default StudentList;
