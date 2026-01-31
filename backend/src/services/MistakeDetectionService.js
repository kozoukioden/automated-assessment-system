import Mistake from '../models/Mistake.js';
import Evaluation from '../models/Evaluation.js';
import Submission from '../models/Submission.js';
import Student from '../models/Student.js';
import { geminiAIService } from './GeminiAIService.js';
import { ERROR_TYPES, SEVERITY_LEVELS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Mistake Detection Service (FR6 & FR7)
 * Uses Google Gemini AI to identify errors and challenges in submissions
 */
class MistakeDetectionService {
  /**
   * Detect mistakes in evaluation using Gemini AI (FR6)
   */
  async detectMistakes(evaluationId) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('submissionId');

      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      const submission = evaluation.submissionId;

      // Fetch student's English level
      let englishLevel = 'B1'; // Default
      try {
        const student = await Student.findOne({ userId: submission.studentId });
        if (student && student.englishLevel) {
          englishLevel = student.englishLevel;
        }
      } catch (err) {
        logger.warn(`Could not fetch student level: ${err.message}, using default B1`);
      }

      let mistakes = [];

      // Detect mistakes based on content type using Gemini
      switch (submission.contentType) {
        case 'speaking':
          mistakes = await this.detectSpeakingMistakes(submission, evaluation, englishLevel);
          break;
        case 'writing':
          mistakes = await this.detectWritingMistakes(submission, evaluation, englishLevel);
          break;
        case 'quiz':
          mistakes = await this.detectQuizMistakes(submission, evaluation);
          break;
      }

      // Save all detected mistakes
      const savedMistakes = await Promise.all(
        mistakes.map((mistake) =>
          Mistake.create({
            evaluationId: evaluation._id,
            ...mistake,
          })
        )
      );

      logger.info(
        `Gemini detected ${savedMistakes.length} mistakes for evaluation ${evaluation.evaluationId}`
      );

      return savedMistakes;
    } catch (error) {
      logger.error(`Mistake detection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect speaking mistakes using Gemini AI
   * @param {object} submission - The submission object
   * @param {object} evaluation - The evaluation object
   * @param {string} englishLevel - Student's CEFR level
   */
  async detectSpeakingMistakes(submission, evaluation, englishLevel = 'B1') {
    const transcript = submission.content.transcript || '';

    if (!transcript) {
      // If no transcript, provide generic feedback based on scores
      return this.generateGenericSpeakingFeedback(submission, evaluation);
    }

    try {
      // Use Gemini for speaking mistake detection with student level
      const geminiMistakes = await geminiAIService.detectMistakes(transcript, 'speaking', englishLevel);

      return geminiMistakes.map(error => ({
        errorType: this.mapErrorType(error.errorType),
        description: error.description,
        suggestion: error.suggestion,
        severity: this.mapSeverity(error.severity),
        originalText: error.originalText,
        correctedText: error.correctedText,
        positionStart: error.position,
        isPossibleError: error.aiGenerated,
      }));
    } catch (error) {
      logger.error(`Gemini speaking mistake detection failed: ${error.message}, using fallback`);
      return this.fallbackDetectSpeakingMistakes(submission, evaluation);
    }
  }

  /**
   * Detect writing mistakes using Gemini AI
   * @param {object} submission - The submission object
   * @param {object} evaluation - The evaluation object
   * @param {string} englishLevel - Student's CEFR level
   */
  async detectWritingMistakes(submission, evaluation, englishLevel = 'B1') {
    const text = submission.content.text;

    try {
      // Use Gemini for writing mistake detection with student level
      const geminiMistakes = await geminiAIService.detectMistakes(text, 'writing', englishLevel);

      return geminiMistakes.map(error => ({
        errorType: this.mapErrorType(error.errorType),
        description: error.description,
        suggestion: error.suggestion,
        severity: this.mapSeverity(error.severity),
        originalText: error.originalText,
        correctedText: error.correctedText,
        positionStart: error.position,
        isPossibleError: error.aiGenerated,
      }));
    } catch (error) {
      logger.error(`Gemini writing mistake detection failed: ${error.message}, using fallback`);
      return this.fallbackDetectWritingMistakes(submission, evaluation);
    }
  }

  /**
   * Detect quiz mistakes (incorrect answers)
   */
  async detectQuizMistakes(submission, evaluation) {
    const mistakes = [];
    const activity = await submission.populate('activityId');
    const questions = activity.activityId.questions;
    const answers = submission.content.answers;

    answers.forEach((studentAnswer, index) => {
      const question = questions[index];
      const isCorrect =
        studentAnswer.answer.toLowerCase().trim() ===
        question.correctAnswer.toLowerCase().trim();

      if (!isCorrect) {
        mistakes.push({
          errorType: ERROR_TYPES.LOGIC,
          description: `Incorrect answer to question ${index + 1}: "${question.questionText}"`,
          suggestion: `The correct answer is: ${question.correctAnswer}`,
          severity: SEVERITY_LEVELS.MAJOR,
          originalText: studentAnswer.answer,
          correctedText: question.correctAnswer,
          isPossibleError: false,
        });
      }
    });

    return mistakes;
  }

  /**
   * Detect recurring challenges using Gemini AI (FR7)
   */
  async detectChallenges(studentId, limit = 10) {
    try {
      // Get recent submissions for student
      const submissions = await Submission.find({ studentId })
        .sort({ submittedAt: -1 })
        .limit(limit)
        .populate('activityId');

      if (submissions.length === 0) {
        return [];
      }

      // Prepare submission data for Gemini analysis
      const submissionData = submissions.map(sub => ({
        content: sub.content?.text || sub.content?.transcript || '',
        type: sub.contentType,
        submittedAt: sub.submittedAt
      })).filter(s => s.content);

      if (submissionData.length === 0) {
        return [];
      }

      try {
        // Use Gemini for challenge detection
        const geminiChallenges = await geminiAIService.detectChallenges(submissionData);

        const challenges = geminiChallenges.map(challenge => ({
          challengeType: challenge.challengeType,
          pattern: challenge.pattern,
          frequency: challenge.frequency,
          percentage: parseInt(challenge.frequency) || 0,
          severity: challenge.severity,
          recommendation: challenge.recommendation,
          aiGenerated: true,
        }));

        logger.info(`Gemini detected ${challenges.length} recurring challenges for student ${studentId}`);
        return challenges;
      } catch (geminiError) {
        logger.error(`Gemini challenge detection failed: ${geminiError.message}, using fallback`);
        return this.fallbackDetectChallenges(studentId, limit);
      }
    } catch (error) {
      logger.error(`Challenge detection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map Gemini error type to internal error type
   */
  mapErrorType(geminiType) {
    const typeMap = {
      'grammar': ERROR_TYPES.GRAMMAR,
      'vocabulary': ERROR_TYPES.VOCABULARY,
      'spelling': ERROR_TYPES.SPELLING,
      'punctuation': ERROR_TYPES.PUNCTUATION,
      'logic': ERROR_TYPES.LOGIC,
      'pronunciation': ERROR_TYPES.PRONUNCIATION,
    };
    return typeMap[geminiType?.toLowerCase()] || ERROR_TYPES.GRAMMAR;
  }

  /**
   * Map Gemini severity to internal severity
   */
  mapSeverity(geminiSeverity) {
    const severityMap = {
      'critical': SEVERITY_LEVELS.CRITICAL,
      'major': SEVERITY_LEVELS.MAJOR,
      'minor': SEVERITY_LEVELS.MINOR,
    };
    return severityMap[geminiSeverity?.toLowerCase()] || SEVERITY_LEVELS.MINOR;
  }

  /**
   * Generate generic speaking feedback when no transcript available
   */
  generateGenericSpeakingFeedback(submission, evaluation) {
    const mistakes = [];

    if (evaluation.pronunciationScore < 70) {
      mistakes.push({
        errorType: ERROR_TYPES.PRONUNCIATION,
        description: 'Pronunciation clarity needs improvement',
        suggestion: 'Focus on clear articulation of consonants and vowels',
        severity: SEVERITY_LEVELS.MAJOR,
        isPossibleError: true,
      });
    }

    if (submission.content.duration < 60) {
      mistakes.push({
        errorType: ERROR_TYPES.PRONUNCIATION,
        description: 'Response too short for comprehensive evaluation',
        suggestion: 'Aim for at least 1-2 minutes of speaking time',
        severity: SEVERITY_LEVELS.MINOR,
        isPossibleError: false,
      });
    }

    return mistakes;
  }

  /**
   * Fallback speaking mistake detection (rule-based)
   */
  fallbackDetectSpeakingMistakes(submission, evaluation) {
    const mistakes = [];
    const transcript = submission.content.transcript || '';

    if (!transcript) {
      return this.generateGenericSpeakingFeedback(submission, evaluation);
    }

    const pronunciationPatterns = [
      {
        pattern: /\b(th|the|that|this)\b/gi,
        error: 'TH sound pronunciation',
        suggestion: "Practice 'th' sound - tongue between teeth",
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /\b(r|right|read|run)\b/gi,
        error: 'R sound clarity',
        suggestion: "Ensure clear 'r' sound without 'l' substitution",
        severity: SEVERITY_LEVELS.MINOR,
      },
      {
        pattern: /\b(v|very|have|voice)\b/gi,
        error: 'V sound pronunciation',
        suggestion: "Distinguish 'v' from 'w' - teeth touch lower lip",
        severity: SEVERITY_LEVELS.MINOR,
      },
    ];

    pronunciationPatterns.forEach((pattern) => {
      const matches = transcript.match(pattern.pattern);
      if (matches && matches.length > 3 && evaluation.pronunciationScore < 75) {
        mistakes.push({
          errorType: ERROR_TYPES.PRONUNCIATION,
          description: `Possible issue with ${pattern.error}`,
          suggestion: pattern.suggestion,
          severity: pattern.severity,
          isPossibleError: true,
        });
      }
    });

    return mistakes;
  }

  /**
   * Fallback writing mistake detection (rule-based)
   */
  fallbackDetectWritingMistakes(submission, evaluation) {
    const mistakes = [];
    const text = submission.content.text;

    const grammarPatterns = [
      {
        pattern: /\b(he|she|it)\s+(am|are)\b/gi,
        error: 'subject-verb agreement',
        suggestion: "Use 'is' with third-person singular (he/she/it)",
        severity: SEVERITY_LEVELS.CRITICAL,
      },
      {
        pattern: /\b(I|you|we|they)\s+is\b/gi,
        error: 'subject-verb agreement',
        suggestion: "Use 'am' with I, 'are' with you/we/they",
        severity: SEVERITY_LEVELS.CRITICAL,
      },
      {
        pattern: /\ba\s+([aeiou]\w*)/gi,
        error: 'article usage',
        suggestion: "Use 'an' before vowel sounds",
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /\ban\s+([^aeiou]\w*)/gi,
        error: 'article usage',
        suggestion: "Use 'a' before consonant sounds",
        severity: SEVERITY_LEVELS.MAJOR,
      },
      {
        pattern: /\b(don't|doesn't|won't)\s+\w+ed\b/gi,
        error: 'verb form after negative',
        suggestion: 'Use base form after negative auxiliary verbs',
        severity: SEVERITY_LEVELS.MAJOR,
      },
    ];

    grammarPatterns.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        mistakes.push({
          errorType: ERROR_TYPES.GRAMMAR,
          description: `Grammar error: ${pattern.error}`,
          suggestion: pattern.suggestion,
          positionStart: match.index,
          positionEnd: match.index + match[0].length,
          severity: pattern.severity,
          originalText: match[0],
          correctedText: this.generateCorrection(match[0], pattern.error),
          isPossibleError: false,
        });
      }
    });

    const spellingPatterns = [
      { wrong: /\brecieve\b/gi, correct: 'receive' },
      { wrong: /\boccured\b/gi, correct: 'occurred' },
      { wrong: /\bseperate\b/gi, correct: 'separate' },
      { wrong: /\bdefinately\b/gi, correct: 'definitely' },
      { wrong: /\bthier\b/gi, correct: 'their' },
    ];

    spellingPatterns.forEach((pattern) => {
      let match;
      const regex = new RegExp(pattern.wrong.source, pattern.wrong.flags);

      while ((match = regex.exec(text)) !== null) {
        mistakes.push({
          errorType: ERROR_TYPES.SPELLING,
          description: 'Spelling error',
          suggestion: `Correct spelling: "${pattern.correct}"`,
          positionStart: match.index,
          positionEnd: match.index + match[0].length,
          severity: SEVERITY_LEVELS.MAJOR,
          originalText: match[0],
          correctedText: pattern.correct,
          isPossibleError: false,
        });
      }
    });

    return mistakes;
  }

  /**
   * Fallback challenge detection (pattern-based)
   */
  async fallbackDetectChallenges(studentId, limit = 10) {
    const evaluationIds = [];
    const submissions = await Submission.find({ studentId })
      .sort({ submittedAt: -1 })
      .limit(limit);

    for (const sub of submissions) {
      const evaluation = await Evaluation.findOne({ submissionId: sub._id });
      if (evaluation) {
        evaluationIds.push(evaluation._id);
      }
    }

    const mistakes = await Mistake.find({
      evaluationId: { $in: evaluationIds },
    });

    const errorTypeCounts = {};
    const challengeAreas = [];

    mistakes.forEach((mistake) => {
      errorTypeCounts[mistake.errorType] = (errorTypeCounts[mistake.errorType] || 0) + 1;
    });

    const threshold = limit * 0.3;

    Object.entries(errorTypeCounts).forEach(([errorType, count]) => {
      if (count >= threshold) {
        challengeAreas.push({
          challengeType: errorType,
          frequency: count,
          percentage: Math.round((count / limit) * 100),
          severity: count >= threshold * 2 ? 'high' : 'medium',
          recommendation: this.getRecommendation(errorType),
        });
      }
    });

    return challengeAreas;
  }

  /**
   * Generate correction suggestion
   */
  generateCorrection(originalText, errorType) {
    const corrections = {
      'subject-verb agreement': originalText.replace(/\b(he|she|it)\s+(am|are)\b/gi, '$1 is'),
      'article usage': originalText.replace(/\ba\s+([aeiou])/gi, 'an $1'),
    };

    return corrections[errorType] || originalText;
  }

  /**
   * Get personalized recommendation based on challenge type
   */
  getRecommendation(errorType) {
    const recommendations = {
      [ERROR_TYPES.GRAMMAR]: 'Review grammar rules and practice with exercises',
      [ERROR_TYPES.VOCABULARY]: 'Expand vocabulary through reading and word lists',
      [ERROR_TYPES.PRONUNCIATION]: 'Practice pronunciation with audio resources',
      [ERROR_TYPES.SPELLING]: 'Use spell-check tools and memorize common patterns',
      [ERROR_TYPES.PUNCTUATION]: 'Study punctuation rules and apply consistently',
      [ERROR_TYPES.LOGIC]: 'Improve analytical thinking and problem-solving skills',
    };

    return recommendations[errorType] || 'Continue practicing and reviewing fundamentals';
  }
}

export default new MistakeDetectionService();
