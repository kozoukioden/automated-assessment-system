import Feedback from '../models/Feedback.js';
import Evaluation from '../models/Evaluation.js';
import Mistake from '../models/Mistake.js';
import Submission from '../models/Submission.js';
import Student from '../models/Student.js';
import FeedbackRepository from '../repositories/FeedbackRepository.js';
import NotificationService from './NotificationService.js';
import { geminiAIService } from './GeminiAIService.js';
import { logger } from '../utils/logger.js';

/**
 * Feedback Generation Service (FR8)
 * Uses Google Gemini AI to generate personalized feedback
 */
class FeedbackGenerationService {
  /**
   * Generate feedback for evaluation using Gemini AI
   */
  async generateFeedback(evaluationId) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('submissionId');

      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      const submission = evaluation.submissionId;
      const mistakes = await Mistake.find({ evaluationId });

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

      // Generate feedback based on content type using Gemini
      let feedbackData;

      switch (submission.contentType) {
        case 'speaking':
          feedbackData = await this.generateSpeakingFeedback(evaluation, mistakes, submission, englishLevel);
          break;
        case 'writing':
          feedbackData = await this.generateWritingFeedback(evaluation, mistakes, submission, englishLevel);
          break;
        case 'quiz':
          feedbackData = await this.generateQuizFeedback(evaluation, mistakes, submission, englishLevel);
          break;
        default:
          throw new Error(`Unknown content type: ${submission.contentType}`);
      }

      // Create feedback record
      const feedback = await FeedbackRepository.create({
        evaluationId: evaluation._id,
        ...feedbackData,
        generatedAt: new Date(),
        aiGenerated: true,
      });

      // Send notification
      await NotificationService.notifyFeedbackReady(submission.studentId, feedback._id);

      logger.info(`Gemini AI feedback generated for evaluation ${evaluation.evaluationId}`);

