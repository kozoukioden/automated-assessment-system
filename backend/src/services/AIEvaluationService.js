import Evaluation from '../models/Evaluation.js';
import Submission from '../models/Submission.js';
import Student from '../models/Student.js';
import EvaluationRepository from '../repositories/EvaluationRepository.js';
import SubmissionRepository from '../repositories/SubmissionRepository.js';
import MistakeDetectionService from './MistakeDetectionService.js';
import FeedbackGenerationService from './FeedbackGenerationService.js';
import NotificationService from './NotificationService.js';
import { geminiAIService } from './GeminiAIService.js';
import { SUBMISSION_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * AI Evaluation Service (FR5)
 * Uses Google Gemini AI for real assessment
 */
class AIEvaluationService {
  /**
   * Evaluate a submission using Gemini AI
   */
  async evaluateSubmission(submissionId) {
    try {
      // Update submission status
      await SubmissionRepository.updateStatus(submissionId, SUBMISSION_STATUS.EVALUATING);

      const submission = await SubmissionRepository.findById(submissionId);

      if (!submission) {
        throw new Error('Submission not found');
      }

      // Fetch student's English level for personalized evaluation
      let englishLevel = 'B1'; // Default
      try {
        const student = await Student.findOne({ userId: submission.studentId });
        if (student && student.englishLevel) {
          englishLevel = student.englishLevel;
          logger.info(`Evaluating submission for ${englishLevel} level student`);
        }
      } catch (err) {
        logger.warn(`Could not fetch student level: ${err.message}, using default B1`);
      }

      let evaluationData;

      // Route to appropriate evaluation based on content type
      switch (submission.contentType) {
        case 'speaking':
          evaluationData = await this.evaluateSpeaking(submission, englishLevel);
          break;
        case 'writing':
          evaluationData = await this.evaluateWriting(submission, englishLevel);
          break;
        case 'quiz':
          evaluationData = await this.evaluateQuiz(submission, englishLevel);
          break;
        default:
          throw new Error(`Unknown content type: ${submission.contentType}`);
      }

      // Create evaluation record
      const evaluation = await EvaluationRepository.create({
        submissionId: submission._id,
        ...evaluationData,
      });

      // Detect mistakes using Gemini (FR6)
      await MistakeDetectionService.detectMistakes(evaluation._id);

      // Generate feedback using Gemini (FR8)
      await FeedbackGenerationService.generateFeedback(evaluation._id);

      // Update submission status to completed
      await SubmissionRepository.updateStatus(submissionId, SUBMISSION_STATUS.COMPLETED);

      // Send notification
      await NotificationService.notifyEvaluationCompleted(submission.studentId, evaluation._id);

      logger.info(`Gemini AI evaluation completed for submission ${submission.submissionId}`);

      return evaluation;
    } catch (error) {
      logger.error(`Evaluation failed for submission ${submissionId}: ${error.message}`);

      // Update submission status to failed
      await SubmissionRepository.updateStatus(submissionId, SUBMISSION_STATUS.FAILED);

      throw error;
    }
  }

  /**
   * Evaluate speaking submission using Gemini AI
   * @param {object} submission - The submission object
   * @param {string} englishLevel - Student's CEFR level
   */
  async evaluateSpeaking(submission, englishLevel = 'B1') {
    const content = submission.content;
    const transcript = content.transcript || '';

    // Get rubric if available
    let rubric = null;
    try {
      const activity = await submission.populate('activityId');
      if (activity.activityId?.rubricId) {
        await activity.activityId.populate('rubricId');
        rubric = activity.activityId.rubricId;
      }
    } catch (err) {
      logger.warn(`Could not load rubric for submission: ${err.message}`);
    }

    try {
      // Use Gemini AI for evaluation with student's level
      const geminiResult = await geminiAIService.evaluateSubmission(
        transcript || `Audio submission (duration: ${content.duration} seconds)`,
        'speaking',
        rubric,
        englishLevel
      );

      return {
        overallScore: geminiResult.overallScore,
        pronunciationScore: geminiResult.pronunciationScore || geminiResult.clarityScore,
        vocabularyScore: geminiResult.vocabularyScore,
        grammarScore: geminiResult.grammarScore,
        aiConfidence: geminiResult.aiConfidence,
        evaluatedAt: new Date(),
        aiProvider: 'gemini',
        aiModel: 'gemini-2.0-flash',
        studentLevel: englishLevel,
        scoreBreakdown: {
          fluency: geminiResult.structureScore,
          clarity: geminiResult.clarityScore,
          pace: Math.round((geminiResult.structureScore + geminiResult.clarityScore) / 2),
        },
        reasoning: geminiResult.reasoning,
      };
    } catch (error) {
      logger.error(`Gemini speaking evaluation failed: ${error.message}, using fallback`);
      return this.fallbackEvaluateSpeaking(submission);
    }
  }

  /**
   * Evaluate writing submission using Gemini AI
   * @param {object} submission - The submission object
   * @param {string} englishLevel - Student's CEFR level
   */
  async evaluateWriting(submission, englishLevel = 'B1') {
    const text = submission.content.text;
    const wordCount = submission.content.wordCount;

    // Get rubric if available
    let rubric = null;
    try {
      const activity = await submission.populate('activityId');
      if (activity.activityId?.rubricId) {
        await activity.activityId.populate('rubricId');
        rubric = activity.activityId.rubricId;
      }
    } catch (err) {
      logger.warn(`Could not load rubric for submission: ${err.message}`);
    }

    try {
      // Use Gemini AI for evaluation with student's level
      const geminiResult = await geminiAIService.evaluateSubmission(
        text,
        'writing',
        rubric,
        englishLevel
      );

      return {
        overallScore: geminiResult.overallScore,
        grammarScore: geminiResult.grammarScore,
        vocabularyScore: geminiResult.vocabularyScore,
        aiConfidence: geminiResult.aiConfidence,
        evaluatedAt: new Date(),
        aiProvider: 'gemini',
        aiModel: 'gemini-2.0-flash',
        studentLevel: englishLevel,
        scoreBreakdown: {
          structure: geminiResult.structureScore,
          coherence: geminiResult.clarityScore,
          mechanics: geminiResult.grammarScore,
          creativity: Math.round((geminiResult.vocabularyScore + geminiResult.structureScore) / 2),
        },
        reasoning: geminiResult.reasoning,
      };
    } catch (error) {
      logger.error(`Gemini writing evaluation failed: ${error.message}, using fallback`);
      return this.fallbackEvaluateWriting(submission);
    }
  }

  /**
   * Evaluate quiz submission
   * Uses exact matching for objective questions, Gemini for short-answer
   * @param {object} submission - The submission object
   * @param {string} englishLevel - Student's CEFR level
   */
  async evaluateQuiz(submission, englishLevel = 'B1') {
    const activity = await submission.populate('activityId');
    const questions = activity.activityId.questions;
    const answers = submission.content.answers;

    let correctCount = 0;
    let partialCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    // Evaluate each answer
    for (let index = 0; index < answers.length; index++) {
      const studentAnswer = answers[index];
      const question = questions[index];
      totalPoints += question.points || 1;

      let score;

      if (question.questionType === 'short-answer') {
        // Use Gemini for short-answer evaluation
        try {
          score = await this.evaluateShortAnswerWithGemini(
            studentAnswer.answer,
            question.correctAnswer,
            question.questionText
          );
        } catch (err) {
          logger.warn(`Gemini short-answer evaluation failed: ${err.message}`);
          score = this.evaluateAnswer(studentAnswer.answer, question.correctAnswer, question.questionType);
        }
      } else {
        score = this.evaluateAnswer(studentAnswer.answer, question.correctAnswer, question.questionType);
      }

      if (score === 1) {
        correctCount++;
        earnedPoints += question.points || 1;
      } else if (score > 0) {
        partialCount++;
        earnedPoints += score * (question.points || 1);
      }
    }

    const logicScore = Math.round((earnedPoints / totalPoints) * 100);
    const overallScore = logicScore;

    return {
      overallScore,
      logicScore,
      aiConfidence: 0.95,
      evaluatedAt: new Date(),
      aiProvider: 'gemini',
      aiModel: 'gemini-2.0-flash',
      studentLevel: englishLevel,
      scoreBreakdown: {
        correctAnswers: correctCount,
        partialCredit: partialCount,
        totalQuestions: questions.length,
        accuracy: Math.round((correctCount / questions.length) * 100),
      },
    };
  }

  /**
   * Use Gemini to evaluate short-answer questions
   */
  async evaluateShortAnswerWithGemini(studentAnswer, correctAnswer, questionText) {
    try {
      const prompt = `You are evaluating a student's short answer response.

Question: ${questionText}
Expected Answer: ${correctAnswer}
Student's Answer: ${studentAnswer}

Evaluate if the student's answer is correct. Consider:
- Semantic equivalence (same meaning, different words)
- Partial correctness
- Minor spelling variations

Return ONLY a JSON object (no markdown):
{
  "score": <number 0.0-1.0>,
  "reasoning": "<brief explanation>"
}

Score guide: 1.0 = fully correct, 0.75 = mostly correct, 0.5 = partially correct, 0.25 = slightly relevant, 0 = incorrect`;

      const result = await geminiAIService.model.generateContent(prompt);
      const response = result.response.text()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(response);
      return Math.min(1, Math.max(0, parsed.score || 0));
    } catch (error) {
      logger.error(`Gemini short-answer evaluation error: ${error.message}`);
      // Fall back to string similarity
      return this.evaluateAnswer(studentAnswer, correctAnswer, 'short-answer');
    }
  }

  /**
   * Fallback speaking evaluation (rule-based)
   */
  fallbackEvaluateSpeaking(submission) {
    const content = submission.content;
    const durationScore = Math.min(100, (content.duration / 120) * 50 + 30);
    const pronunciationScore = Math.round(durationScore * (0.8 + Math.random() * 0.2));
    const vocabularyScore = Math.round(60 + Math.random() * 35);
    const grammarScore = content.transcript
      ? this.calculateGrammarScoreSync(content.transcript)
      : Math.round(65 + Math.random() * 30);

    const overallScore = Math.round(
      pronunciationScore * 0.4 + vocabularyScore * 0.3 + grammarScore * 0.3
    );

    return {
      overallScore,
      pronunciationScore,
      vocabularyScore,
      grammarScore,
      aiConfidence: 0.6,
      evaluatedAt: new Date(),
      aiProvider: 'fallback',
      aiModel: 'rule-based',
      scoreBreakdown: {
        fluency: Math.round(70 + Math.random() * 25),
        clarity: pronunciationScore,
        pace: Math.round(65 + Math.random() * 30),
      },
    };
  }

  /**
   * Fallback writing evaluation (rule-based)
   */
  fallbackEvaluateWriting(submission) {
    const text = submission.content.text;
    const wordCount = submission.content.wordCount;

    const grammarScore = this.calculateGrammarScoreSync(text);
    const vocabularyScore = this.calculateVocabularyScore(text, wordCount);
    const structureScore = this.calculateStructureScore(text, wordCount);

    const overallScore = Math.round(
      grammarScore * 0.4 + vocabularyScore * 0.35 + structureScore * 0.25
    );

    return {
      overallScore,
      grammarScore,
      vocabularyScore,
      aiConfidence: 0.6,
      evaluatedAt: new Date(),
      aiProvider: 'fallback',
      aiModel: 'rule-based',
      scoreBreakdown: {
        structure: structureScore,
        coherence: Math.round(70 + Math.random() * 25),
        mechanics: grammarScore,
        creativity: Math.round(65 + Math.random() * 30),
      },
    };
  }

  /**
   * Calculate grammar score (synchronous fallback)
   */
  calculateGrammarScoreSync(text) {
    const grammarRules = [
      { pattern: /\b(he|she|it)\s+(am|are)\b/gi, weight: 3 },
      { pattern: /\b(I|you|we|they)\s+is\b/gi, weight: 3 },
      { pattern: /\ba\s+[aeiou]/gi, weight: 2 },
      { pattern: /\ban\s+[^aeiou]/gi, weight: 2 },
      { pattern: /\bthere\s+is\s+\w+\s+(are|were)\b/gi, weight: 2 },
      { pattern: /\b(don't|doesn't|didn't)\s+\w+ed\b/gi, weight: 3 },
      { pattern: /\s{2,}/g, weight: 1 },
      { pattern: /[a-z]\.[A-Z]/g, weight: 2 },
    ];

    let errorCount = 0;

    grammarRules.forEach((rule) => {
      const matches = text.match(rule.pattern);
      if (matches) {
        errorCount += matches.length * rule.weight;
      }
    });

    const baseScore = 100;
    const deduction = Math.min(40, errorCount * 2);

    return Math.max(60, baseScore - deduction);
  }

  /**
   * Calculate vocabulary score
   */
  calculateVocabularyScore(text, wordCount) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const lexicalDiversity = uniqueWords.size / wordCount;
    const advancedWords = words.filter((word) => word.length > 7).length;
    const advancedRatio = advancedWords / wordCount;

    let score = 60;
    score += lexicalDiversity * 50;
    score += advancedRatio * 100;

    return Math.round(Math.min(95, score));
  }

  /**
   * Calculate structure score
   */
  calculateStructureScore(text, wordCount) {
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    let score = 60;

    if (wordCount >= 100 && wordCount <= 500) {
      score += 15;
    } else if (wordCount >= 50 && wordCount < 100) {
      score += 10;
    }

    if (paragraphCount >= 2 && paragraphCount <= 5) {
      score += 15;
    } else if (paragraphCount >= 1) {
      score += 8;
    }

    const avgSentenceLength = wordCount / sentenceCount;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      score += 10;
    }

    return Math.round(Math.min(95, score));
  }

  /**
   * Evaluate quiz answer (fallback for non-Gemini)
   */
  evaluateAnswer(studentAnswer, correctAnswer, questionType) {
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
      return studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ? 1 : 0;
    }

    if (questionType === 'short-answer') {
      const similarity = this.calculateStringSimilarity(
        studentAnswer.toLowerCase().trim(),
        correctAnswer.toLowerCase().trim()
      );

      if (similarity >= 0.9) return 1;
      if (similarity >= 0.7) return 0.75;
      if (similarity >= 0.5) return 0.5;
      return 0;
    }

    return 0;
  }

  /**
   * Calculate string similarity
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Batch evaluate pending submissions
   */
  async startBatchEvaluation(limit = 10) {
    const pendingSubmissions = await SubmissionRepository.findPending(limit);

    logger.info(`Starting batch evaluation for ${pendingSubmissions.length} submissions`);

    const results = [];

    for (const submission of pendingSubmissions) {
      try {
        const evaluation = await this.evaluateSubmission(submission._id);
        results.push({ submissionId: submission._id, success: true, evaluation });
      } catch (error) {
        logger.error(`Batch evaluation failed for ${submission._id}: ${error.message}`);
        results.push({ submissionId: submission._id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Retry failed evaluation
   */
  async retryEvaluation(submissionId) {
    logger.info(`Retrying evaluation for submission ${submissionId}`);
    return await this.evaluateSubmission(submissionId);
  }
}

export default new AIEvaluationService();
