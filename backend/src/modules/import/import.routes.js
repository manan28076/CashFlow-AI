const express = require("express");
const multer = require("multer");
const { protect } = require("../../middlewares/auth.middleware");
const { uploadStatement, confirmStatementImport } = require("./import.controller");
const AppError = require("../../errors/AppError");

const router = express.Router();

// Memory storage, max 10MB, strictly never stored to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    const allowed = ["pdf", "csv", "xlsx", "xls"];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError("Invalid file extension. Only .pdf, .csv, .xlsx, .xls are supported.", 400), false);
    }
  },
});

router.post("/upload", protect, upload.single("file"), uploadStatement);
router.post("/confirm", protect, confirmStatementImport);

module.exports = router;
