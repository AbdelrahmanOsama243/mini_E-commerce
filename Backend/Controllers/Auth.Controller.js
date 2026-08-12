const UserRepo = require("../Repos/User.Repo");
const jwtServices = require("../Utils/jwtGenerate");
const redisRepo = require("../Repos/Redis.Repo");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const emailService = require("../Utils/emailService");
const CartRepo = require("../Repos/Carts.Repo");

const { sendSuccess } = require("../Utils/response");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name) throw new ApiError(400, "Name is required");
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new ApiError(400, "Name must be at least 2 characters long");
  }
  if (!email) throw new ApiError(400, "Email is required");
  if (!password) throw new ApiError(400, "Password is required");

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  // Password validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    );
  }

  const userExists = await UserRepo.findUserByEmail(email);
  if (userExists) {
    throw new ApiError(409, "Email already registered");
  }

  // Hash password and encode registration data in the verification token
  const hashedPassword = await bcrypt.hash(password, 12);

  const verificationCode = crypto.randomUUID();

  // Save the temporary user data in Redis for 1 hour (3600 seconds)
  const tempUserData = { name, email, hashedPassword };
  await redisRepo.set(`verify:${verificationCode}`, tempUserData, 3600);

  // Create the verification URL
  // Assuming frontend runs on process.env.FRONTEND_URL or we just pass the code
  // Wait, emailService.sendVerificationEmail might expect just the token/code
  await emailService.sendVerificationEmail(email, verificationCode);

  sendSuccess(
    res,
    null,
    "Registration successful. Please check your email to verify your account.",
    200,
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) throw new ApiError(400, "Email is required");
  if (!password) throw new ApiError(400, "Password is required");

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  const user = await UserRepo.findUserByEmail(email);

  if (user && (await UserRepo.comparePassword(password, user.password))) {
    const { accessToken, refreshToken } = await jwtServices.generateTokenPair(
      user._id,
    );

    // Load or create cart and save to session
    let cart = await CartRepo.getCartDocumentByUserId(user._id);
    if (!cart) {
      cart = await CartRepo.createCart(user._id);
    }
    req.session.cartId = cart._id;
    req.session.cartItems = cart.items;

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      },
      "Logged in successfully",
      200,
    );
  } else {
    throw new ApiError(401, "Invalid credentials");
  }
});

const logout = asyncHandler(async (req, res) => {
  // If you pass the refreshToken in body:
  const { refreshToken } = req.body;

  if (!refreshToken && !req.user) {
    throw new ApiError(
      400,
      "Refresh token or user session is required to logout",
    );
  }

  if (refreshToken) {
    await jwtServices.revokeRefreshToken(refreshToken);
  } else if (req.user) {
    // Optional: revoke all tokens for user if no specific token provided
    await jwtServices.revokeAllRefreshTokens(req.user._id);
  }

  if (req.session) {
    req.session.destroy();
  }

  res.clearCookie("connect.sid"); // Assuming default connect.sid cookie name
  sendSuccess(res, null, "Logged out successfully", 200);
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.session?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required in session");
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } =
      await jwtServices.refreshTokens(refreshToken);
    req.session.accessToken = accessToken;
    req.session.refreshToken = newRefreshToken;

    sendSuccess(res, null, "Token refreshed successfully", 200);
  } catch (error) {
    throw new ApiError(error.statusCode || 401, error.message);
  }
});

const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated or not found");
  }

  const { _id, name, email, role, isVerified } = req.user;

  if (!_id || !name || !email) {
    throw new ApiError(400, "User data is incomplete or invalid");
  }

  sendSuccess(
    res,
    { _id, name, email, role, isVerified },
    "User retrieved successfully",
    200,
  );
});

const updateUserProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { name, email } = req.body;
  const updateData = {};

  if (name) {
    if (typeof name !== "string" || name.trim().length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters long");
    }
    updateData.name = name.trim();
  }

  if (email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Please enter a valid email address");
    }

    if (email !== req.user.email) {
      const userExists = await UserRepo.findUserByEmail(email);
      if (userExists) {
        throw new ApiError(409, "Email already in use");
      }
    }
    updateData.email = email.trim();
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const updatedUser = await UserRepo.update(req.user._id, updateData);

  sendSuccess(
    res,
    {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
    },
    "User profile updated successfully",
    200,
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  // Can accept from params or query based on existing routes
  const token = req.params.token || req.query.code;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const tempUserData = await redisRepo.get(`verify:${token}`);

  if (!tempUserData) {
    throw new ApiError(400, "Verification link is invalid or has expired.");
  }

  const { name, email, hashedPassword } = tempUserData;

  // Check if user already exists
  const existingUser = await UserRepo.findUserByEmail(email);
  if (existingUser) {
    await redisRepo.delete(`verify:${token}`);
    if (existingUser.isVerified) {
      throw new ApiError(400, "This account is already verified. Please log in.");
    }
    throw new ApiError(409, "An account with this email already exists.");
  }

  // Create the user in the database with isVerified: true
  await UserRepo.createVerifiedUser({ name, email, hashedPassword });

  // Delete the data from Redis
  await redisRepo.delete(`verify:${token}`);

  sendSuccess(
    res,
    null,
    "Email verified successfully! You can now log in.",
    200,
  );
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await UserRepo.findUserByEmail(email);

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  const resetToken = jwtServices.generateResetToken(user._id);

  await emailService.sendForgetPasswordEmail(user.email, resetToken);

  sendSuccess(res, null, "Password reset email sent successfully", 200);
});

const resendVerification = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email) throw new ApiError(400, "Email is required");
  if (!name) throw new ApiError(400, "Name is required");
  if (!password) throw new ApiError(400, "Password is required");

  // Check if already registered
  const existingUser = await UserRepo.findUserByEmail(email);
  if (existingUser) {
    if (existingUser.isVerified) {
      throw new ApiError(409, "This email is already verified. Please log in.");
    }
    throw new ApiError(409, "This email is already registered but unverified.");
  }

  // Hash password and generate a fresh verification token
  const hashedPassword = await bcrypt.hash(password, 12);
  
  
  const verificationCode = crypto.randomUUID();

  // Save the temporary user data in Redis for 1 hour (3600 seconds)
  const tempUserData = { name, email, hashedPassword };
  await redisRepo.set(`verify:${verificationCode}`, tempUserData, 3600);

  // Send a new verification email
  await emailService.sendVerificationEmail(email, verificationCode);

  sendSuccess(
    res,
    null,
    "Verification email sent successfully! Please check your inbox.",
    200,
  );
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  updateUserProfile,
  verifyEmail,
  forgetPassword,
  resendVerification,
};
