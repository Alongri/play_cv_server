const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @param {Array} questionsAndAnswers - array of {question, answer}
 * @returns {Promise<Object>} - parsed analysis JSON object
 */
async function analyzeCandidatePersonality(questionsAndAnswers) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
You are a professional hiring assistant and behavioral analyst. Based on the following candidate's responses to personality interview questions, analyze their personality and behavior style.

Return the result in the following **strict JSON format** only:
{
  "summary": "Short paragraph summarizing the candidate's personality and behavior style do it in 3 lines.",
  "traits": {
    "confidence": 1-5,
    "teamwork": 1-5,
    "emotionalIntelligence": 1-5,
    "adaptability": 1-5,
    "initiative": 1-5,
    "culturalFit": 1-5
  },
  "strengths": ["Bullet point", "Bullet point"],
  "improvementAreas": ["Bullet point", "Bullet point"],
  "overallRecommendation": "Proceed to next stage / Needs follow-up / Not recommended"
}

Only return valid JSON. Do not include any commentary or extra formatting.
          `,
        },
        {
          role: "user",
          content: `Here is the array of questions and answers: ${JSON.stringify(
            questionsAndAnswers
          )}`,
        },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error("❌ Error in analyzeCandidatePersonality:", error.message);
    throw new Error("Failed to analyze personality.");
  }
}

module.exports = { analyzeCandidatePersonality };
