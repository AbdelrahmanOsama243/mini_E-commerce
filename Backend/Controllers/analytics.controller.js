const analyticsService = require('../Services/analytics.service');
const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const { sendSuccess } = require('../Utils/response');

// ── User Analytics Endpoints ───────────────────────────────────────────────────

const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const stats = await analyticsService.getUserOrderStats(userId);
  return sendSuccess(res, stats, "User order statistics retrieved successfully");
});

const getUserOrdersByStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const data = await analyticsService.getUserOrdersByStatus(userId);
  return sendSuccess(res, data, "User orders by status retrieved successfully");
});

const getUserSpendingTimeline = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const data = await analyticsService.getUserSpendingTimeline(userId);
  return sendSuccess(res, data, "User spending timeline retrieved successfully");
});

// ── Admin Analytics Endpoints (Scoped per logged-in admin) ─────────────────────

const getAdminOverview = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user._id;
  const overview = await analyticsService.getAdminOverview(adminId);
  return sendSuccess(res, overview, "Admin overview statistics retrieved successfully");
});

const getAdminTopProducts = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user._id;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const products = await analyticsService.getAdminTopProducts(adminId, limit);
  return sendSuccess(res, products, "Admin top selling products retrieved successfully");
});

const getAdminLeastProducts = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user._id;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const products = await analyticsService.getAdminLeastProducts(adminId, limit);
  return sendSuccess(res, products, "Admin least selling products retrieved successfully");
});

const getAdminLowStock = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user._id;
  const threshold = Math.min(Math.max(parseInt(req.query.threshold) || 5, 0), 100);
  const products = await analyticsService.getAdminLowStockProducts(adminId, threshold);
  return sendSuccess(res, products, "Admin low stock products retrieved successfully");
});

const getAdminRevenueTimeline = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user._id;
  const revenue = await analyticsService.getAdminRevenueTimeline(adminId);
  return sendSuccess(res, revenue, "Admin revenue timeline retrieved successfully");
});

const getAdminPaymentStats = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user._id;
  const paymentStats = await analyticsService.getAdminPaymentStats(adminId);
  return sendSuccess(res, paymentStats, "Admin payment methods distribution retrieved successfully");
});

const getAdminTopCustomers = asyncHandler(async (req, res) => {
  const adminId = req.user.id || req.user._id;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const customers = await analyticsService.getAdminTopCustomers(adminId, limit);
  return sendSuccess(res, customers, "Admin top customers retrieved successfully");
});

// ── Looker Studio Export Endpoint (API Key Protected) ─────────────────────────

const getLookerExportData = asyncHandler(async (req, res, next) => {
  const apiKey = req.query.apiKey || req.headers['x-api-key'];
  const configuredKey = process.env.LOOKER_STUDIO_API_KEY || process.env.ANALYTICS_API_KEY || 'looker_studio_secret_key';

  if (!apiKey || apiKey !== configuredKey) {
    return next(new ApiError(401, "Unauthorized: Invalid or missing Looker Studio API Key"));
  }

  const data = await analyticsService.getLookerExportData();
  return res.status(200).json(data);
});

module.exports = {
  getUserStats,
  getUserOrdersByStatus,
  getUserSpendingTimeline,
  getAdminOverview,
  getAdminTopProducts,
  getAdminLeastProducts,
  getAdminLowStock,
  getAdminRevenueTimeline,
  getAdminPaymentStats,
  getAdminTopCustomers,
  getLookerExportData
};