      return feedback;
    } catch (error) {
      logger.error(`Feedback generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate speaking feedback using Gemini AI
   * @param {object} evaluation - The evaluation object
   * @param {array} mistakes - List of detected mistakes
   * @param {object} submission - The submission object
   * @param {string} englishLevel - Student's CEFR level
   */
  async generateSpeakingFeedback(evaluation, mistakes, submission, englishLevel = 'B1') {
    try {
      // Use Gemini for feedback generation with student level
      const geminiFeedback = await geminiAIService.generateFeedback(
        evaluation,
        mistakes,
        'speaking',
        englishLevel
      );

      return {
        feedbackText: geminiFeedback.feedbackText,
        strengths: geminiFeedback.strengths,
        improvements: geminiFeedback.improvements,
        recommendations: geminiFeedback.recommendations,
        nextSteps: geminiFeedback.nextSteps || '',
        isSummarized: false,
        tone: geminiFeedback.tone,
        aiGenerated: true,
      };
    } catch (error) {
      logger.error(`Gemini speaking feedback failed: ${error.message}, using fallback`);
      return this.fallbackGenerateSpeakingFeedback(evaluation, mistakes, submission);
    }
  }

  /**
   * Generate writing feedback using Gemini AI
   * @param {object} evaluation - The evaluation object
   * @param {array} mistakes - List of detected mistakes
   * @param {object} submission - The submission object
   * @param {string} englishLevel - Student's CEFR level
   */
  async generateWritingFeedback(evaluation, mistakes, submission, englishLevel = 'B1') {
    try {
      // Use Gemini for feedback generation with student level
      const geminiFeedback = await geminiAIService.generateFeedback(
        evaluation,
        mistakes,
        'writing',
        englishLevel
      );

      return {
        feedbackText: geminiFeedback.feedbackText,
        strengths: geminiFeedback.strengths,
        improvements: geminiFeedback.improvements,
        recommendations: geminiFeedback.recommendations,
        nextSteps: geminiFeedback.nextSteps || '',
        isSummarized: false,
        tone: geminiFeedback.tone,
        aiGenerated: true,
      };
    } catch (error) {
      logger.error(`Gemini writing feedback failed: ${error.message}, using fallback`);
      return this.fallbackGenerateWritingFeedback(evaluation, mistakes, submission);
    }
  }

  /**
   * Generate quiz feedback using Gemini AI
   * @param {object} evaluation - The evaluation object
   * @param {array} mistakes - List of detected mistakes
   * @param {object} submission - The submission object
   * @param {string} englishLevel - Student's CEFR level
   */
  async generateQuizFeedback(evaluation, mistakes, submission, englishLevel = 'B1') {
    try {
      // Use Gemini for feedback generation with student level
      const geminiFeedback = await geminiAIService.generateFeedback(
        evaluation,
        mistakes,
        'quiz',
        englishLevel
      );

      return {
        feedbackText: geminiFeedback.feedbackText,
        strengths: geminiFeedback.strengths,
        improvements: geminiFeedback.improvements,
        recommendations: geminiFeedback.recommendations,
        nextSteps: geminiFeedback.nextSteps || '',
        isSummarized: true,
        tone: geminiFeedback.tone,
        aiGenerated: true,
      };
    } catch (error) {
      logger.error(`Gemini quiz feedback failed: ${error.message}, using fallback`);
      return this.fallbackGenerateQuizFeedback(evaluation, mistakes, submission);
    }
  }

  /**
   * Fallback speaking feedback (rule-based)
   */
  fallbackGenerateSpeakingFeedback(evaluation, mistakes, submission) {
    const score = evaluation.overallScore;
    const pronunciation = evaluation.pronunciationScore;
    const vocabulary = evaluation.vocabularyScore;
    const grammar = evaluation.grammarScore;

    const strengths = [];
    const improvements = [];
    const recommendations = [];

    if (pronunciation >= 80) strengths.push('Clear and accurate pronunciation');
    if (vocabulary >= 80) strengths.push('Rich and varied vocabulary usage');
    if (grammar >= 80) strengths.push('Strong grammatical accuracy');
    if (submission.content.duration >= 120)
      strengths.push('Good response length and detail');

    if (pronunciation < 70) {
      improvements.push('Pronunciation clarity needs attention');
      recommendations.push('Practice pronunciation with native speaker recordings');
    }
    if (vocabulary < 70) {
      improvements.push('Vocabulary range could be expanded');
      recommendations.push('Learn and use more advanced vocabulary words');
    }
    if (grammar < 70) {
      improvements.push('Grammar accuracy requires improvement');
      recommendations.push('Review fundamental grammar rules and practice');
    }

    const pronunciationErrors = mistakes.filter((m) => m.errorType === 'pronunciation');
    if (pronunciationErrors.length > 0) {
      const uniqueIssues = [...new Set(pronunciationErrors.map((m) => m.description))];
      improvements.push(...uniqueIssues.slice(0, 2));
    }

    const feedbackText = this.generateFeedbackText(score, {
      type: 'speaking',
      strengths,
      improvements,
      scores: { pronunciation, vocabulary, grammar },
    });

    return {
      feedbackText,
      strengths,
      improvements,
      recommendations,
      isSummarized: false,
      tone: score >= 80 ? 'encouraging' : 'constructive',
    };
  }

  /**
   * Fallback writing feedback (rule-based)
   */
  fallbackGenerateWritingFeedback(evaluation, mistakes, submission) {
    const score = evaluation.overallScore;
    const grammar = evaluation.grammarScore;
    const vocabulary = evaluation.vocabularyScore;
    const structure = evaluation.scoreBreakdown?.structure || 70;

    const strengths = [];
    const improvements = [];
    const recommendations = [];

    if (grammar >= 80) strengths.push('Excellent grammar and sentence structure');
    if (vocabulary >= 80) strengths.push('Sophisticated vocabulary choices');
    if (structure >= 80) strengths.push('Well-organized and coherent writing');
    if (submission.content.wordCount >= 200)
      strengths.push('Comprehensive response with good detail');

    const grammarErrors = mistakes.filter((m) => m.errorType === 'grammar');
    const spellingErrors = mistakes.filter((m) => m.errorType === 'spelling');
    const vocabularyIssues = mistakes.filter((m) => m.errorType === 'vocabulary');

    if (grammarErrors.length > 5) {
      improvements.push(`Grammar: ${grammarErrors.length} errors detected`);
      recommendations.push('Review grammar fundamentals, especially verb tenses and agreement');
    }

    if (spellingErrors.length > 3) {
      improvements.push(`Spelling: ${spellingErrors.length} errors found`);
      recommendations.push('Use spell-check and practice common spelling patterns');
    }

    if (vocabularyIssues.length > 0) {
      improvements.push('Vocabulary variety could be enhanced');
      recommendations.push('Use synonyms to avoid repetition');
    }

    if (submission.content.wordCount < 100) {
      improvements.push('Response is too brief');
      recommendations.push('Develop ideas more fully with examples and explanations');
    }

    const feedbackText = this.generateFeedbackText(score, {
      type: 'writing',
      strengths,
      improvements,
      scores: { grammar, vocabulary, structure },
      mistakeCounts: {
        grammar: grammarErrors.length,
        spelling: spellingErrors.length,
      },
    });

    return {
      feedbackText,
      strengths,
      improvements,
      recommendations,
      isSummarized: false,
      tone: score >= 80 ? 'encouraging' : 'constructive',
    };
  }

  /**
   * Fallback quiz feedback (rule-based)
   */
  fallbackGenerateQuizFeedback(evaluation, mistakes, submission) {
    const score = evaluation.overallScore;
    const breakdown = evaluation.scoreBreakdown;
    const correctAnswers = breakdown.correctAnswers || 0;
    const totalQuestions = breakdown.totalQuestions || 0;
    const incorrectCount = totalQuestions - correctAnswers;

    const strengths = [];
    const improvements = [];
    const recommendations = [];

    if (score >= 90) {
      strengths.push('Excellent overall performance');
      strengths.push('Strong understanding of concepts');
    } else if (score >= 75) {
      strengths.push('Good grasp of most concepts');
    } else if (score >= 60) {
      strengths.push('Fair understanding with room for improvement');
    }

    if (correctAnswers > 0) {
      strengths.push(`Correctly answered ${correctAnswers} out of ${totalQuestions} questions`);
    }

    if (incorrectCount > 0) {
      improvements.push(`${incorrectCount} incorrect ${incorrectCount === 1 ? 'answer' : 'answers'}`);

      if (incorrectCount >= totalQuestions * 0.5) {
        recommendations.push('Review fundamental concepts thoroughly');
        recommendations.push('Practice with similar questions');
      } else if (incorrectCount >= totalQuestions * 0.25) {
        recommendations.push('Focus on areas where mistakes occurred');
        recommendations.push('Clarify misunderstood concepts');
      } else {
        recommendations.push('Review incorrect answers to avoid similar mistakes');
      }
    }

    const feedbackText = this.generateQuizFeedbackText(score, {
      correctAnswers,
      totalQuestions,
      incorrectCount,
      strengths,
      improvements,
    });

    return {
      feedbackText,
      strengths,
      improvements,
      recommendations,
      isSummarized: true,
      tone: score >= 80 ? 'encouraging' : 'constructive',
    };
  }

  /**
   * Generate feedback text (fallback)
   */
  generateFeedbackText(score, details) {
    const { type, strengths, improvements, scores } = details;

    let text = '';

    if (score >= 90) {
      text += 'Outstanding work! ';
    } else if (score >= 80) {
      text += 'Excellent effort! ';
    } else if (score >= 70) {
      text += 'Good work overall. ';
    } else if (score >= 60) {
      text += 'Fair performance with room for growth. ';
    } else {
      text += 'Thank you for your submission. ';
    }

    text += `Your overall score is ${score}/100. `;

    if (strengths.length > 0) {
      text += '\n\nStrengths:\n';
      strengths.forEach((strength) => {
        text += `• ${strength}\n`;
      });
    }

    if (improvements.length > 0) {
      text += '\n\nAreas for Improvement:\n';
      improvements.forEach((improvement) => {
        text += `• ${improvement}\n`;
      });
    }

    if (type === 'speaking') {
      text += '\n\nScore Breakdown:\n';
      text += `• Pronunciation: ${scores.pronunciation}/100\n`;
      text += `• Vocabulary: ${scores.vocabulary}/100\n`;
      text += `• Grammar: ${scores.grammar}/100\n`;
    } else if (type === 'writing') {
      text += '\n\nScore Breakdown:\n';
      text += `• Grammar: ${scores.grammar}/100\n`;
      text += `• Vocabulary: ${scores.vocabulary}/100\n`;
      text += `• Structure: ${scores.structure}/100\n`;

      if (details.mistakeCounts) {
        text += '\n\nError Analysis:\n';
        text += `• Grammar errors: ${details.mistakeCounts.grammar}\n`;
        text += `• Spelling errors: ${details.mistakeCounts.spelling}\n`;
      }
    }

    text += '\n\nKeep practicing and you will continue to improve!';

    return text;
  }

  /**
   * Generate quiz feedback text (fallback)
   */
  generateQuizFeedbackText(score, details) {
    const { correctAnswers, totalQuestions, incorrectCount } = details;

    let text = '';

    if (score >= 90) {
      text += 'Exceptional performance! ';
    } else if (score >= 80) {
      text += 'Great job! ';
    } else if (score >= 70) {
      text += 'Good work! ';
    } else if (score >= 60) {
      text += 'You passed! ';
    } else {
      text += 'Thank you for completing this quiz. ';
    }

    text += `You scored ${score}/100.\n\n`;
    text += `Results: ${correctAnswers} correct out of ${totalQuestions} questions.\n`;

    if (incorrectCount > 0) {
      text += `\nIncorrect answers: ${incorrectCount}\n`;
      text += 'Review the correct answers provided to learn from your mistakes.\n';
    }

    if (score >= 80) {
      text += '\nExcellent understanding of the material. Keep up the great work!';
    } else if (score >= 60) {
      text += '\nYou have a good foundation. Review the topics where you made mistakes.';
    } else {
      text += '\nConsider reviewing the material more thoroughly and trying again.';
    }

    return text;
  }

  /**
   * Summarize existing feedback using Gemini AI
   */
  async summarizeFeedback(feedbackId) {
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    if (feedback.isSummarized) {
      return feedback;
    }

    try {
      // Use Gemini for summarization
      const prompt = `Summarize this feedback in 2-3 sentences, keeping the key strengths and areas for improvement:

${feedback.feedbackText}

Return ONLY the summary text, no JSON.`;

      const result = await geminiAIService.model.generateContent(prompt);
      const summary = result.response.text().trim();

      feedback.feedbackText = summary;
      feedback.isSummarized = true;

      await feedback.save();

      logger.info(`Feedback summarized with Gemini: ${feedback.feedbackId}`);

      return feedback;
    } catch (error) {
      logger.error(`Gemini summarization failed: ${error.message}, using fallback`);

      // Fallback to rule-based summary
      const summary = this.createSummary(feedback.feedbackText, feedback.strengths, feedback.improvements);

      feedback.feedbackText = summary;
      feedback.isSummarized = true;

      await feedback.save();

      return feedback;
    }
  }

  /**
   * Create feedback summary (fallback)
   */
  createSummary(fullText, strengths, improvements) {
    let summary = '';

    if (strengths.length > 0) {
      summary += 'Strengths: ' + strengths.slice(0, 2).join(', ') + '. ';
    }

    if (improvements.length > 0) {
      summary += 'Focus on: ' + improvements.slice(0, 2).join(', ') + '.';
    }

    return summary || fullText;
  }
}

export default new FeedbackGenerationService();
