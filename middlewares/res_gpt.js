const { OpenAI } = require("openai");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function determineJobPreference(questionsAndAnswers) {
  try {
    // const { questionsAndAnswers } = req.body;

    if (!questionsAndAnswers || questionsAndAnswers.length === 0) {
      return res
        .status(400)
        .json({ message: "Questions and Answers are required." });
    }

    // Construct the OpenAI prompt with a strict requirement for plain string output
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a career advisor. Based on the given array of questions and answers, return up to three most suitable job title(s) for the user.
                    - Each job title must be up to **three words**.
                    - If the provided answers lack clarity, advise on the closest relevant roles you believe may be suitable for the user based on his/her list of answers.
                    - Return the response in this exact format:  
                      **"the suitable job suggestion is: [Job Title]"**  
                    - If multiple job titles are suitable, separate them with commas.
                    - Do not include explanations, formatting, or extra text—only the specified response.`,
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

    console.log("Job Preference Response:", jobPreference); // Optional: For debugging
    return jobPreference; // Attach to the request object
    // next();  // Proceed to the next middleware or final response
  } catch (error) {
    console.error("Error determining job preference:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { determineJobPreference };
