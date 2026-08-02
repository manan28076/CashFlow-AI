const { z } = require("zod");

const createBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().positive("Budget amount must be greater than 0"),
  month: z.number().min(1).max(12),
  year: z.number().min(2024),
});

const updateBudgetSchema = createBudgetSchema.partial();

module.exports = {
  createBudgetSchema,
  updateBudgetSchema,
};