const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const prisma = require("../../../lib/prisma");
const {
  GEMINI_API_KEY,
  AI_PRICE_PER_1M_INPUT_TOKENS,
  AI_PRICE_PER_1M_OUTPUT_TOKENS,
  AI_CALL_TIMEOUT_MS,
} = require("../../../config/env");
const { handleAIError } = require("../utils/aiErrorHandler");

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// Priority list: Put fastest stable models first, with immediate fallbacks
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-latest",
];

/**
 * Deterministically compute cost in USD from input & output tokens.
 * Returns null if pricing environment variables are not explicitly configured.
 */
const calculateCost = ({ promptTokens = 0, completionTokens = 0 }) => {
  if (
    typeof AI_PRICE_PER_1M_INPUT_TOKENS !== "number" ||
    isNaN(AI_PRICE_PER_1M_INPUT_TOKENS) ||
    typeof AI_PRICE_PER_1M_OUTPUT_TOKENS !== "number" ||
    isNaN(AI_PRICE_PER_1M_OUTPUT_TOKENS)
  ) {
    return null;
  }

  const cost =
    (promptTokens / 1_000_000) * AI_PRICE_PER_1M_INPUT_TOKENS +
    (completionTokens / 1_000_000) * AI_PRICE_PER_1M_OUTPUT_TOKENS;

  return Number(cost.toFixed(6));
};

/**
 * Safely persist an AiCallLog entry without bubbling logging errors
 */
const logAiCall = async (logData) => {
  try {
    await prisma.aiCallLog.create({
      data: {
        userId: logData.userId || null,
        agent: logData.agentName || "unknown",
        model: logData.model || "unknown",
        promptTokens: logData.promptTokens || 0,
        completionTokens: logData.completionTokens || 0,
        totalTokens: logData.totalTokens || 0,
        latencyMs: logData.latencyMs || 0,
        success: logData.success !== false,
        errorType: logData.errorType || null,
        retries: logData.retries || 0,
      },
    });
  } catch (err) {
    console.warn("[AiCallLog] Failed to persist call metric:", err.message);
  }
};

/**
 * CENTRAL GEMINI WRAPPER
 * 
 * Supports:
 * - Native structured outputs (responseMimeType: application/json + responseSchema)
 * - Zod validation with up to 2 automated retries on schema violations
 * - Latency & token usage measurement (usageMetadata)
 * - Per-call timeout enforcement
 * - Observability logging into AiCallLog (successes and failures)
 */
