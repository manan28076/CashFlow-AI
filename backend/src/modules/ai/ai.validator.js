const { z } = require("zod");

const testAISchema = z.object({
  transactions: z.array(
    z.object({
      merchant: z.string(),
      amount: z.number(),
      date: z.string().optional(),
    })
  ),
});

const uploadStatementSchema = z.object({
  accountId: z.string().min(1, "accountId is required"),
});

const askSchema = z.object({
  question: z.string().min(3, "question is required"),
});

const chatSchema = z.object({
  message: z.string().min(3, "message is required"),
});

module.exports = {
  testAISchema,
  uploadStatementSchema,
  askSchema,
  chatSchema,
};