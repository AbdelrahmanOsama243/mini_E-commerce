const express = require('express');
const router = express.Router();
const productController = require('../Controllers/Product.Controller');
const { authentication } = require('../Middlewares/auth.middleware');
const { authorize } = require('../Middlewares/authorize.middleware');
const { validateObjectId } = require('../Middlewares/validateObjectId');
const { validateCreateProduct, validateUpdateProduct } = require('../Middlewares/product.validator');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', validateObjectId(['id'], 'params'), productController.getProductById);
router.get('/:id/stock', validateObjectId(['id'], 'params'), productController.checkProductStock);

// Protected Admin routes
router.post(
  '/',
  authentication,
  authorize('admin'),
  validateCreateProduct,
  productController.createProduct
);

router.put(
  '/:id',
  authentication,
  authorize('admin'),
  validateObjectId(['id'], 'params'),
  validateUpdateProduct,
  productController.updateProduct
);

router.delete(
  '/:id',
  authentication,
  authorize('admin'),
  validateObjectId(['id'], 'params'),
  productController.deleteProduct
);

module.exports = router;
