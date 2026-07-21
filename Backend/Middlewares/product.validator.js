const ApiError = require('../Utils/ApiError');

const validateCreateProduct = (req, res, next) => {
  const { name, price, category, stock, image, images } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new ApiError(400, 'Product name is required and must be a non-empty string'));
  }

  if (price === undefined || typeof price !== 'number' || price < 0) {
    return next(new ApiError(400, 'Product price is required and must be a number >= 0'));
  }

  if (!category || typeof category !== 'string' || category.trim() === '') {
    return next(new ApiError(400, 'Product category is required and must be a non-empty string'));
  }

  if (stock === undefined || typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
    return next(new ApiError(400, 'Product stock is required and must be an integer >= 0'));
  }

  if (image && typeof image !== 'string') {
    return next(new ApiError(400, 'Product image must be a valid URL string'));
  }

  if (images && !Array.isArray(images)) {
    return next(new ApiError(400, 'Product images must be an array of URL strings'));
  }

  next();
};

const validateUpdateProduct = (req, res, next) => {
  const { name, price, category, stock, image, images } = req.body;

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return next(new ApiError(400, 'Product name must be a non-empty string'));
  }

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return next(new ApiError(400, 'Product price must be a number >= 0'));
  }

  if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
    return next(new ApiError(400, 'Product category must be a non-empty string'));
  }

  if (stock !== undefined && (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock))) {
    return next(new ApiError(400, 'Product stock must be an integer >= 0'));
  }

  if (image !== undefined && typeof image !== 'string') {
    return next(new ApiError(400, 'Product image must be a valid URL string'));
  }

  if (images !== undefined && !Array.isArray(images)) {
    return next(new ApiError(400, 'Product images must be an array of URL strings'));
  }

  next();
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct
};
