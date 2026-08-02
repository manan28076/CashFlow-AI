const express = require("express");

const { create, getAll, update, remove } = require("./account.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, create);
router.get("/", protect, getAll);
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

module.exports = router;