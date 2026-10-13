const { GoogleGenAI } = require("@google/genai");
const { GEMINI_API_KEY } = require("../../../config/env");
const { handleAIError } = require("../utils/aiErrorHandler");

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// Priority list: Put fastest stable models first, with immediate fallbacks
const MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const askGemini = async (prompt) => {
  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed:`, error.message);
      // Immediately try next model in fallback list without blocking delay
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
      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} structured failed:`, error.message);
      // Immediately try next model in fallback list
    }
  }

  handleAIError(lastError);
};

module.exports = {
  askGemini,
  askGeminiStructured,
};