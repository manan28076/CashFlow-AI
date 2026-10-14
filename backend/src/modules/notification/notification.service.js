const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");

async function getUserNotifications(userId, { page = 1, limit = 10, unreadOnly = false } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * take;

  const where = { userId };
  if (unreadOnly === "true" || unreadOnly === true) {
    where.readAt = null;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  return {
    notifications,
    pagination: {
      page: pageNum,
      limit: take,
      total,
      totalPages: Math.ceil(total / take) || 1,
      unreadCount,
    },
  };
}

async function markNotificationAsRead(id, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.userId !== userId) {
    throw new AppError("Not authorized to access this notification", 403);
  }

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
};
