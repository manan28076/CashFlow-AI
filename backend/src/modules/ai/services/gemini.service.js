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

/**
 * Call Gemini with structured content (inline data like PDF parts, text instructions)
 * and optional temperature & JSON response format.
 */
const askGeminiStructured = async ({ contents, jsonMode = true, temperature = 0 }) => {
  try {
    const config = {
      temperature,
    };
    if (jsonMode) {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents,
      config,
    });

    return response.text;
  } catch (error) {
    handleAIError(error);
  }
};

module.exports = {
  askGemini,
  askGeminiStructured,
};