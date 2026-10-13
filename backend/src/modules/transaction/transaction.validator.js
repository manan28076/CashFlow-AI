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
  allowDuplicate: z.boolean().optional().default(false),
});

const updateTransactionSchema = createTransactionSchema.partial();

const transactionQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  sortBy: z.enum(["date", "amount"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
};