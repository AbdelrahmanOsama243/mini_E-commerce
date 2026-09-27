const UserRepo = require("../Repos/User.Repo");
const logger = require("../Config/logger");
const jwtServices = require("../Utils/jwtGenerate");
const redisRepo = require("../Repos/Redis.Repo");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { addEmailJob } = require("../Jobs/email.queue");
const CartRepo = require("../Repos/Carts.Repo");
const mongoose = require("mongoose");

const { sendSuccess } = require("../Utils/response");
const ApiError = require("../Utils/ApiError");
const asyncHandler = require("../Utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await UserRepo.findUserByEmail(email);
  if (userExists) {
    throw new ApiError(409, "Email already registered");
  }

  // Hash password and generate the verification JWT
  const hashedPassword = await bcrypt.hash(password, 12);
  const verificationToken = jwtServices.generateVerificationToken({ name, email, hashedPassword });

  // Queue the verification email to be sent in the background
  await addEmailJob("verification", email, verificationToken);

  sendSuccess(
    res,
    null,
    "Registration successful. Please check your email to verify your account.",
    200,
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserRepo.findUserByEmail(email);

  if (user && (await UserRepo.comparePassword(password, user.password))) {
    const { accessToken, refreshToken } = await jwtServices.generateTokenPair(
      user._id,
    );

    // Load or create cart
    let cart = await CartRepo.getCartDocumentByUserId(user._id);
    if (!cart) {
      cart = await CartRepo.createCart(user._id);
    }

    // --- Merge Session Cart if it exists ---
    if (req.session && req.session.cartItems && req.session.cartItems.length > 0) {
      const guestItems = req.session.cartItems;
      const cartMap = new Map();
      
      // Map existing items
      cart.items.forEach(item => {
        cartMap.set(item.productId.toString(), item.quantity);
      });

      // Merge guest items
      for (const guestItem of guestItems) {
        const pIdStr = guestItem.productId.toString();
        const quantity = guestItem.quantity;
        
        // Find product to check stock
        const product = await mongoose.model('Product').findById(pIdStr);
        if (!product) continue;

        const existingQuantity = cartMap.get(pIdStr) || 0;
        const combinedQuantity = existingQuantity + quantity;
        
        cartMap.set(pIdStr, Math.min(combinedQuantity, product.stock));
      }

      // Convert back to array
      const plainItems = Array.from(cartMap, ([productId, quantity]) => ({
        productId,
        quantity
      }));

      cart = await CartRepo.updateCart(cart._id, plainItems);
      req.session.cartItems = []; // Clear session cart after merge
    }
    // ---------------------------------------

    const sendLoginSuccess = () => {
      // Set HttpOnly cookie for Web
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            themePreference: user.themePreference,
          },
          accessToken,
          refreshToken, // Also send in body for Mobile App
        },
        "Logged in successfully",
        200,
      );
    };

    // Regenerate session to prevent session fixation attacks
    if (req.session) {
      req.session.regenerate((err) => {
        if (err) logger.error({ err }, "Session regeneration failed");
        // Store auth details in session for cookie-based authentication (Frontend)
        req.session.userId = user._id;
        req.session.accessToken = accessToken;
        req.session.refreshToken = refreshToken;
        sendLoginSuccess();
      });
    } else {
      sendLoginSuccess();
    }
  } else {
    throw new ApiError(401, "Invalid credentials");
  }
});

const logout = asyncHandler(async (req, res) => {
  // If you pass the refreshToken in body (Mobile) or cookie (Web):
  const refreshToken = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);

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

  // Delete session on logout
  if (req.session) {
    req.session.destroy((err) => {
      if (err) logger.error({ err }, "Session destruction failed");
    });
    res.clearCookie("connect.sid"); // Adjust name if you configured a custom session cookie name
  }
  
  // Clear the JWT HttpOnly refresh token cookie
  res.clearCookie("refreshToken");

  sendSuccess(res, null, "Logged out successfully", 200);
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || (req.cookies && req.cookies.refreshToken);

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required in body or cookies");
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } =
      await jwtServices.refreshTokens(refreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, "Token refreshed successfully", 200);
  } catch (error) {
    throw new ApiError(error.statusCode || 401, error.message);
  }
});

const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated or not found");
  }

  const { _id, name, email, role, isVerified, themePreference } = req.user;

  if (!_id || !name || !email) {
    throw new ApiError(400, "User data is incomplete or invalid");
  }

  sendSuccess(
    res,
    { _id, name, email, role, isVerified, themePreference },
    "User retrieved successfully",
    200,
  );
});

const updateUserProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { name, email, themePreference } = req.body;
  const updateData = {};

  if (name) {
    updateData.name = name.trim();
  }

  if (email) {
    if (email !== req.user.email) {
      const userExists = await UserRepo.findUserByEmail(email);
      if (userExists) {
        throw new ApiError(409, "Email already in use");
      }
    }
    updateData.email = email.trim();
  }

  if (themePreference) {
    updateData.themePreference = themePreference;
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
      themePreference: updatedUser.themePreference,
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

  let tempUserData;
  try {
    tempUserData = jwtServices.verifyVerificationToken(token);
  } catch (err) {
    throw new ApiError(400, "Verification link is invalid or has expired.");
  }

  const { name, email, hashedPassword } = tempUserData;

  // Check if user already exists
  const existingUser = await UserRepo.findUserByEmail(email);
  if (existingUser) {
    if (existingUser.isVerified) {
      throw new ApiError(400, "This account is already verified. Please log in.");
    }
    throw new ApiError(409, "An account with this email already exists.");
  }

  // Create the user in the database with isVerified: true
  await UserRepo.createVerifiedUser({ name, email, hashedPassword });

  sendSuccess(
    res,
    null,
    "Email verified successfully! You can now log in.",
    200,
  );
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserRepo.findUserByEmail(email);

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  const resetToken = jwtServices.generateResetToken(user._id);

  // Queue the password reset email to be sent in the background
  await addEmailJob("forgetPassword", user.email, resetToken);

  sendSuccess(res, null, "Password reset email sent successfully", 200);
});

const resendVerification = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email) throw new ApiError(400, "Email is required");
  if (!name) throw new ApiError(400, "Name is required");
  if (!password) throw new ApiError(400, "Password is required");

  // Check if already registered — always return same message to prevent email enumeration
  const existingUser = await UserRepo.findUserByEmail(email);
  if (existingUser && existingUser.isVerified) {
    // Don't reveal that the email is already registered and verified
    return sendSuccess(res, null, "If this email is registered, a verification link has been sent.", 200);
  }

  // Hash password and generate a fresh verification JWT
  const hashedPassword = await bcrypt.hash(password, 12);
  const verificationToken = jwtServices.generateVerificationToken({ name, email, hashedPassword });

  // Queue the verification email to be sent in the background
  await addEmailJob("verification", email, verificationToken);

  sendSuccess(
    res,
    null,
    "Verification email sent successfully! Please check your inbox.",
    200,
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = req.params.token || req.body.token;
  const { password, newPassword } = req.body;
  const targetPassword = password || newPassword;

  if (!token) {
    throw new ApiError(400, "Reset token is required");
  }

  if (!targetPassword || targetPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  let decoded;
  try {
    decoded = jwtServices.verifyResetToken(token);
  } catch (err) {
    throw new ApiError(400, "Invalid or expired password reset token");
  }

  const hashedPassword = await bcrypt.hash(targetPassword, 12);
  const updatedUser = await UserRepo.updatePassword(decoded.userId, hashedPassword);

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  // Security: Invalidate all existing refresh tokens for this user
  await jwtServices.revokeAllRefreshTokens(decoded.userId);

  sendSuccess(res, null, "Password has been successfully reset. You can now log in.", 200);
});

const getAllUsers = asyncHandler(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const result = await UserRepo.findAll(
    { role: { $ne: "admin" } },
    { page, limit, select: "-password" }
  );
  return sendSuccess(res, { items: result.items, total: result.total, page: result.page, limit: result.limit });
});

const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "suspended"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'active' or 'suspended'");
  }

  const user = await UserRepo.model.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true, select: "-password" }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // If suspending, revoke all refresh tokens
  if (status === "suspended") {
    await jwtServices.revokeAllRefreshTokens(user._id);
  }

  return sendSuccess(res, user, `User ${status === "suspended" ? "suspended" : "activated"} successfully`);
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === (req.user?._id || req.user?.id)?.toString()) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await UserRepo.model.findByIdAndDelete(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Revoke all refresh tokens
  await jwtServices.revokeAllRefreshTokens(user._id);

  // Delete user's cart
  await CartRepo.model.findOneAndDelete({ userId: user._id });

  return sendSuccess(res, null, "User deleted successfully");
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
  resetPassword,
  resendVerification,
  getAllUsers,
  updateUserStatus,
  deleteUser,
};
