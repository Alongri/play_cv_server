const { OpenAI } = require("openai");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function determineJobPreference(req, res, next) {
  try {
    const { questionsAndAnswers } = req.body;

    if (!questionsAndAnswers || questionsAndAnswers.length === 0) {
      return res.status(400).json({ message: "Questions and Answers are required." });
    }

    // Construct the OpenAI prompt with a strict requirement for plain string output
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a career advisor. Based on the given array of questions and answers, return only the most suitable job title(s) for the user as a plain string. 
                    Each job title should have a maximum of two words. 
                    If two suitable job titles are recommended, separate them with a comma. Do not include any additional text, explanations, or formatting—return only the job title(s) as a plain string.`,
        },
        {
          role: "user",
          content: `Here is the array of questions and answers: ${JSON.stringify(
            questionsAndAnswers
          )}`,
        },
      ],
    });

    // Get the raw response (should be a plain string)
    const jobPreference = response.choices[0].message.content.trim();

    console.log("Job Preference Response:", jobPreference);  // Optional: For debugging
    req.jobPreference = jobPreference;  // Attach to the request object
    next();  // Proceed to the next middleware or final response
  } catch (error) {
    console.error("Error determining job preference:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { determineJobPreference };

