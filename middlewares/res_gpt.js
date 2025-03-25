const { OpenAI } = require("openai");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function determineJobPreference(questionsAndAnswers) {
  try {

    if (!questionsAndAnswers || questionsAndAnswers.length === 0) {
      return res
        .status(400)
        .json({ message: "Questions and Answers are required." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert career advisor. Your task is to analyze the given array of questions and answers and determine the most suitable job title(s) for the user, even if the data is incomplete or ambiguous.
    
          **Guidelines:**
          - Identify up to **three** highly relevant job titles based strictly on the user's answers.
          - Each job title must be **clear, relevant, and limited to three words**.
          - If the answers suggest multiple strong matches, list them all (up to three).
          - If the answers are vague or unclear, **infer the closest relevant roles** based on general skills and industry trends.
          - Even if no perfect match exists, always provide the most fitting job title(s) based on the available data.
          - Your response must strictly follow this format (without extra explanations or text):
            **"The most suitable job suggestion(s) is/are: [Job Title 1], [Job Title 2], [Job Title 3]"**.
          - If only one or two job titles are relevant, list only those.
          - Never state that no suitable match was found. If needed, suggest broad career paths that align with general skill sets.
    
          **Example Outputs:**
          - "The most suitable job suggestion(s) is/are: Software Engineer, Data Analyst, UX Designer"
          - "The most suitable job suggestion(s) is/are: Marketing Coordinator"
          - "The most suitable job suggestion(s) is/are: Sales Manager, Business Consultant"
    
          **Restrictions:**
          - Do not include explanations, extra formatting, or additional details.
          - Only return the job title(s) in the exact specified format.`,
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
