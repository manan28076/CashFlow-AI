const jwt = require("jsonwebtoken");

const prisma = require("../lib/prisma");
const AppError = require("../errors/AppError");
const { JWT_SECRET } = require("../config/env");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Not authorized", 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    let user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        plan: true,
        planBillingCycle: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if subscription has expired
    if (
      user.plan !== "STARTER" &&
      user.subscriptionExpiresAt &&
      new Date() > new Date(user.subscriptionExpiresAt)
    ) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "STARTER",
          subscriptionStatus: "EXPIRED",
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          plan: true,
          planBillingCycle: true,
          subscriptionStatus: true,
          subscriptionStartedAt: true,
          subscriptionExpiresAt: true,
          createdAt: true,
        },
      });
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};