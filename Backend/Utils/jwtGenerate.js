const jwt = require("jsonwebtoken");
const RefreshTokenRepo = require("../Repos/RefreshToken.Repo");

// ─── Centralized Config ──────────────────────────────────────────
const CONFIG = {
  accessSecret: () => process.env.JWT_SECRET,
  refreshSecret: () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  accessExpiry: "1h",
  refreshExpiry: "30d",
};

class JWTServices {
  // ─── Core Token Generation ───────────────────────────────────────
  generateAccessToken(payload, secret) {
    return jwt.sign(payload, secret, { expiresIn: CONFIG.accessExpiry });
  }

  generateRefreshToken(payload, secret) {
    return jwt.sign(payload, secret, { expiresIn: CONFIG.refreshExpiry });
  }

  extractToken(authHeader) {
    if (!authHeader) return null;
    const parts = authHeader.split(" ");
    return parts.length === 2 ? parts[1] : null;
  }

  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  verifyRefreshToken(token) {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );
  }

  isTokenValid(token) {
    try {
      this.verifyAccessToken(token);
      return true;
    } catch {
      return false;
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }

  async generateTokenPair(userId) {
    const accessToken = this.generateAccessToken(
      { id: userId },
      process.env.JWT_SECRET,
      CONFIG.accessExpiry,
    );
    const refreshToken = this.generateRefreshToken(
      { id: userId },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      CONFIG.refreshExpiry,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 7 days

    // Persist the refresh token in the database
    const refreshTokenDoc = await RefreshTokenRepo.create({
      user: userId,
      token: refreshToken,
      expiresAt: expiresAt
    });

    return { accessToken, refreshToken, refreshTokenDoc };
  }

  // ─── New Access Token from Refresh Token ─────────────────────────
  generateNewAccessToken(payload) {
    return this.generateAccessToken(payload, process.env.JWT_SECRET, "15m");
  }

  // ─── Refresh: rotate refresh token + issue new access token ──────
  async refreshTokens(oldRefreshToken) {
    // 1. Verify the old refresh token
    const decoded = this.verifyRefreshToken(oldRefreshToken);

    // 2. Check it exists in the DB (not revoked)
    const existingDoc = await RefreshTokenRepo.findByToken(oldRefreshToken);
    if (!existingDoc) {
      const error = new Error("Refresh token not found or already revoked");
      error.status = 401;
      throw error;
    }

    // 3. Delete the old refresh token (rotation)
    await RefreshTokenRepo.delete(existingDoc._id);

    // 4. Issue a new token pair
    const { accessToken, refreshToken, refreshTokenDoc } =
      await this.generateTokenPair(decoded.id);

    return { accessToken, refreshToken, refreshTokenDoc, userId: decoded.id };
  }

  // ─── Silent Refresh: use stored refresh token to renew both ────
  async silentRefresh(userId) {
    // 1. Get the user's refresh tokens from DB
    const storedTokens = await RefreshTokenRepo.findAll({ user: userId });
    if (!storedTokens || storedTokens.length === 0) {
      return false;
    }

    // 2. Try the most recent refresh token
    const latestDoc = storedTokens[storedTokens.length - 1];

    // 3. Verify the refresh token is still valid (not expired)
    try {
      this.verifyRefreshToken(latestDoc.token);
    } catch {
      // Refresh token is expired — clean it up and return false
      await RefreshTokenRepo.delete(latestDoc._id);
      return false;
    }

    // 4. Rotate: delete the old refresh token
    await RefreshTokenRepo.delete(latestDoc._id);

    // 5. Generate a fresh token pair (new access + new refresh)
    const { accessToken, refreshToken, refreshTokenDoc } =
      await this.generateTokenPair(userId);

    return { accessToken, refreshToken, refreshTokenDoc };
  }

  // ─── Logout: revoke a single refresh token ──────────────────────
  async revokeRefreshToken(token) {
    const doc = await RefreshTokenRepo.findByToken(token);
    if (doc) {
      await RefreshTokenRepo.delete(doc._id);
    }
  }

  // ─── Logout from all devices: revoke all refresh tokens for user ─
  async revokeAllRefreshTokens(userId) {
    await RefreshTokenRepo.deleteByUser(userId);
  }
}

module.exports = new JWTServices();

