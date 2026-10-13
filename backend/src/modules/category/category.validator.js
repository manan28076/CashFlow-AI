const { z } = require("zod");

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["INCOME", "EXPENSE"]).optional().default("EXPENSE"),
});

module.exports = {
  createCategorySchema,
};