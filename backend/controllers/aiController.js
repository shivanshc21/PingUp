import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export const replySuggestions = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || messages.length === 0) {
      return res.json({ success: true, suggestions: [] });
    }

    const lastMessage = messages[messages.length - 1].text;

    if (!lastMessage) {
      return res.json({ success: true, suggestions: [] });
    }

    const prompt = `Suggest 3 short, casual replies to the following message. Return ONLY a JSON array of strings with exactly 3 elements. Example: ["reply1", "reply2", "reply3"]

Message: "${lastMessage}"`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    let suggestions = [];
    const content = response.text();

    // Try to parse JSON from the response
    try {
      suggestions = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, try to extract array from text
      const arrayMatch = content.match(/\[.*\]/s);
      if (arrayMatch) {
        suggestions = JSON.parse(arrayMatch[0]);
      } else {
        suggestions = [];
      }
    }

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error("AI Reply Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
