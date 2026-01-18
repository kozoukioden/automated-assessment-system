import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * GeminiAIService - Integrates Google Gemini AI for evaluation
 * Implements FR5, FR6, FR7, FR8
 */
class GeminiAIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * FR5: AI Evaluation - Score submission using Gemini
   */
  async evaluateSubmission(content, contentType, rubric = null) {
    try {
      const prompt = this.buildEvaluationPrompt(content, contentType, rubric);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const evaluation = this.parseEvaluationResponse(response, contentType);

      logger.info(`Gemini evaluation completed for ${contentType} submission`);
      return evaluation;
    } catch (error) {
      logger.error(`Gemini evaluation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * FR6: Mistakes Identification - Detect errors using Gemini
   */
  async detectMistakes(content, contentType) {
    try {
      const prompt = this.buildMistakesPrompt(content, contentType);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const mistakes = this.parseMistakesResponse(response);

      logger.info(`Gemini detected ${mistakes.length} mistakes in ${contentType} submission`);
      return mistakes;
    } catch (error) {
      logger.error(`Gemini mistakes detection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * FR7: Challenge Detection - Analyze recurring patterns using Gemini
   */
  async detectChallenges(submissions) {
    try {
      const prompt = this.buildChallengesPrompt(submissions);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const challenges = this.parseChallengesResponse(response);

      logger.info(`Gemini identified ${challenges.length} learning challenges`);
      return challenges;
    } catch (error) {
      logger.error(`Gemini challenge detection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * FR8: Feedback Generation - Generate personalized feedback using Gemini
   */
  async generateFeedback(evaluation, mistakes, contentType) {
    try {
      const prompt = this.buildFeedbackPrompt(evaluation, mistakes, contentType);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const feedback = this.parseFeedbackResponse(response);

      logger.info(`Gemini generated feedback for ${contentType} submission`);
      return feedback;
    } catch (error) {
      logger.error(`Gemini feedback generation error: ${error.message}`);
      throw error;
    }
  }

  // ========== Prompt Builders ==========

  buildEvaluationPrompt(content, contentType, rubric) {
    let rubricText = '';
    if (rubric && rubric.criteria) {
      rubricText = rubric.criteria.map(c =>
        `- ${c.name} (weight: ${c.weight}): ${c.description}`
      ).join('\n');
    }

    return `You are an expert English language evaluator for educational assessments.
Evaluate this student's ${contentType} submission accurately and fairly.

=== SUBMISSION ===
${content}

=== RUBRIC CRITERIA ===
${rubricText || 'Use standard language assessment criteria: grammar, vocabulary, structure, clarity'}

=== TASK ===
Provide a detailed evaluation. Return ONLY valid JSON (no markdown, no code blocks):

{
  "overallScore": <number 0-100>,
  "grammarScore": <number 0-100>,
  "vocabularyScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "clarityScore": <number 0-100>,
  "confidence": <number 0.0-1.0>,
  "reasoning": "<brief explanation of scores>"
}`;
  }

  buildMistakesPrompt(content, contentType) {
    return `You are an expert English language evaluator. Analyze this ${contentType} submission and identify ALL errors.

=== SUBMISSION ===
${content}

=== TASK ===
Identify every grammar, spelling, vocabulary, punctuation, and logic error.
For each error, provide the exact location and a correction.

Return ONLY valid JSON (no markdown, no code blocks):

{
  "errors": [
    {
      "type": "<grammar|spelling|vocabulary|punctuation|logic>",
      "severity": "<critical|major|minor>",
      "originalText": "<the exact incorrect text>",
      "correctedText": "<the corrected version>",
      "description": "<brief explanation of the error>",
      "suggestion": "<how to fix it>"
    }
  ]
}

If there are no errors, return: {"errors": []}`;
  }

  buildChallengesPrompt(submissions) {
    const submissionTexts = submissions.map((sub, i) =>
      `Submission ${i + 1}: ${sub.content || sub.transcript || 'No content'}`
    ).join('\n\n');

    return `You are an expert education analyst. Analyze these ${submissions.length} submissions from the same student to identify recurring learning challenges.

=== STUDENT SUBMISSIONS ===
${submissionTexts}

=== TASK ===
Identify patterns of recurring mistakes, learning difficulties, and knowledge gaps.

Return ONLY valid JSON (no markdown, no code blocks):

{
  "challenges": [
    {
      "type": "<grammar|vocabulary|spelling|punctuation|logic|comprehension>",
      "pattern": "<description of the recurring issue>",
      "frequency": "<how often it appears, e.g., '60%'>",
      "severity": "<high|medium|low>",
      "recommendation": "<specific actionable advice to improve>"
    }
  ]
}

If no clear patterns exist, return: {"challenges": []}`;
  }

  buildFeedbackPrompt(evaluation, mistakes, contentType) {
    const mistakesSummary = mistakes && mistakes.length > 0
      ? mistakes.map(m => `- ${m.type}: ${m.description}`).join('\n')
      : 'No significant errors detected';

    return `You are a supportive English language teacher providing feedback to a student.

=== EVALUATION RESULTS ===
Overall Score: ${evaluation.overallScore}/100
Grammar: ${evaluation.grammarScore}/100
Vocabulary: ${evaluation.vocabularyScore}/100
Structure: ${evaluation.structureScore}/100

=== ERRORS FOUND ===
${mistakesSummary}

=== TASK ===
Generate encouraging, constructive feedback for this ${contentType} submission.
Be specific about strengths and areas for improvement.
Provide 3-5 actionable recommendations.

Return ONLY valid JSON (no markdown, no code blocks):

{
  "feedbackText": "<complete feedback message, 150-250 words>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"],
  "recommendations": ["<specific action 1>", "<specific action 2>", "<specific action 3>"],
  "tone": "<encouraging|constructive>"
}`;
  }

  // ========== Response Parsers ==========

  parseEvaluationResponse(response, contentType) {
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      return {
        overallScore: Math.min(100, Math.max(0, parsed.overallScore || 0)),
        grammarScore: Math.min(100, Math.max(0, parsed.grammarScore || 0)),
        vocabularyScore: Math.min(100, Math.max(0, parsed.vocabularyScore || 0)),
        structureScore: Math.min(100, Math.max(0, parsed.structureScore || 0)),
        clarityScore: Math.min(100, Math.max(0, parsed.clarityScore || 0)),
        pronunciationScore: contentType === 'speaking' ? parsed.pronunciationScore || 70 : null,
        logicScore: contentType === 'quiz' ? parsed.logicScore || 70 : null,
        aiConfidence: Math.min(1, Math.max(0, parsed.confidence || 0.85)),
        reasoning: parsed.reasoning || '',
        aiProvider: 'gemini',
        aiModel: 'gemini-pro'
      };
    } catch (error) {
      logger.error(`Failed to parse Gemini evaluation response: ${error.message}`);
      // Return default scores if parsing fails
      return {
        overallScore: 70,
        grammarScore: 70,
        vocabularyScore: 70,
        structureScore: 70,
        clarityScore: 70,
        aiConfidence: 0.7,
        reasoning: 'Auto-generated evaluation',
        aiProvider: 'gemini',
        aiModel: 'gemini-pro'
      };
    }
  }

  parseMistakesResponse(response) {
    try {
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      return (parsed.errors || []).map((error, index) => ({
        errorType: error.type || 'grammar',
        severity: error.severity || 'minor',
        originalText: error.originalText || '',
        correctedText: error.correctedText || '',
        description: error.description || '',
        suggestion: error.suggestion || '',
        position: index,
        aiGenerated: true
      }));
    } catch (error) {
      logger.error(`Failed to parse Gemini mistakes response: ${error.message}`);
      return [];
    }
  }

  parseChallengesResponse(response) {
    try {
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      return (parsed.challenges || []).map(challenge => ({
        challengeType: challenge.type || 'general',
        pattern: challenge.pattern || '',
        frequency: challenge.frequency || 'unknown',
        severity: challenge.severity || 'medium',
        recommendation: challenge.recommendation || ''
      }));
    } catch (error) {
      logger.error(`Failed to parse Gemini challenges response: ${error.message}`);
      return [];
    }
  }

  parseFeedbackResponse(response) {
    try {
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      return {
        feedbackText: parsed.feedbackText || 'Good effort! Keep practicing.',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        recommendations: parsed.recommendations || [],
        tone: parsed.tone || 'encouraging',
        aiGenerated: true
      };
    } catch (error) {
      logger.error(`Failed to parse Gemini feedback response: ${error.message}`);
      return {
        feedbackText: 'Good effort! Continue practicing to improve your skills.',
        strengths: ['Shows understanding of the topic'],
        improvements: ['Continue practicing regularly'],
        recommendations: ['Review grammar rules', 'Expand vocabulary', 'Practice writing daily'],
        tone: 'encouraging',
        aiGenerated: true
      };
    }
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();
export default GeminiAIService;
