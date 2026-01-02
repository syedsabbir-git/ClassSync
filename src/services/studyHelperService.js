// src/services/studyHelperService.js
import axios from 'axios';

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate AI quiz questions based on task topic
 * @param {string} taskTitle - The quiz/task title
 * @param {string} taskDescription - Task description for context
 * @param {string} questionType - 'mcq' or 'short'
 * @param {string} userContext - Optional user-provided context
 */
const generateQuiz = async (taskTitle, taskDescription, questionType, userContext = '') => {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    console.log('🎯 Generating quiz with Groq AI...');
    console.log('📝 Topic:', taskTitle);
    console.log('📋 Type:', questionType);

    const contextPrompt = userContext ? `\n\nAdditional Context from Student:\n${userContext}` : '';

    let prompt = '';
    
    if (questionType === 'mcq') {
      prompt = `You are an expert quiz creator. Generate 15 multiple-choice questions based on the following topic.

Topic: ${taskTitle}
Description: ${taskDescription}${contextPrompt}

Generate a JSON response with EXACTLY this structure (no markdown, pure JSON):
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation why this is correct and others are wrong"
    }
  ]
}

Requirements:
- Generate exactly 15 MCQ questions
- Each question should have 4 options
- correctAnswer is the index (0-3) of the correct option
- Questions should range from easy to difficult
- Include clear explanations
- Return ONLY valid JSON, no other text`;
    } else {
      prompt = `You are an expert quiz creator. Generate 3 short answer questions (5 marks each) based on the following topic.

Topic: ${taskTitle}
Description: ${taskDescription}${contextPrompt}

Generate a JSON response with EXACTLY this structure (no markdown, pure JSON):
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "marks": 5,
      "sampleAnswer": "A comprehensive sample answer that would earn full marks",
      "markingCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"]
    }
  ]
}

Requirements:
- Generate exactly 3 short answer questions
- Each question worth 5 marks
- Provide detailed sample answers
- Include marking criteria for each question
- Questions should test understanding, not just recall
- Return ONLY valid JSON, no other text`;
    }

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Groq API response:', response.status);

    const textContent = response.data.choices?.[0]?.message?.content;
    if (!textContent) {
      throw new Error('No content in Groq response');
    }

    // Parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Response text:', textContent);
      throw new Error('Could not extract JSON from Groq response');
    }

    const quizData = JSON.parse(jsonMatch[0]);
    console.log('✅ Generated quiz with', quizData.questions?.length, 'questions');
    
    return quizData;
  } catch (error) {
    console.error('❌ Error generating quiz:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

/**
 * Grade short answer questions using AI
 * @param {Array} questions - Array of question objects
 * @param {Array} answers - Array of student answers
 */
const gradeShortAnswers = async (questions, answers) => {
  try {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    console.log('🎓 Grading short answers with AI...');

    const gradingPrompt = `You are a STRICT university examiner grading exam papers. You must be very critical and only award marks for correct, relevant answers.

CRITICAL GRADING RULES:
1. Award 0 marks for: empty answers, nonsense text, random letters/words, completely wrong answers
2. Award 1-2 marks for: barely relevant answers with major missing content
3. Award 3 marks for: partially correct answers with some key points but missing important details
4. Award 4 marks for: good answers with most key points covered
5. Award 5 marks ONLY for: excellent answers covering all marking criteria comprehensively

${questions.map((q, idx) => `
Question ${idx + 1} (${q.marks} marks): ${q.question}

SAMPLE ANSWER (for reference): ${q.sampleAnswer}

MARKING CRITERIA (all must be addressed):
${q.markingCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

STUDENT'S ANSWER: ${answers[idx] || '(No answer provided)'}

GRADE THIS ANSWER STRICTLY:
- If the answer is nonsense, random text, or completely wrong → 0 marks
- If the answer doesn't address the marking criteria → maximum 1 mark
- Check if student's answer covers each marking criterion
- Be very strict - don't award marks for vague or incomplete answers
`).join('\n')}

Provide grades with EXACTLY this JSON structure (no markdown, pure JSON):
{
  "results": [
    {
      "questionId": 1,
      "marksAwarded": 0,
      "totalMarks": 5,
      "feedback": "Detailed explanation: Why marks were awarded or deducted. List what was missing from the marking criteria."
    }
  ],
  "totalScore": 0,
  "totalPossible": 15,
  "overallFeedback": "Overall assessment of student's understanding and performance"
}

IMPORTANT: Be VERY STRICT. If an answer is nonsense or wrong, give 0 marks. Only award full marks for truly excellent answers.`;

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: gradingPrompt }],
      temperature: 0.3,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const textContent = response.data.choices?.[0]?.message?.content;
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not extract grading JSON');
    }

    const gradingResults = JSON.parse(jsonMatch[0]);
    console.log('✅ Grading complete:', gradingResults);
    
    return gradingResults;
  } catch (error) {
    console.error('❌ Error grading answers:', error.message);
    throw error;
  }
};

const studyHelperService = {
  generateQuiz,
  gradeShortAnswers
};

export default studyHelperService;
