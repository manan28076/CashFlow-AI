const { GoogleGenAI } = require("@google/genai");
const { GEMINI_API_KEY } = require("../../../config/env");
const { handleAIError } = require("../utils/aiErrorHandler");

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const askGemini = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    handleAIError(error);
  }
};

module.exports = {
  askGemini,
};