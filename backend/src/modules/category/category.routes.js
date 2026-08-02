const express = require("express");

const { create, getAll, remove } = require("./category.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, create);
router.get("/", protect, getAll);
router.delete("/:id", protect, remove);

module.exports = router;