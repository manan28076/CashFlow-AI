const { z } = require("zod");
const { callGemini } = require("../services/gemini.service");
const { categoryPrompt } = require("../prompts/category.prompt");
const { normalizeMerchant } = require("../utils/normalizeMerchant");
const prisma = require("../../../lib/prisma");

const categoryOutputSchema = z.array(
  z.object({
    id: z.number(),
    category: z.string(),
  })
);

/**
 * Category Agent with Merchant Memory & User Corrections
 *
 * 1. Normalize merchant names using deterministic rules.
 * 2. Look up MerchantRule for the user.
 * 3. If rule hits: assign category from memory, increment hitCount, skip LLM.
 * 4. Batch only unknown transactions to Gemini with top 10 user corrections as few-shot examples.
 * 5. Save LLM results as source=LLM rules (never overwriting existing USER rules).
 */
const categoryAgent = async (transactions, categoryNames, userId) => {
  if (!transactions || transactions.length === 0) {
    return {
      categories: [],
      categorizedFromMemory: 0,
      categorizedByLlm: 0,
    };
  }

  // 1. Fetch user rules and recent corrections if userId is present
  let userRules = [];
  let userCorrections = [];
  if (userId) {
    try {
      userRules = await prisma.merchantRule.findMany({
        where: { userId },
        include: { category: true },
      });
      userCorrections = userRules
        .filter((r) => r.source === "USER")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10)
        .map((r) => ({
          merchantKey: r.merchantKey,
          category: r.category.name,
        }));
    } catch (err) {
      console.error("[CategoryAgent] Error fetching merchant rules:", err.message);
    }
  }

  const ruleMap = new Map();
  for (const rule of userRules) {
    ruleMap.set(rule.merchantKey, rule);
  }

  const resolved = [];
  const unknownTransactions = [];
  const hitRuleIds = new Set();
  const txMerchantKeyMap = new Map();

  // 2. Check each transaction against memory
  for (const tx of transactions) {
    const rawMerchant = tx.merchant || tx.description || "";
    const key = normalizeMerchant(rawMerchant);
    txMerchantKeyMap.set(tx.id, key);

    if (key && ruleMap.has(key)) {
      const rule = ruleMap.get(key);
      resolved.push({
        id: tx.id,
        category: rule.category.name,
        fromMemory: true,
      });
      hitRuleIds.add(rule.id);
    } else {
      unknownTransactions.push(tx);
    }
  }

  // 3. Batch call LLM for unknown transactions
  let llmResults = [];
  if (unknownTransactions.length > 0) {
    const prompt = categoryPrompt(unknownTransactions, categoryNames, userCorrections);
    const result = await callGemini({
      agentName: "category_agent",
      contents: prompt,
      zodSchema: categoryOutputSchema,
      userId,
    });
    llmResults = result.data || [];
  }

  // Merge LLM results
  for (const item of llmResults) {
    resolved.push({
      id: item.id,
      category: item.category,
      fromMemory: false,
    });
  }

  // Ensure output is sorted back to match original transactions array order
  resolved.sort((a, b) => a.id - b.id);

  const categorizedFromMemory = resolved.filter((r) => r.fromMemory).length;
  const categorizedByLlm = resolved.filter((r) => !r.fromMemory).length;

  // 4. Update hit counts for memory matches
  if (hitRuleIds.size > 0) {
    Promise.all(
      Array.from(hitRuleIds).map((id) =>
        prisma.merchantRule
          .update({
            where: { id },
            data: {
              hitCount: { increment: 1 },
              lastUsedAt: new Date(),
            },
          })
          .catch((err) => {
            console.error("[CategoryAgent] Error updating hit count:", err.message);
          })
      )
    ).catch(() => {});
  }

  // 5. Persist LLM categorized results as source=LLM rules (if not already existing)
  if (userId && llmResults.length > 0) {
    try {
      const allCategories = await prisma.category.findMany({ select: { id: true, name: true } });
      const catNameToId = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));

      const newRulesToCreate = new Map();
      for (const item of llmResults) {
        const key = txMerchantKeyMap.get(item.id);
        if (!key || ruleMap.has(key) || newRulesToCreate.has(key)) continue;

        const categoryId = catNameToId.get((item.category || "").toLowerCase());
        if (categoryId) {
          newRulesToCreate.set(key, categoryId);
        }
      }

      for (const [key, categoryId] of newRulesToCreate.entries()) {
        await prisma.merchantRule
          .create({
            data: {
              userId,
              merchantKey: key,
              categoryId,
              source: "LLM",
              hitCount: 1,
              lastUsedAt: new Date(),
            },
          })
          .catch(() => {
            // Safe ignore concurrent insert
          });
      }
    } catch (err) {
      console.error("[CategoryAgent] Error saving LLM merchant rules:", err.message);
    }
  }

  const finalCategories = resolved.map(({ id, category }) => ({ id, category }));

  return {
    categories: finalCategories,
    categorizedFromMemory,
    categorizedByLlm,
  };
};

module.exports = {
  categoryAgent,
  categoryOutputSchema,
};