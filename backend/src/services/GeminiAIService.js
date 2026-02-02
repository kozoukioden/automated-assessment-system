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
    // Use gemma-3-4b-it - works without quota restrictions
    this.model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });
  }

  /**
   * FR5: AI Evaluation - Score submission using Gemini
   * @param {string} content - The submission content
   * @param {string} contentType - Type of content (speaking, writing, quiz)
   * @param {object} rubric - Optional rubric for evaluation
   * @param {string} englishLevel - Student's CEFR level (A1, A2, B1, B2, C1, C2)
   */
  async evaluateSubmission(content, contentType, rubric = null, englishLevel = 'B1') {
    try {
      const prompt = this.buildEvaluationPrompt(content, contentType, rubric, englishLevel);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const evaluation = this.parseEvaluationResponse(response, contentType);

      logger.info(`Gemini evaluation completed for ${contentType} submission (${englishLevel} level)`);
      return evaluation;
    } catch (error) {
      logger.error(`Gemini evaluation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * FR6: Mistakes Identification - Detect errors using Gemini
   * @param {string} content - The submission content
   * @param {string} contentType - Type of content
   * @param {string} englishLevel - Student's CEFR level
   */
  async detectMistakes(content, contentType, englishLevel = 'B1') {
    try {
      const prompt = this.buildMistakesPrompt(content, contentType, englishLevel);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const mistakes = this.parseMistakesResponse(response);

      logger.info(`Gemini detected ${mistakes.length} mistakes in ${contentType} submission (${englishLevel} level)`);
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
   * @param {object} evaluation - The evaluation results
   * @param {array} mistakes - List of detected mistakes
   * @param {string} contentType - Type of content
   * @param {string} englishLevel - Student's CEFR level
   */
  async generateFeedback(evaluation, mistakes, contentType, englishLevel = 'B1') {
    try {
      const prompt = this.buildFeedbackPrompt(evaluation, mistakes, contentType, englishLevel);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const feedback = this.parseFeedbackResponse(response);

      logger.info(`Gemini generated feedback for ${contentType} submission (${englishLevel} level)`);
      return feedback;
    } catch (error) {
      logger.error(`Gemini feedback generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate quiz questions based on student level and topic
   */
  async generateQuestions(activityType, englishLevel, topic, questionCount = 5) {
    try {
      const prompt = this.buildQuestionsPrompt(activityType, englishLevel, topic, questionCount);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const questions = this.parseQuestionsResponse(response, activityType);

      logger.info(`Gemini generated ${questions.length} ${activityType} questions for ${englishLevel} level`);
      return questions;
    } catch (error) {
      logger.error(`Gemini question generation error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate writing/speaking prompt based on student level
   */
  async generateActivityPrompt(activityType, englishLevel, topic) {
    try {
      const prompt = this.buildActivityPromptGeneration(activityType, englishLevel, topic);

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const generatedPrompt = this.parseActivityPromptResponse(response);

      logger.info(`Gemini generated ${activityType} prompt for ${englishLevel} level`);
      return generatedPrompt;
    } catch (error) {
      logger.error(`Gemini prompt generation error: ${error.message}`);
      throw error;
    }
  }

  // ========== Prompt Builders ==========

  buildEvaluationPrompt(content, contentType, rubric, englishLevel = 'B1') {
    let rubricText = '';
    if (rubric && rubric.criteria) {
      rubricText = rubric.criteria.map(c =>
        `- ${c.name} (weight: ${c.weight}): ${c.description}`
      ).join('\n');
    }

    // CEFR level expectations for evaluation
    const levelExpectations = {
      A1: {
        grammar: 'Basic sentence structures, present simple tense, simple subject-verb agreement',
        vocabulary: 'Very basic vocabulary (300-500 words), familiar everyday expressions',
        structure: 'Single short sentences, basic connectors (and, but)',
        expectations: 'Can use basic phrases and simple sentences about personal details and immediate needs'
      },
      A2: {
        grammar: 'Present/past simple, basic questions, simple negatives',
        vocabulary: 'Elementary vocabulary (1000-1500 words), common everyday topics',
        structure: 'Simple linked sentences, basic time expressions',
        expectations: 'Can communicate in simple tasks, describe background, immediate environment'
      },
      B1: {
        grammar: 'Various tenses (present perfect, continuous), conditionals, passive voice basics',
        vocabulary: 'Intermediate vocabulary (2500-3000 words), opinions and abstract topics',
        structure: 'Connected paragraphs, clear main points, reasons and explanations',
        expectations: 'Can produce connected text, describe experiences, give reasons for opinions'
      },
      B2: {
        grammar: 'Complex sentences, all tenses, reported speech, modal verbs nuances',
        vocabulary: 'Upper-intermediate vocabulary (4000-5000 words), abstract and specialized topics',
        structure: 'Well-organized arguments, clear logical flow, cohesive devices',
        expectations: 'Can produce clear, detailed text on complex subjects, explain viewpoints'
      },
      C1: {
        grammar: 'Sophisticated structures, nuanced tense usage, complex clauses',
        vocabulary: 'Advanced vocabulary (6000-8000 words), idiomatic expressions, formal register',
        structure: 'Well-structured extended discourse, flexible use of organizational patterns',
        expectations: 'Can produce clear, well-structured text on complex subjects with controlled use of patterns'
      },
      C2: {
        grammar: 'Native-like accuracy and appropriateness, subtle distinctions',
        vocabulary: 'Near-native vocabulary, subtle connotations, specialized terminology',
        structure: 'Sophisticated argumentation, seamless cohesion, stylistic flexibility',
        expectations: 'Can produce clear, smoothly flowing text in an appropriate style with logical structure'
      }
    };

    const levelInfo = levelExpectations[englishLevel] || levelExpectations['B1'];

    return `You are an expert English language evaluator for educational assessments.
You are evaluating a ${englishLevel} CEFR level student's ${contentType} submission.

=== STUDENT'S CEFR LEVEL: ${englishLevel} ===
Expected Grammar: ${levelInfo.grammar}
Expected Vocabulary: ${levelInfo.vocabulary}
Expected Structure: ${levelInfo.structure}
Level Expectations: ${levelInfo.expectations}

IMPORTANT: Evaluate this submission RELATIVE TO the ${englishLevel} level expectations.
- A submission that perfectly meets ${englishLevel} expectations should score 80-90
- A submission that exceeds ${englishLevel} expectations should score 90-100
- A submission that partially meets ${englishLevel} expectations should score 60-80
- A submission below ${englishLevel} expectations should score below 60

=== SUBMISSION ===
${content}

=== RUBRIC CRITERIA ===
${rubricText || 'Use standard language assessment criteria adjusted for ' + englishLevel + ' level: grammar, vocabulary, structure, clarity'}

=== TASK ===
Provide a detailed evaluation considering the student's ${englishLevel} level.
Be encouraging but honest. Identify specific strengths and areas for improvement.

Return ONLY valid JSON (no markdown, no code blocks):

{
  "overallScore": <number 0-100>,
  "grammarScore": <number 0-100>,
  "vocabularyScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "clarityScore": <number 0-100>,
  "confidence": <number 0.0-1.0>,
  "reasoning": "<detailed explanation including: what the student did well for their level, specific mistakes made, and what they should focus on to improve>"
}`;
  }

  buildMistakesPrompt(content, contentType, englishLevel = 'B1') {
    const levelContext = {
      A1: 'Focus on basic errors: subject-verb agreement, basic word order, very common vocabulary mistakes',
      A2: 'Focus on elementary errors: simple tense usage, basic prepositions, common spelling mistakes',
      B1: 'Focus on intermediate errors: tense consistency, article usage, connectors, vocabulary precision',
      B2: 'Focus on upper-intermediate errors: complex grammar, collocation errors, register appropriateness',
      C1: 'Focus on advanced errors: nuanced grammar, idiomatic usage, style consistency, subtle vocabulary choices',
      C2: 'Focus on near-native errors: stylistic issues, subtle register shifts, sophisticated vocabulary choices'
    };

    return `You are an expert English language evaluator helping a ${englishLevel} level student improve.
Analyze this ${contentType} submission and identify errors APPROPRIATE to their level.

=== STUDENT LEVEL: ${englishLevel} ===
${levelContext[englishLevel] || levelContext['B1']}

=== SUBMISSION ===
${content}

=== TASK ===
Identify errors that are important for a ${englishLevel} level student to learn from.
- Prioritize errors that are essential at this level
- For each error, explain WHY it's wrong in simple terms the student can understand
- Provide helpful corrections and learning tips

Return ONLY valid JSON (no markdown, no code blocks):

{
  "errors": [
    {
      "type": "<grammar|spelling|vocabulary|punctuation|logic>",
      "severity": "<critical|major|minor>",
      "originalText": "<the exact incorrect text>",
      "correctedText": "<the corrected version>",
      "description": "<clear explanation of the error, appropriate for ${englishLevel} level>",
      "suggestion": "<actionable tip to avoid this mistake in the future>"
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

  buildFeedbackPrompt(evaluation, mistakes, contentType, englishLevel = 'B1') {
    const mistakesSummary = mistakes && mistakes.length > 0
      ? mistakes.map(m => `- ${m.type}: ${m.description}`).join('\n')
      : 'No significant errors detected';

    const levelGuidance = {
      A1: 'Use very simple language. Focus on basic achievements. Keep recommendations simple and achievable.',
      A2: 'Use simple, clear language. Celebrate progress in everyday communication. Give practical tips.',
      B1: 'Use clear language with some complexity. Acknowledge growing independence. Suggest intermediate resources.',
      B2: 'Be more detailed in feedback. Discuss nuances. Recommend advanced practice techniques.',
      C1: 'Provide sophisticated feedback. Discuss subtle improvements. Suggest professional/academic resources.',
      C2: 'Give expert-level feedback. Focus on refinement and style. Recommend mastery-level resources.'
    };

    return `You are a supportive English language teacher providing personalized feedback to a ${englishLevel} level student.

=== STUDENT LEVEL: ${englishLevel} ===
Feedback Guidance: ${levelGuidance[englishLevel] || levelGuidance['B1']}

=== EVALUATION RESULTS ===
Overall Score: ${evaluation.overallScore}/100
Grammar: ${evaluation.grammarScore}/100
Vocabulary: ${evaluation.vocabularyScore}/100
Structure: ${evaluation.structureScore}/100

=== ERRORS FOUND ===
${mistakesSummary}

=== TASK ===
Generate encouraging, constructive feedback for this ${contentType} submission.
IMPORTANT:
- Write feedback that a ${englishLevel} level student can understand
- Be specific about what they did well FOR THEIR LEVEL
- Point out the most important areas for improvement
- Give 3-5 actionable recommendations appropriate for ${englishLevel} level
- If they made mistakes, explain them in a helpful, non-discouraging way

Return ONLY valid JSON (no markdown, no code blocks):

{
  "feedbackText": "<complete personalized feedback message, 150-250 words, written for a ${englishLevel} student>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<clear area for improvement 1>", "<clear area for improvement 2>"],
  "recommendations": ["<specific actionable tip 1>", "<specific actionable tip 2>", "<specific actionable tip 3>"],
  "nextSteps": "<what the student should focus on next to progress from ${englishLevel} level>",
  "tone": "encouraging"
}`;
  }

  buildQuestionsPrompt(activityType, englishLevel, topic, questionCount) {
    const levelDescriptions = {
      A1: 'absolute beginner with very basic vocabulary (300-500 words), present simple tense only',
      A2: 'elementary level with simple sentence structures, present and past simple',
      B1: 'intermediate with everyday vocabulary, various tenses, can express opinions',
      B2: 'upper-intermediate with complex sentences, abstract topics, clear argumentation',
      C1: 'advanced with sophisticated vocabulary, nuanced opinions, idiomatic expressions',
      C2: 'proficient with native-like expressions, subtle meanings, academic register'
    };

    if (activityType === 'quiz') {
      return `You are an expert English language teacher creating quiz questions.

=== PARAMETERS ===
Student Level: ${englishLevel} (${levelDescriptions[englishLevel] || 'intermediate level'})
Topic: ${topic}
Number of Questions: ${questionCount}

=== TASK ===
Generate ${questionCount} multiple-choice questions appropriate for a ${englishLevel} level student.
Each question must have exactly 4 options with only one correct answer.

Requirements:
- Vocabulary and grammar MUST match ${englishLevel} CEFR level
- Questions should test understanding, not trick the student
- Options should be plausible but clearly distinguishable
- Include a mix of vocabulary, grammar, and comprehension questions

Return ONLY valid JSON (no markdown, no code blocks):

{
  "questions": [
    {
      "questionText": "<clear question>",
      "questionType": "multiple-choice",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctAnswer": "<exact text of correct option>",
      "points": 1,
      "explanation": "<why this answer is correct>"
    }
  ]
}`;
    } else {
      // For speaking/writing - generate guiding questions
      return `You are an expert English language teacher creating ${activityType} activity prompts.

=== PARAMETERS ===
Student Level: ${englishLevel} (${levelDescriptions[englishLevel] || 'intermediate level'})
Topic: ${topic}
Activity Type: ${activityType}

=== TASK ===
Generate a ${activityType} prompt with guiding questions appropriate for a ${englishLevel} level student.

Requirements:
- Main prompt must be clear and achievable at ${englishLevel} level
- Include 3-4 guiding questions to help structure the response
- Provide helpful vocabulary hints
- Specify expected length/duration

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompt": "<main task/topic for the student>",
  "instructions": "<clear instructions on what to do>",
  "guideQuestions": ["<helpful question 1>", "<helpful question 2>", "<helpful question 3>"],
  "vocabularyHints": ["<useful word/phrase 1>", "<useful word/phrase 2>", "<useful word/phrase 3>"],
  "expectedLength": "${activityType === 'speaking' ? '1-2 minutes of speaking' : '150-250 words'}"
}`;
    }
  }

  buildActivityPromptGeneration(activityType, englishLevel, topic) {
    const levelGuidelines = {
      A1: 'Use only present simple tense, basic vocabulary (500 most common words), short simple sentences',
      A2: 'Use present and past simple, familiar topics, simple connectors (and, but, because)',
      B1: 'Include various tenses, opinions and reasons, coherent paragraphs',
      B2: 'Complex sentences, abstract topics, clear argumentation, idiomatic expressions',
      C1: 'Sophisticated vocabulary, nuanced opinions, formal register options',
      C2: 'Native-level complexity, subtle meanings, academic or professional register'
    };

    return `You are an expert English teacher creating a ${activityType} prompt for a ${englishLevel} English learner.

=== PARAMETERS ===
Activity Type: ${activityType}
Student Level: ${englishLevel}
Topic: ${topic}
Level Guidelines: ${levelGuidelines[englishLevel] || 'intermediate level guidelines'}

=== TASK ===
Create an engaging ${activityType} prompt that is appropriate for ${englishLevel} level.

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompt": "<the main prompt/question for the student>",
  "instructions": "<clear instructions on what to do, 2-3 sentences>",
  "guideQuestions": ["<helpful question 1>", "<helpful question 2>", "<helpful question 3>"],
  "vocabularyHints": ["<useful word or phrase 1>", "<useful word or phrase 2>", "<useful word or phrase 3>", "<useful word or phrase 4>"],
  "timeLimit": "${activityType === 'speaking' ? '2 minutes' : '30 minutes'}",
  "expectedLength": "${activityType === 'speaking' ? '1-2 minutes of speaking' : '150-250 words'}",
  "tips": ["<helpful tip 1>", "<helpful tip 2>"]
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
        aiModel: 'gemma-3-4b-it'
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
        aiModel: 'gemma-3-4b-it'
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
        nextSteps: parsed.nextSteps || '',
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
        nextSteps: 'Focus on consistent practice and review your common mistakes.',
        tone: 'encouraging',
        aiGenerated: true
      };
    }
  }

  parseQuestionsResponse(response, activityType) {
    try {
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      if (activityType === 'quiz') {
        return (parsed.questions || []).map((q, index) => ({
          questionText: q.questionText || `Question ${index + 1}`,
          questionType: q.questionType || 'multiple-choice',
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.correctAnswer || q.options?.[0] || 'Option A',
          points: q.points || 1,
          explanation: q.explanation || '',
          aiGenerated: true
        }));
      } else {
        return {
          prompt: parsed.prompt || 'Describe your thoughts on this topic.',
          instructions: parsed.instructions || 'Express your ideas clearly.',
          guideQuestions: parsed.guideQuestions || [],
          vocabularyHints: parsed.vocabularyHints || [],
          expectedLength: parsed.expectedLength || '',
          aiGenerated: true
        };
      }
    } catch (error) {
      logger.error(`Failed to parse Gemini questions response: ${error.message}`);
      if (activityType === 'quiz') {
        return [];
      }
      return {
        prompt: 'Describe your thoughts on this topic.',
        instructions: 'Express your ideas clearly and use appropriate vocabulary.',
        guideQuestions: [],
        vocabularyHints: [],
        expectedLength: activityType === 'speaking' ? '1-2 minutes' : '150-250 words',
        aiGenerated: true
      };
    }
  }

  parseActivityPromptResponse(response) {
    try {
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      return {
        prompt: parsed.prompt || 'Describe your thoughts on this topic.',
        instructions: parsed.instructions || 'Express your ideas clearly.',
        guideQuestions: parsed.guideQuestions || [],
        vocabularyHints: parsed.vocabularyHints || [],
        timeLimit: parsed.timeLimit || '',
        expectedLength: parsed.expectedLength || '',
        tips: parsed.tips || [],
        aiGenerated: true
      };
    } catch (error) {
      logger.error(`Failed to parse Gemini activity prompt response: ${error.message}`);
      return {
        prompt: 'Write about your experiences and opinions on this topic.',
        instructions: 'Express your ideas clearly and use appropriate vocabulary.',
        guideQuestions: ['What is your main opinion?', 'Why do you think this?', 'Can you give an example?'],
        vocabularyHints: [],
        expectedLength: '150-250 words',
        tips: ['Plan before you write', 'Check your grammar'],
        aiGenerated: true
      };
    }
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();
export default GeminiAIService;
