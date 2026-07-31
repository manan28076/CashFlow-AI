const { z } = require("zod");

const createTransactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  merchant: z.string().optional(),
  note: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  date: z.string(),
});

module.exports = {
  createTransactionSchema,
};