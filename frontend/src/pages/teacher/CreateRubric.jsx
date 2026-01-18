import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  IconButton,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TeacherLayout from '../../components/common/Layout/TeacherLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Validation schema - matches backend Rubric model
const rubricSchema = yup.object({
  name: yup.string().required('Rubric name is required').min(3, 'Name must be at least 3 characters'),
  description: yup.string(),
  activityType: yup.string().oneOf(['speaking', 'writing', 'quiz'], 'Invalid rubric type').required('Type is required'),
  criteria: yup.array()
    .of(
      yup.object({
        name: yup.string().required('Criterion name is required'),
        description: yup.string().required('Criterion description is required'),
        weight: yup.number()
          .required('Weight is required')
          .min(0.01, 'Weight must be at least 0.01')
          .max(1, 'Weight cannot exceed 1'),
      })
    )
    .min(1, 'At least one criterion is required'),
});

/**
 * Create/Edit Rubric Page
 * Create new evaluation rubric with dynamic criteria
 */
const CreateRubric = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(rubricSchema),
    defaultValues: {
      name: '',
      description: '',
      activityType: 'speaking',
      criteria: [
        {
          name: '',
          description: '',
          weight: 1.0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  });

  const watchCriteria = watch('criteria');

  useEffect(() => {
    if (isEditMode) {
      fetchRubric();
    }
  }, [id]);

  const fetchRubric = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/rubrics/${id}`);
      const rubric = response.data?.data?.rubric || response.data?.rubric;

      if (rubric) {
        setValue('name', rubric.name);
        setValue('description', rubric.description || '');
        setValue('activityType', rubric.activityType);
        setValue('criteria', rubric.criteria || []);
      }
    } catch (err) {
      console.error('Error fetching rubric:', err);
      setError(err.response?.data?.message || 'Failed to load rubric');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Validate weights sum to 1.0
      const totalWeight = data.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        toast.error('Criteria weights must sum to 1.0 (100%)');
        setSubmitting(false);
        return;
      }

      if (isEditMode) {
        await api.put(`/rubrics/${id}`, data);
        toast.success('Rubric updated successfully');
      } else {
        await api.post('/rubrics', data);
        toast.success('Rubric created successfully');
      }

      navigate('/teacher/rubrics');
    } catch (err) {
      console.error('Error saving rubric:', err);
      toast.error(err.response?.data?.message || 'Failed to save rubric');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalWeight = () => {
    if (!watchCriteria) return 0;
    return watchCriteria.reduce((sum, c) => sum + Number(c?.weight || 0), 0);
  };

  const totalWeight = calculateTotalWeight();
  const isWeightValid = Math.abs(totalWeight - 1.0) <= 0.01;

  // Auto-distribute weights equally
  const distributeWeightsEqually = () => {
    const count = fields.length;
    if (count === 0) return;
    const equalWeight = Number((1 / count).toFixed(2));
    const remainder = Number((1 - equalWeight * count).toFixed(2));

    fields.forEach((_, index) => {
      // Add remainder to last item to ensure sum is exactly 1.0
      const weight = index === count - 1 ? equalWeight + remainder : equalWeight;
      setValue(`criteria.${index}.weight`, Number(weight.toFixed(2)));
    });
  };

  if (loading) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Rubric' : 'Create Rubric'}>
        <LoadingSpinner message="Loading rubric..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Rubric' : 'Create Rubric'}>
        <ErrorMessage
          title="Error Loading Rubric"
          message={error}
          onRetry={fetchRubric}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title={isEditMode ? 'Edit Rubric' : 'Create Rubric'}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/rubrics')}
          sx={{ mb: 2 }}
        >
          Back to Rubrics
        </Button>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Rubric' : 'Create New Rubric'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode
            ? 'Update rubric details and grading criteria.'
            : 'Create a new evaluation rubric for assessing student work.'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CustomCard title="Basic Information">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Rubric Name"
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g., Speaking Proficiency Rubric"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="activityType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Activity Type"
                    fullWidth
                    required
                    error={!!errors.activityType}
                    helperText={errors.activityType?.message || 'Select the type of activity this rubric is for'}
                  >
                    <MenuItem value="speaking">Speaking</MenuItem>
                    <MenuItem value="writing">Writing</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description (Optional)"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    placeholder="Describe the purpose and scope of this rubric..."
                  />
                )}
              />
            </Grid>
          </Grid>
        </CustomCard>

        <CustomCard title="Grading Criteria" sx={{ mt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Define the criteria that will be used to evaluate student submissions. Each criterion should
              have a clear name, description, and weight. Weights must sum to 1.0 (100%).
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6" color={isWeightValid ? 'success.main' : 'error.main'}>
                Total Weight: <strong>{(totalWeight * 100).toFixed(0)}%</strong>
                {!isWeightValid && ' (Must equal 100%)'}
              </Typography>
              <Button size="small" onClick={distributeWeightsEqually}>
                Distribute Equally
              </Button>
            </Box>
          </Box>

          {!isWeightValid && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Criteria weights must sum to 100%. Current total: {(totalWeight * 100).toFixed(0)}%
            </Alert>
          )}

          <Divider sx={{ mb: 3 }} />

          {fields.map((field, index) => (
            <Paper
              key={field.id}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Criterion {index + 1}
                </Typography>
                <IconButton
                  color="error"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Controller
                    name={`criteria.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Criterion Name"
                        fullWidth
                        required
                        error={!!errors.criteria?.[index]?.name}
                        helperText={errors.criteria?.[index]?.name?.message}
                        placeholder="e.g., Pronunciation, Grammar, Content Organization"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name={`criteria.${index}.weight`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Weight (0-1)"
                        type="number"
                        fullWidth
                        required
                        error={!!errors.criteria?.[index]?.weight}
                        helperText={errors.criteria?.[index]?.weight?.message || `${((Number(field.value) || 0) * 100).toFixed(0)}%`}
                        inputProps={{ min: 0.01, max: 1, step: 0.01 }}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name={`criteria.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        required
                        error={!!errors.criteria?.[index]?.description}
                        helperText={
                          errors.criteria?.[index]?.description?.message ||
                          'Describe what this criterion evaluates and how it should be assessed'
                        }
                        placeholder="Describe what aspects should be evaluated under this criterion..."
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              append({
                name: '',
                description: '',
                weight: 0.1,
              })
            }
            variant="outlined"
            fullWidth
          >
            Add Criterion
          </Button>

          {errors.criteria && typeof errors.criteria === 'object' && !Array.isArray(errors.criteria) && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {errors.criteria.message}
            </Typography>
          )}
        </CustomCard>

        {/* Form Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/teacher/rubrics')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={submitting || !isWeightValid}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Rubric' : 'Create Rubric'}
          </Button>
        </Box>
      </form>
    </TeacherLayout>
  );
};

export default CreateRubric;
