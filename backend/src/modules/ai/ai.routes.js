const express = require("express");

const upload = require("./upload/upload.middleware");

const { test, uploadStatement, ask, chat, parseQuickAdd, liveAudit, getMetrics } = require("./ai.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/metrics", protect, getMetrics);

router.post("/test", protect, test);

router.post("/upload", protect, upload.single("statement"), uploadStatement);

router.post("/ask", protect, ask);

router.post("/chat", protect, chat);

router.post("/quick-add", protect, parseQuickAdd);

router.post("/live-audit", protect, liveAudit);
router.get("/live-audit", protect, liveAudit);

module.exports = router;