const express = require('express');
const analyticsController = require('../Controllers/analytics.controller');
const { authentication } = require('../Middlewares/auth.middleware');
const { authorize } = require('../Middlewares/authorize.middleware');
const { redisCache } = require('../Middlewares/redisCache');

const router = express.Router();

// ── Public / API Key Protected (Looker Studio Connector) ───────────────────────
router.get('/looker/export', analyticsController.getLookerExportData);

// ── Authenticated Routes ───────────────────────────────────────────────────────
router.use(authentication);

// User-scoped analytics
router.get('/user/stats', analyticsController.getUserStats);
router.get('/user/by-status', analyticsController.getUserOrdersByStatus);
router.get('/user/spending', analyticsController.getUserSpendingTimeline);

// Admin-scoped analytics (Admin Role Required)
router.get('/admin/overview', authorize('admin'), analyticsController.getAdminOverview);
router.get('/admin/top-products', authorize('admin'), analyticsController.getAdminTopProducts);
router.get('/admin/least-products', authorize('admin'), analyticsController.getAdminLeastProducts);
router.get('/admin/low-stock', authorize('admin'), analyticsController.getAdminLowStock);
router.get('/admin/revenue', authorize('admin'), analyticsController.getAdminRevenueTimeline);
router.get('/admin/payment-stats', authorize('admin'), analyticsController.getAdminPaymentStats);
router.get('/admin/top-customers', authorize('admin'), analyticsController.getAdminTopCustomers);

module.exports = router;
