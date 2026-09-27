const rateLimit = require("express-rate-limit");

// Rate Limiting — Global
// 100 requests per minute maximum per IP (allows normal browsing & payment status polling)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // max 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for webhooks and payment polling
    return (
      req.url.startsWith("/api/payment/callback") ||
      req.url.startsWith("/api/payment/status")
    );
  },
  message: { success: false, message: "Too many requests, please try again later." },
});

// Rate Limiting — Auth routes (stricter against brute-force)
// 10 requests per minute maximum per IP
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // max 10 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts, please try again later." },
});

// Rate Limiting — Payment routes (prevent payment fraud/spam)
// 20 requests per 15 minutes per user/IP
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: "Too many payment attempts, please try again later." },
});

module.exports = {
  globalLimiter,
  authLimiter,
  paymentLimiter,
};
