const notificationService = require("./notification.service");

async function getNotifications(req, res, next) {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, {
      page,
      limit,
      unreadOnly,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await notificationService.markNotificationAsRead(id, req.user.id);
    res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
};
