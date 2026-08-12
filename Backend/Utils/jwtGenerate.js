const jwt = require("jsonwebtoken");
const RefreshTokenRepo = require("../Repos/RefreshToken.Repo");
const ApiError = require("./ApiError");

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const ISSUER = "mini_e-commerce";

if (!ACCESS_SECRET) {
  throw new Error("FATAL: JWT_SECRET not set in environment variables");
}

class JWTServices {
  _sign(payload, secret, expiry) {
    return jwt.sign(payload, secret, {
      expiresIn: expiry,
      algorithm: "HS256",
      issuer: ISSUER,
      audience: "mini_e-commerce_clients",
    });
  }

  generateAccessToken(payload) {
    return this._sign({ ...payload, typ: "access" }, ACCESS_SECRET, "1h");
  }

  generateRefreshToken(payload) {
    return this._sign({ ...payload, typ: "refresh" }, REFRESH_SECRET, "30d");
  }

  generateVerificationToken({ name, email, hashedPassword }) {
    return this._sign({ name, email, hashedPassword, typ: "verification" }, ACCESS_SECRET, "24h");
  }

  generateResetToken(userId) {
    return this._sign({ userId, typ: "reset" }, ACCESS_SECRET, "1h");
  }

  extractToken(authHeader) {
    if (!authHeader) return null;
    const parts = authHeader.split(" ");
    return parts.length === 2 && parts[0] === "Bearer" ? parts[1] : null;
  }

  verifyAccessToken(token) {
    const decoded = jwt.verify(token, ACCESS_SECRET, { clockTolerance: 30, issuer: ISSUER });
    if (decoded.typ !== "access") throw new jwt.JsonWebTokenError("Invalid token type");
    return decoded;
  }

  verifyRefreshToken(token) {
    const decoded = jwt.verify(token, REFRESH_SECRET, { clockTolerance: 30, issuer: ISSUER });
    if (decoded.typ !== "refresh") throw new jwt.JsonWebTokenError("Invalid token type");
    return decoded;
  }

  verifyVerificationToken(token) {
    const decoded = jwt.verify(token, ACCESS_SECRET, { clockTolerance: 30, issuer: ISSUER });
    if (decoded.typ !== "verification") throw new jwt.JsonWebTokenError("Invalid token type");
    return decoded;
  }

  verifyResetToken(token) {
    const decoded = jwt.verify(token, ACCESS_SECRET, { clockTolerance: 30, issuer: ISSUER });
    if (decoded.typ !== "reset") throw new jwt.JsonWebTokenError("Invalid token type");
    return decoded;
  }

  async generateTokenPair(userId) {
    const accessToken = this.generateAccessToken({ id: userId });
    const refreshToken = this.generateRefreshToken({ id: userId });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days matches "30d"

    // Persist the refresh token in the database
    const refreshTokenDoc = await RefreshTokenRepo.create({
      user: userId,
      token: refreshToken,
      expiresAt: expiresAt,
    });

    return { accessToken, refreshToken, refreshTokenDoc };
  }

  async refreshTokens(oldRefreshToken) {
    const decoded = this.verifyRefreshToken(oldRefreshToken);

    // Atomic delete returning the doc
    const existingDoc = await RefreshTokenRepo.deleteByToken(oldRefreshToken);
    if (!existingDoc) {
      throw new ApiError(401, "Refresh token not found or already revoked");
    }

    if (new Date() > new Date(existingDoc.expiresAt)) {
      throw new ApiError(401, "Refresh token expired in database");
    }

    const { accessToken, refreshToken, refreshTokenDoc } =
      await this.generateTokenPair(decoded.id);

    return { accessToken, refreshToken, refreshTokenDoc, userId: decoded.id };
  }

  async revokeRefreshToken(token) {
    await RefreshTokenRepo.deleteByToken(token);
  }

  async revokeAllRefreshTokens(userId) {
    await RefreshTokenRepo.deleteByUser(userId);
  }
}

module.exports = new JWTServices();
