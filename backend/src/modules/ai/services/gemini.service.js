const { GoogleGenAI } = require("@google/genai");
const { GEMINI_API_KEY } = require("../../../config/env");
const { handleAIError } = require("../utils/aiErrorHandler");

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const askGemini = async (prompt) => {
  let lastError = null;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed, trying next fallback...`, error.message);
    }
  }
  handleAIError(lastError);
};

/**
 * Call Gemini with structured content (inline data like PDF parts, text instructions)
 * and optional temperature & JSON response format with automated resilient fallback.
 */
const askGeminiStructured = async ({ contents, jsonMode = true, temperature = 0 }) => {
  const config = {
    temperature,
  };
  if (jsonMode) {
    config.responseMimeType = "application/json";
  }

  let lastError = null;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      return response.text;
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed in structured call, trying next fallback...`, error.message);
    }
  }
  handleAIError(lastError);
};

module.exports = {
  askGemini,
  askGeminiStructured,
};