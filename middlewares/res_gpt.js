const { OpenAI } = require("openai");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function determineJobPreference(req, res, next) {
  try {
    const { questionsAndAnswers } = req.body;  // Assuming you're passing it from the `/gpt` route

    if (!questionsAndAnswers || questionsAndAnswers.length === 0) {
      return res.status(400).json({ message: "Questions and Answers are required." });
    }

    // Construct the OpenAI prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a career advisor. Based on the given array of questions and answers, determine the best job preference or profession for the user. Return the name of the profession as a JSON response in the following format: { "preferred_profession": "profession_name" }.`,
        },
        {
          role: "user",
          content: `Here is the array of questions and answers: ${JSON.stringify(
            questionsAndAnswers
          )}`,
        },
      ],
    });

    const rawResponse = response.choices[0].message.content.trim();
    let jobPreference;

    try {
      jobPreference = JSON.parse(rawResponse);
    } catch (error) {
      console.error("Error parsing job preference response:", error.message);
      return res.status(500).json({
        message: "Error parsing job preference. Please review the response.",
        rawResponse,
      });
    }

    // Attach the job preference to the request object for further use
    req.jobPreference = jobPreference;
    next();  // Move to the next middleware or final response handler
  } catch (error) {
    console.error("Error determining job preference:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { determineJobPreference };
