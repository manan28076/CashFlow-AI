const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/apiResponse");

const {
  registerSchema,
  loginSchema,
} = require("./auth.validator");

const {
  registerUser,
  loginUser,
} = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const validatedData = registerSchema.parse(req.body);

  const { user, token } = await registerUser(validatedData);

  return res.status(201).json(
    new ApiResponse(201, "User registered successfully", {
      user,
      token,
    })
  );
});

const login = asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);

  const { user, token } = await loginUser(validatedData);

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      user,
      token,
    })
  );
});
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "User fetched successfully", req.user)
  );
});
module.exports = {
  register,
  login,
  getMe,
};