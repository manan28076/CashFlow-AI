const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.get("/", protect, notificationController.getNotifications);
router.patch("/:id/read", protect, notificationController.markAsRead);

module.exports = router;
