const { GoogleGenAI } = require("@google/genai");
const { GEMINI_API_KEY } = require("../../../config/env");
const { handleAIError } = require("../utils/aiErrorHandler");

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// Priority list: Put stable models first, with fast fallbacks
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const askGemini = async (prompt) => {
  let lastError = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
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
        console.warn(`Model ${model} (attempt ${attempt + 1}) failed:`, error.message);

        // If 503 (high demand) or 429 (rate limit), pause briefly before retry
        const isBusy =
          error?.status === 503 ||
          error?.message?.includes("503") ||
          error?.message?.includes("high demand") ||
          error?.status === 429;

        if (isBusy && attempt === 0) {
          await sleep(600);
        } else {
          break; // Switch to next model
        }
      }
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
    for (let attempt = 0; attempt < 2; attempt++) {
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
        console.warn(`Model ${model} structured (attempt ${attempt + 1}) failed:`, error.message);

        const isBusy =
          error?.status === 503 ||
          error?.message?.includes("503") ||
          error?.message?.includes("high demand") ||
          error?.status === 429;

        if (isBusy && attempt === 0) {
          await sleep(600);
        } else {
          break;
        }
      }
    }
  }

  handleAIError(lastError);
};

module.exports = {
  askGemini,
  askGeminiStructured,
};