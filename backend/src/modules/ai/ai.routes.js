const express = require("express");

const upload = require("./upload/upload.middleware");

const { test, uploadStatement, ask, chat, parseQuickAdd } = require("./ai.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/test", protect, test);

router.post("/upload", protect, upload.single("statement"), uploadStatement);

router.post("/ask", protect, ask);

router.post("/chat", protect, chat);

router.post("/quick-add", protect, parseQuickAdd);

module.exports = router;