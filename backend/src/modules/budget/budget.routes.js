const express = require("express");

const {
  create,
  getAll,
  update,
  remove,
  getMonthly,
  setMonthly,
  removeMonthly,
} = require("./budget.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Dedicated Month Overall Budget routes (must be defined before /:id)
router.get("/monthly", protect, getMonthly);
router.post("/monthly", protect, setMonthly);
router.delete("/monthly", protect, removeMonthly);

// Category Budget routes
router.post("/", protect, create);
router.get("/", protect, getAll);
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

module.exports = router;