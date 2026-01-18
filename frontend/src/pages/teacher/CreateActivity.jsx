import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Grid,
  IconButton,
  Divider,
  Paper,
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

// Validation schema - matches backend Activity model
const activitySchema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required'),
  activityType: yup.string().oneOf(['speaking', 'writing', 'quiz'], 'Invalid activity type').required('Type is required'),
  prompt: yup.string().when('activityType', {
    is: (val) => val === 'speaking' || val === 'writing',
    then: () => yup.string().required('Prompt is required for speaking/writing activities'),
    otherwise: () => yup.string().nullable(),
  }),
  difficulty: yup.string().oneOf(['beginner', 'intermediate', 'advanced']).required('Difficulty is required'),
  expectedDuration: yup.number().positive('Duration must be positive').nullable(),
  rubricId: yup.string().nullable(),
  isActive: yup.boolean(),
  questions: yup.array().of(
    yup.object({
      questionText: yup.string().required('Question is required'),
      questionType: yup.string().oneOf(['multiple-choice', 'true-false', 'short-answer']).required('Question type is required'),
      options: yup.array().of(yup.string()),
      correctAnswer: yup.string().required('Correct answer is required'),
      points: yup.number().positive('Points must be positive').required('Points are required'),
    })
  ),
}).test('type-specific-fields', 'Invalid fields for activity type', function (value) {
  const { activityType, prompt, questions } = value;

  if ((activityType === 'speaking' || activityType === 'writing') && !prompt) {
    return this.createError({
      path: 'prompt',
      message: `Prompt is required for ${activityType} activities`,
    });
  }

  if (activityType === 'quiz' && (!questions || questions.length === 0)) {
    return this.createError({
      path: 'questions',
      message: 'At least one question is required for quiz activities',
    });
  }

  return true;
});

/**
 * Create/Edit Activity Page
 * Create new teaching activities with dynamic fields based on type
 */
const CreateActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [rubrics, setRubrics] = useState([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(activitySchema),
    defaultValues: {
      title: '',
      description: '',
      activityType: 'speaking',
      prompt: '',
      difficulty: 'intermediate',
      expectedDuration: null,
      rubricId: '',
      isActive: true,
      questions: [],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
  });

  const activityType = watch('activityType');

  useEffect(() => {
    fetchRubrics();
    if (isEditMode) {
      fetchActivity();
    }
  }, [id]);

  const fetchRubrics = async () => {
    try {
      const response = await api.get('/rubrics/teacher/me');
      setRubrics(response.data?.data?.rubrics || response.data?.rubrics || []);
    } catch (err) {
      console.error('Error fetching rubrics:', err);
    }
  };

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/activities/${id}`);
      const activity = response.data?.data?.activity || response.data?.activity;

      if (activity) {
        setValue('title', activity.title || '');
        setValue('description', activity.description || '');
        setValue('activityType', activity.activityType || 'speaking');
        setValue('prompt', activity.prompt || '');
        setValue('difficulty', activity.difficulty || 'intermediate');
        setValue('expectedDuration', activity.expectedDuration || null);
        setValue('rubricId', activity.rubricId || '');
        setValue('isActive', activity.isActive !== false);
        setValue('questions', activity.questions || []);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError(err.response?.data?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Clean up data based on activity type
      const cleanedData = { ...data };

      // Remove empty rubricId
      if (!cleanedData.rubricId) {
        delete cleanedData.rubricId;
      }

      // Remove null expectedDuration
      if (!cleanedData.expectedDuration) {
        delete cleanedData.expectedDuration;
      }

      if (data.activityType === 'quiz') {
        delete cleanedData.prompt;
        // Ensure questions have proper structure
        cleanedData.questions = cleanedData.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          points: q.points || 1,
        }));
      } else {
        delete cleanedData.questions;
      }

      if (isEditMode) {
        await api.put(`/activities/${id}`, cleanedData);
        toast.success('Activity updated successfully');
      } else {
        await api.post('/activities', cleanedData);
        toast.success('Activity created successfully');
      }

      navigate('/teacher/activities');
    } catch (err) {
      console.error('Error saving activity:', err);
      toast.error(err.response?.data?.message || 'Failed to save activity');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Activity' : 'Create Activity'}>
        <LoadingSpinner message="Loading activity..." />
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout title={isEditMode ? 'Edit Activity' : 'Create Activity'}>
        <ErrorMessage
          title="Error Loading Activity"
          message={error}
          onRetry={fetchActivity}
        />
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout title={isEditMode ? 'Edit Activity' : 'Create Activity'}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/activities')}
          sx={{ mb: 2 }}
        >
          Back to Activities
        </Button>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Activity' : 'Create New Activity'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isEditMode ? 'Update activity details and settings.' : 'Create a new activity for your students.'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CustomCard title="Basic Information">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Activity Title"
                    fullWidth
                    required
                    error={!!errors.title}
                    helperText={errors.title?.message}
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
                    helperText={errors.activityType?.message}
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
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    required
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Difficulty Level"
                    fullWidth
                    required
                    error={!!errors.difficulty}
                    helperText={errors.difficulty?.message}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="expectedDuration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Expected Duration (minutes)"
                    type="number"
                    fullWidth
                    error={!!errors.expectedDuration}
                    helperText={errors.expectedDuration?.message}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status"
                    fullWidth
                    value={field.value ? 'active' : 'inactive'}
                    onChange={(e) => field.onChange(e.target.value === 'active')}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="rubricId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Rubric (Optional)"
                    fullWidth
                    error={!!errors.rubricId}
                    helperText={errors.rubricId?.message || 'Select a rubric for grading'}
                  >
                    <MenuItem value="">No Rubric</MenuItem>
                    {rubrics.map((rubric) => (
                      <MenuItem key={rubric._id} value={rubric._id}>
                        {rubric.name} ({rubric.type})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </CustomCard>

        {/* Prompt for Speaking/Writing Activities */}
        {(activityType === 'speaking' || activityType === 'writing') && (
          <CustomCard title="Activity Prompt" sx={{ mt: 3 }}>
            <Controller
              name="prompt"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Prompt / Instructions for Student"
                  fullWidth
                  multiline
                  rows={4}
                  required
                  error={!!errors.prompt}
                  helperText={errors.prompt?.message || 'Enter the prompt or instructions that students will respond to'}
                  placeholder={
                    activityType === 'speaking'
                      ? 'e.g., Describe your favorite holiday destination and explain why you would recommend it to others.'
                      : 'e.g., Write a persuasive essay about the importance of environmental conservation.'
                  }
                />
              )}
            />
          </CustomCard>
        )}

        {/* Questions for Quiz Activities */}
        {activityType === 'quiz' && (
          <CustomCard title="Questions" sx={{ mt: 3 }}>
            <Box>
              {questionFields.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No questions added yet. Click "Add Question" to create your first question.
                </Typography>
              )}
              {questionFields.map((field, index) => (
                <Paper key={field.id} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Question {index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => removeQuestion(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Controller
                        name={`questions.${index}.questionText`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Question Text"
                            fullWidth
                            multiline
                            rows={2}
                            required
                            error={!!errors.questions?.[index]?.questionText}
                            helperText={errors.questions?.[index]?.questionText?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`questions.${index}.questionType`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            label="Question Type"
                            fullWidth
                            required
                          >
                            <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                            <MenuItem value="true-false">True/False</MenuItem>
                            <MenuItem value="short-answer">Short Answer</MenuItem>
                          </TextField>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`questions.${index}.points`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Points"
                            type="number"
                            fullWidth
                            required
                            error={!!errors.questions?.[index]?.points}
                            helperText={errors.questions?.[index]?.points?.message}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        )}
                      />
                    </Grid>

                    {/* Options for multiple-choice and true-false */}
                    {(watch(`questions.${index}.questionType`) === 'multiple-choice' ||
                      watch(`questions.${index}.questionType`) === 'true-false') && (
                      <>
                        {watch(`questions.${index}.questionType`) === 'multiple-choice' &&
                          [0, 1, 2, 3].map((optionIndex) => (
                            <Grid item xs={12} md={6} key={optionIndex}>
                              <Controller
                                name={`questions.${index}.options.${optionIndex}`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    label={`Option ${optionIndex + 1}`}
                                    fullWidth
                                    required
                                  />
                                )}
                              />
                            </Grid>
                          ))}
                        {watch(`questions.${index}.questionType`) === 'true-false' && (
                          <>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`questions.${index}.options.0`}
                                control={control}
                                defaultValue="True"
                                render={({ field }) => (
                                  <TextField {...field} label="Option 1" fullWidth disabled value="True" />
                                )}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Controller
                                name={`questions.${index}.options.1`}
                                control={control}
                                defaultValue="False"
                                render={({ field }) => (
                                  <TextField {...field} label="Option 2" fullWidth disabled value="False" />
                                )}
                              />
                            </Grid>
                          </>
                        )}
                      </>
                    )}

                    <Grid item xs={12}>
                      <Controller
                        name={`questions.${index}.correctAnswer`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Correct Answer"
                            fullWidth
                            required
                            error={!!errors.questions?.[index]?.correctAnswer}
                            helperText={
                              errors.questions?.[index]?.correctAnswer?.message ||
                              (watch(`questions.${index}.questionType`) === 'short-answer'
                                ? 'Enter the expected answer'
                                : 'Enter the correct option text (e.g., "True" or "Option 1 text")')
                            }
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
                  appendQuestion({
                    questionText: '',
                    questionType: 'multiple-choice',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    points: 1,
                  })
                }
                variant="outlined"
              >
                Add Question
              </Button>
            </Box>
          </CustomCard>
        )}

        {/* Form Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/teacher/activities')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Activity' : 'Create Activity'}
          </Button>
        </Box>
      </form>
    </TeacherLayout>
  );
};

export default CreateActivity;
