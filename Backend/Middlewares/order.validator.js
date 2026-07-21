const ApiError = require('../Utils/ApiError');
const mongoose = require('mongoose');

const validateCreateOrder = (req, res, next) => {
  const { shippingAddress, items } = req.body;

  if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim() === '') {
    return next(new ApiError(400, 'Shipping address is required'));
  }

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      return next(new ApiError(400, 'If provided, items must be a non-empty array'));
    }

    for (const item of items) {
      if (!item.productId || !mongoose.isValidObjectId(item.productId)) {
        return next(new ApiError(400, `Invalid productId in order items: ${item.productId}`));
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return next(new ApiError(400, `Invalid quantity for productId ${item.productId}`));
      }
    }
  }

  next();
};

const validateOrderStatus = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'paid', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return next(new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`));
  }

  next();
};

module.exports = {
  validateCreateOrder,
  validateOrderStatus
};
