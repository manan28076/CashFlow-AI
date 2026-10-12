const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = require("../../lib/prisma");
const AppError = require("../../errors/AppError");
const { JWT_SECRET } = require("../../config/env");

const registerUser = async ({ email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

const { OAuth2Client } = require("google-auth-library");
const { GOOGLE_CLIENT_ID } = require("../../config/env");

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const authenticateWithGoogle = async (idToken) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new AppError("Invalid or expired Google token", 401);
  }

  if (!payload || !payload.email) {
    throw new AppError("Unable to retrieve email from Google", 400);
  }

  if (!payload.email_verified) {
    throw new AppError("Google email is not verified", 400);
  }

  const { email, sub: googleId, name, picture: avatarUrl } = payload;

  // Check if user exists by googleId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId },
        { email },
      ],
    },
  });

  if (user) {
    // If user exists by email but googleId not yet linked, link it now
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          name: user.name || name,
          avatarUrl: user.avatarUrl || avatarUrl,
        },
      });
    }
  } else {
    // New user signing up with Google
    user = await prisma.user.create({
      data: {
        email,
        googleId,
        name,
        avatarUrl,
      },
    });
  }

  const token = jwt.sign(
    { id: user.id },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
  authenticateWithGoogle,
};