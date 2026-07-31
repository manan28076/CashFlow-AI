const express = require("express");

const {
  create,
  getAll,
} = require("./account.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, create);
router.get("/", protect, getAll);

module.exports = router;