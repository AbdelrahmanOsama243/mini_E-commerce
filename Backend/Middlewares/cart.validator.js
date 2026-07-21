const ApiError = require('../Utils/ApiError');
const mongoose = require('mongoose');

const validateAddToCart = (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    return next(new ApiError(400, 'Valid productId is required'));
  }

  if (!quantity || typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
    return next(new ApiError(400, 'Quantity must be an integer >= 1'));
  }

  next();
};

const validateUpdateCartItem = (req, res, next) => {
  const { quantity } = req.body;

  if (quantity === undefined || typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
    return next(new ApiError(400, 'Quantity must be an integer >= 1'));
  }

  next();
};

module.exports = {
  validateAddToCart,
  validateUpdateCartItem
};
