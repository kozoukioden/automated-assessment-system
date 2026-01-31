import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Grade as GradeIcon,
  Feedback as FeedbackIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Spellcheck as SpellcheckIcon,
  Lightbulb as LightbulbIcon,
  EmojiObjects as EmojiObjectsIcon,
  ThumbUp as ThumbUpIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import StudentLayout from '../../components/common/Layout/StudentLayout';
import CustomCard from '../../components/common/UI/CustomCard';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import ErrorMessage from '../../components/common/UI/ErrorMessage';
import useApi from '../../hooks/useApi';
import api from '../../services/api';
import { ENDPOINTS } from '../../config/env';
import { ACTIVITY_TYPES, SUBMISSION_STATUS } from '../../utils/constants';
import { format } from 'date-fns';

/**
 * SubmissionResults Component
 * Display submission details with comprehensive AI-generated evaluation results
 */
const SubmissionResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, execute } = useApi();
  const [submission, setSubmission] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Fetch submission details on component mount
  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    const result = await execute(
      () => api.get(ENDPOINTS.SUBMISSIONS.BY_ID(id)),
      { showErrorToast: true }
    );

    if (result.success) {
      const submissionData = result.data.submission || result.data;
      setSubmission(submissionData);

      // Fetch evaluation by submission ID
      if (submissionData.status === SUBMISSION_STATUS.COMPLETED || submissionData.status === 'completed') {
        fetchEvaluationBySubmission(submissionData._id || id);
      }
    }
  };

  const fetchEvaluationBySubmission = async (submissionId) => {
    try {
      const result = await api.get(ENDPOINTS.EVALUATIONS.BY_SUBMISSION(submissionId));
      const data = result.data || result;

      // Extract evaluation
      const evaluationData = data?.evaluation || data;
      if (evaluationData && evaluationData.overallScore !== undefined) {
        setEvaluation(evaluationData);
      }

      // Extract mistakes (from new API response structure)
      if (data?.mistakes && Array.isArray(data.mistakes)) {
        setMistakes(data.mistakes);
      }

      // Extract feedback (from new API response structure)
      if (data?.feedback) {
        setFeedback(data.feedback);
      }
    } catch (err) {
      console.log('Evaluation not found for submission:', submissionId);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [SUBMISSION_STATUS.PENDING]: 'warning',
      [SUBMISSION_STATUS.EVALUATING]: 'info',
      [SUBMISSION_STATUS.COMPLETED]: 'success',
      [SUBMISSION_STATUS.FAILED]: 'error',
    };
    return colors[status] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getMistakeTypeColor = (type) => {
    const colors = {
      grammar: 'error',
      spelling: 'warning',
      vocabulary: 'info',
      punctuation: 'secondary',
      logic: 'primary',
      pronunciation: 'secondary',
    };
    return colors[type] || 'default';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'error',
      major: 'warning',
      minor: 'default',
    };
    return colors[severity] || 'default';
  };

  if (loading && !submission) {
    return (
      <StudentLayout title="Submission Results">
        <LoadingSpinner message="Loading submission..." />
      </StudentLayout>
    );
  }

  if (error && !submission) {
    return (
      <StudentLayout title="Submission Results">
        <ErrorMessage
          title="Error Loading Submission"
          message={error.message}
          onRetry={fetchSubmission}
        />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Submission Results">
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/student/activities')}
          sx={{ mb: 2 }}
        >
          Back to Activities
        </Button>

        {submission && (
          <>
            {/* Submission Header */}
            <CustomCard sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {submission.activityId?.title || 'Submission'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submitted on {format(new Date(submission.createdAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
                <Chip
                  label={submission.status}
                  color={getStatusColor(submission.status)}
                  icon={submission.status === SUBMISSION_STATUS.COMPLETED ? <CheckCircleIcon /> : undefined}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Chip
                  label={submission.activityId?.activityType || 'Unknown'}
                  variant="outlined"
                  size="small"
                />
                {evaluation?.overallScore !== undefined && (
                  <Chip
                    label={`Score: ${evaluation.overallScore.toFixed(1)}%`}
                    color={getScoreColor(evaluation.overallScore)}
                    icon={<GradeIcon />}
                  />
                )}
              </Box>
            </CustomCard>

            {/* Evaluation Status Alerts */}
            {submission.status === SUBMISSION_STATUS.EVALUATING && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Your submission is being evaluated by AI. Please check back later for results.
              </Alert>
            )}

            {submission.status === SUBMISSION_STATUS.FAILED && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Evaluation failed. Please contact your teacher or try submitting again.
              </Alert>
            )}

            {submission.status === SUBMISSION_STATUS.PENDING && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Your submission is pending evaluation.
              </Alert>
            )}

            {/* Overall Score and Component Scores */}
            {evaluation && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Overall Score */}
                <Grid item xs={12} md={4}>
                  <CustomCard title="Overall Score">
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography
                        variant="h2"
                        color={`${getScoreColor(evaluation.overallScore)}.main`}
                        gutterBottom
                      >
                        {evaluation.overallScore.toFixed(1)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={evaluation.overallScore}
                        color={getScoreColor(evaluation.overallScore)}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                      {evaluation.aiConfidence && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          AI Confidence: {(evaluation.aiConfidence * 100).toFixed(0)}%
                        </Typography>
                      )}
                    </Box>
                  </CustomCard>
                </Grid>

                {/* Score Breakdown */}
                <Grid item xs={12} md={8}>
                  <CustomCard title="Score Breakdown">
                    <Grid container spacing={2}>
                      {evaluation.grammarScore !== undefined && (
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary">Grammar</Typography>
                            <Typography variant="h5" color={`${getScoreColor(evaluation.grammarScore)}.main`}>
                              {evaluation.grammarScore.toFixed(0)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={evaluation.grammarScore}
                              color={getScoreColor(evaluation.grammarScore)}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Grid>
                      )}
                      {evaluation.vocabularyScore !== undefined && (
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary">Vocabulary</Typography>
                            <Typography variant="h5" color={`${getScoreColor(evaluation.vocabularyScore)}.main`}>
                              {evaluation.vocabularyScore.toFixed(0)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={evaluation.vocabularyScore}
                              color={getScoreColor(evaluation.vocabularyScore)}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Grid>
                      )}
                      {evaluation.pronunciationScore !== undefined && (
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary">Pronunciation</Typography>
                            <Typography variant="h5" color={`${getScoreColor(evaluation.pronunciationScore)}.main`}>
                              {evaluation.pronunciationScore.toFixed(0)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={evaluation.pronunciationScore}
                              color={getScoreColor(evaluation.pronunciationScore)}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Grid>
                      )}
                      {evaluation.logicScore !== undefined && (
                        <Grid item xs={6} sm={3}>
                          <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary">Logic/Accuracy</Typography>
                            <Typography variant="h5" color={`${getScoreColor(evaluation.logicScore)}.main`}>
                              {evaluation.logicScore.toFixed(0)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={evaluation.logicScore}
                              color={getScoreColor(evaluation.logicScore)}
                              sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CustomCard>
                </Grid>
              </Grid>
            )}

            {/* AI Feedback Section */}
            {feedback && (
              <CustomCard
                title="AI Feedback"
                icon={<FeedbackIcon color="primary" />}
                sx={{ mb: 3 }}
              >
                {/* Main Feedback Text */}
                {feedback.feedbackText && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {feedback.feedbackText}
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={3}>
                  {/* Strengths */}
                  {feedback.strengths && feedback.strengths.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%', borderColor: 'success.light' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ThumbUpIcon color="success" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" color="success.main" fontWeight="bold">
                              Strengths
                            </Typography>
                          </Box>
                          <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            {feedback.strengths.map((strength, idx) => (
                              <Typography component="li" key={idx} variant="body2" sx={{ mb: 1 }}>
                                {strength}
                              </Typography>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Areas for Improvement */}
                  {feedback.improvements && feedback.improvements.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%', borderColor: 'warning.light' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <BuildIcon color="warning" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" color="warning.main" fontWeight="bold">
                              Areas to Improve
                            </Typography>
                          </Box>
                          <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            {feedback.improvements.map((improvement, idx) => (
                              <Typography component="li" key={idx} variant="body2" sx={{ mb: 1 }}>
                                {improvement}
                              </Typography>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Recommendations */}
                  {feedback.recommendations && feedback.recommendations.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined" sx={{ height: '100%', borderColor: 'info.light' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <LightbulbIcon color="info" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" color="info.main" fontWeight="bold">
                              Recommendations
                            </Typography>
                          </Box>
                          <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            {feedback.recommendations.map((rec, idx) => (
                              <Typography component="li" key={idx} variant="body2" sx={{ mb: 1 }}>
                                {rec}
                              </Typography>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>

                {/* Next Steps */}
                {feedback.nextSteps && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, borderLeft: 4, borderColor: 'primary.main' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                        Next Steps to Progress
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {feedback.nextSteps}
                    </Typography>
                  </Box>
                )}
              </CustomCard>
            )}

            {/* Detailed Mistakes Analysis */}
            {mistakes && mistakes.length > 0 && (
              <CustomCard
                title="Detailed Mistakes Analysis"
                icon={<SpellcheckIcon color="error" />}
                sx={{ mb: 3 }}
              >
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {mistakes.length} {mistakes.length === 1 ? 'issue' : 'issues'} detected in your submission.
                    Review each mistake to understand how to improve.
                  </Typography>
                </Alert>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Original</strong></TableCell>
                        <TableCell><strong>Correction</strong></TableCell>
                        <TableCell><strong>Explanation</strong></TableCell>
                        <TableCell><strong>Severity</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mistakes.map((mistake, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip
                              label={mistake.errorType || mistake.type}
                              size="small"
                              color={getMistakeTypeColor(mistake.errorType || mistake.type)}
                            />
                          </TableCell>
                          <TableCell>
                            {mistake.originalText ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  textDecoration: 'line-through',
                                  color: 'error.main',
                                  fontFamily: 'monospace',
                                  bgcolor: 'error.50',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  display: 'inline-block',
                                }}
                              >
                                {mistake.originalText}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {mistake.correctedText ? (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'success.main',
                                  fontWeight: 'bold',
                                  fontFamily: 'monospace',
                                  bgcolor: 'success.50',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  display: 'inline-block',
                                }}
                              >
                                {mistake.correctedText}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {mistake.description}
                            </Typography>
                            {mistake.suggestion && (
                              <Typography variant="caption" color="primary.main" display="block" sx={{ mt: 0.5 }}>
                                <EmojiObjectsIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                Tip: {mistake.suggestion}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={mistake.severity}
                              size="small"
                              color={getSeverityColor(mistake.severity)}
                              icon={mistake.severity === 'critical' ? <WarningIcon /> : undefined}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CustomCard>
            )}

            {/* Submission Content */}
            {submission.activityId?.activityType === ACTIVITY_TYPES.WRITING && (submission.content?.text || submission.content) && (
              <CustomCard title="Your Writing" sx={{ mb: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {submission.content?.text || submission.content}
                  </Typography>
                </Box>
                {submission.content?.wordCount && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Word count: {submission.content.wordCount}
                  </Typography>
                )}
              </CustomCard>
            )}

            {submission.activityId?.activityType === ACTIVITY_TYPES.QUIZ && (submission.content?.answers || submission.answers) && (
              <CustomCard title="Your Answers" sx={{ mb: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell><strong>Question</strong></TableCell>
                        <TableCell><strong>Your Answer</strong></TableCell>
                        <TableCell><strong>Correct Answer</strong></TableCell>
                        <TableCell align="center"><strong>Result</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(submission.content?.answers || submission.answers || []).map((answer, index) => {
                        const isCorrect = answer.answer === answer.correctAnswer || answer.selectedAnswer === answer.correctAnswer;
                        return (
                          <TableRow key={index} hover>
                            <TableCell>{answer.questionText || answer.question || `Question ${index + 1}`}</TableCell>
                            <TableCell>{answer.answer || answer.selectedAnswer || 'Not answered'}</TableCell>
                            <TableCell>{answer.correctAnswer || 'N/A'}</TableCell>
                            <TableCell align="center">
                              {isCorrect ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <CancelIcon color="error" />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CustomCard>
            )}

            {/* Teacher Review */}
            {evaluation?.reviewedByTeacher && (
              <CustomCard title="Teacher Review" sx={{ mb: 3 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  This submission has been reviewed by a teacher.
                </Alert>
                {evaluation.teacherNotes && (
                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 2 }}>
                    <Typography variant="body1">
                      {evaluation.teacherNotes}
                    </Typography>
                  </Box>
                )}
              </CustomCard>
            )}
          </>
        )}
      </Box>
    </StudentLayout>
  );
};

export default SubmissionResults;
