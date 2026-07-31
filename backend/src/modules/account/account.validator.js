const { z } = require("zod");

const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  bankName: z.string().min(1, "Bank name is required"),
});

module.exports = {
  createAccountSchema,
};