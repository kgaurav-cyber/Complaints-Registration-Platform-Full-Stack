const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateFollowUpQuestion = async (complaintText) => {
  try {
    const prompt = `Based on the following complaint, generate exactly one short, relevant follow-up question that would help gather more specific details from the user. Only output the question, nothing else.\n\nComplaint: "${complaintText}"`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating AI question:", error);
    return "Could you please provide more details about the issue?";
  }
};

module.exports = { generateFollowUpQuestion };
