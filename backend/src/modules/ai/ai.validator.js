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

const metricsQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 7))
    .pipe(z.number().int().min(1).max(90)),
});

module.exports = {
  testAISchema,
  uploadStatementSchema,
  askSchema,
  chatSchema,
  metricsQuerySchema,
};