const express = require('express');
const router = express.Router();
const orderController = require('../Controllers/Order.Controller');
const { authentication } = require('../Middlewares/auth.middleware');
const { authorize } = require('../Middlewares/authorize.middleware');
const { validateObjectId } = require('../Middlewares/validateObjectId');
const { validateCreateOrder, validateOrderStatus } = require('../Middlewares/order.validator');

// All order routes require authentication
router.use(authentication);

router.post('/', validateCreateOrder, orderController.createOrder);

router.get('/', orderController.getUserOrders);

router.get('/:id', validateObjectId(['id'], 'params'), orderController.getOrderById);

// Admin status update
router.put(
  '/:id/status',
  authorize('admin'),
  validateObjectId(['id'], 'params'),
  validateOrderStatus,
  orderController.updateOrderStatus
);

module.exports = router;
