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

module.exports = {
  testAISchema,
};