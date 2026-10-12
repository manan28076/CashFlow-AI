const { z } = require("zod");
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});
const googleAuthSchema = z.object({
  token: z.string().min(1, "Google ID token is required"),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleAuthSchema,
};