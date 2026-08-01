const express = require("express");

const upload = require("./upload/upload.middleware");

const {
  test,
  uploadStatement,
} = require("./ai.controller");

const { protect } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/test", protect, test);

router.post(
  "/upload",
  protect,
  upload.single("statement"),
  uploadStatement
);

module.exports = router;