const express = require('express');
const router = express.Router();
const cartController = require('../Controllers/Cart.Controller');
const { authentication } = require('../Middlewares/auth.middleware');
const { validateObjectId } = require('../Middlewares/validateObjectId');
const { validateAddToCart, validateUpdateCartItem } = require('../Middlewares/cart.validator');

// All cart routes require authentication
router.use(authentication);

router.get('/', cartController.getCart);

router.post('/items', validateAddToCart, cartController.addItemToCart);

router.put(
  '/items/:productId',
  validateObjectId(['productId'], 'params'),
  validateUpdateCartItem,
  cartController.updateCartItem
);

router.delete(
  '/items/:productId',
  validateObjectId(['productId'], 'params'),
  cartController.removeItemFromCart
);

router.delete('/clear', cartController.clearCart);

module.exports = router;
