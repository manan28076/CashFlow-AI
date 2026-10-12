const express = require("express");

const {
  register,
  login,
  googleLogin,
  getMe,
} = require("./auth.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", protect, getMe);
module.exports = router;