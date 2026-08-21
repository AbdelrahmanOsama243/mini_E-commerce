const rateLimit = require("express-rate-limit");

// Rate Limiting — Global
// 5 requests per minute maximum per IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // max 5 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Rate Limiting — Auth routes (stricter)
// 3 requests per minute maximum per IP
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // max 3 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts, please try again later." },
});

module.exports = {
  globalLimiter,
  authLimiter,
};