const callGemini = async ({
  agentName = "default",
  model,
  contents,
  systemInstruction,
  responseSchema,
  zodSchema,
  userId,
  tools,
  temperature = 0,
  timeoutMs = AI_CALL_TIMEOUT_MS || 20000,
  maxRetries = 2,
  clientOverride, // Allows injecting mock in unit tests
}) => {
  const client = clientOverride || ai;
  const startTime = Date.now();
  let retries = 0;
  let lastError = null;
  let activeContents = contents;

  // Prepare schema config
  let activeSchema = responseSchema;
  if (!activeSchema && zodSchema) {
    activeSchema = z.toJSONSchema(zodSchema);
    // Remove top-level $schema for clean SDK ingestion
    if (activeSchema && activeSchema.$schema) {
      delete activeSchema.$schema;
    }
  }

  const config = {
    temperature,
  };

  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  if (tools) {
    config.tools = tools;
  }

  if (activeSchema || zodSchema) {
    config.responseMimeType = "application/json";
    config.responseSchema = activeSchema;
  }

  const candidateModels = model ? [model, ...MODELS.filter((m) => m !== model)] : MODELS;

  // Validation & Retry Loop
  while (retries <= maxRetries) {
    let callSucceeded = false;
    let responseText = null;
    let parsedData = null;
    let usedModel = candidateModels[0];
    let usageMetadata = null;
    let rawResponse = null;

    for (const m of candidateModels) {
      usedModel = m;
      try {
        const callPromise = client.models.generateContent({
          model: m,
          contents: activeContents,
          config,
        });

        // Enforce per-call timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            const err = new Error(`AI call timed out after ${timeoutMs}ms (agent: ${agentName})`);
            err.name = "TimeoutError";
            reject(err);
          }, timeoutMs);
        });

        const response = await Promise.race([callPromise, timeoutPromise]);
        rawResponse = response;

        if (response) {
          responseText = response.text || "";
          usageMetadata = response.usageMetadata || null;
          callSucceeded = true;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[GeminiWrapper] Model ${m} failed for ${agentName}:`, err.message);
      }
    }

    if (!callSucceeded) {
      const latencyMs = Date.now() - startTime;
      await logAiCall({
        userId,
        agentName,
        model: usedModel,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        success: false,
        errorType: lastError?.name || "AI_CALL_FAILED",
        retries,
      });

      handleAIError(lastError);
    }

    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const completionTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || promptTokens + completionTokens;

    // If no Zod schema was provided, return text / raw response immediately
    if (!zodSchema) {
      const latencyMs = Date.now() - startTime;
      await logAiCall({
        userId,
        agentName,
        model: usedModel,
        promptTokens,
        completionTokens,
        totalTokens,
        latencyMs,
        success: true,
        retries,
      });

      return {
        text: responseText,
        raw: rawResponse,
        promptTokens,
        completionTokens,
        totalTokens,
        latencyMs,
      };
    }

    // Parse JSON
    try {
      const cleaned = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      parsedData = JSON.parse(cleaned);
    } catch (parseErr) {
      lastError = new Error(`JSON parse error: ${parseErr.message}`);
      lastError.name = "JsonParseError";
    }

    // Validate with Zod
    if (parsedData !== null) {
      const validation = zodSchema.safeParse(parsedData);
      if (validation.success) {
        const latencyMs = Date.now() - startTime;
        await logAiCall({
          userId,
          agentName,
          model: usedModel,
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
          success: true,
          retries,
        });

        return {
          data: validation.data,
          text: responseText,
          raw: rawResponse,
          promptTokens,
          completionTokens,
          totalTokens,
          latencyMs,
          retries,
        };
      }
      lastError = new Error(`Schema validation error: ${validation.error.message}`);
      lastError.name = "ZodValidationError";
    }

    // Validation failed: prepare retry feedback
    retries++;
    if (retries <= maxRetries) {
      const feedback = `\n\n[Schema Validation Failure]: ${lastError.message}\nPlease fix all schema errors and return strictly valid JSON matching the required schema.`;
      if (typeof activeContents === "string") {
        activeContents = activeContents + feedback;
      } else if (Array.isArray(activeContents)) {
        activeContents = [
          ...activeContents,
          { role: "user", parts: [{ text: feedback }] },
        ];
      } else if (activeContents && typeof activeContents === "object") {
        activeContents = {
          ...activeContents,
          parts: [...(activeContents.parts || []), { text: feedback }],
        };
      }
    }
  }

  // Max retries exceeded
  const latencyMs = Date.now() - startTime;
  await logAiCall({
    userId,
    agentName,
    model: candidateModels[0],
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    latencyMs,
    success: false,
    errorType: lastError?.name || "MAX_RETRIES_EXCEEDED",
    retries: maxRetries,
  });

  handleAIError(lastError);
};

/**
 * Legacy backwards-compatible helpers
 */
const askGemini = async (prompt, userId) => {
  const result = await callGemini({
    agentName: "legacy_ask",
    contents: prompt,
    userId,
  });
  return result.text;
};

const askGeminiStructured = async ({ contents, jsonMode = true, temperature = 0, userId }) => {
  const result = await callGemini({
    agentName: "legacy_structured",
    contents,
    temperature,
    userId,
  });
  return result.text;
};

/**
 * Generate vector embeddings for text using the official Gemini embeddings API.
 * Automatically logs token usage and latency to AiCallLog for observability.
 */
const embedText = async ({ text, model = "text-embedding-004", userId = null }) => {
  const startTime = Date.now();
  let embedding = [];
  let error = null;

  try {
    const res = await ai.models.embedContent({
      model,
      contents: text,
    });
    embedding = res.embeddings?.[0]?.values || res.embedding?.values || [];
  } catch (err) {
    error = err;
    console.error(`[GeminiWrapper] embedContent failed for model ${model}:`, err.message);
  }

  const latencyMs = Date.now() - startTime;
  const tokenEst = Math.ceil((text || "").length / 4);

  await logAiCall({
    userId,
    agentName: "tax_embeddings",
    model,
    promptTokens: tokenEst,
    completionTokens: 0,
    totalTokens: tokenEst,
    latencyMs,
    success: !error,
    errorType: error ? error.name || "EMBEDDING_FAILED" : null,
    retries: 0,
  }).catch(() => {});

  if (error) {
    throw error;
  }

  return embedding;
};

module.exports = {
  ai,
  callGemini,
  embedText,
  askGemini,
  askGeminiStructured,
  calculateCost,
  logAiCall,
  MODELS,
};