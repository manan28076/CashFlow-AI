const express = require("express");

const {
  create,
  getAll,
  getDuplicates,
  resolveDuplicates,
  update,
  remove,
} = require("./transaction.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, create);
router.get("/", protect, getAll);
router.get("/duplicates", protect, getDuplicates);
router.post("/duplicates/resolve", protect, resolveDuplicates);
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

module.exports = router;