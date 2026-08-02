const { z } = require("zod");

const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  bankName: z.string().min(1, "Bank name is required"),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  bankName: z.string().min(1).optional(),
});

module.exports = {
  createAccountSchema,
  updateAccountSchema,
};