const mongoose = require('mongoose');
const CartRepo = require('../Repos/Carts.Repo');
const ProductsRepo = require('../Repos/Products.Repo');
const asyncHandler = require('../Utils/asyncHandler');
const { sendSuccess } = require('../Utils/response');
const ApiError = require('../Utils/ApiError');
const { validateObjectId } = require('../Middlewares/validateObjectId');

const getCart = [
  validateObjectId(['id'], 'user'),
  asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
      return next(new ApiError(400, 'User ID is required'));
    }

    let cart = await CartRepo.getCartByUserId(userId);

    if (!cart) {
      await CartRepo.createCart(userId);
      cart = await CartRepo.getCartByUserId(userId);
    }
    
    if (req.session) {
      req.session.cartId = cart._id;
      req.session.cartItems = cart.items;
    }

    return sendSuccess(res, cart);
  })
];

const addItemToCart = [
  validateObjectId(['id'], 'user'),
  validateObjectId(['productId'], 'body'),
  asyncHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new ApiError(400, 'User ID is required'));
    }

    // 1. Validate productId
    if (!productId) {
      return next(new ApiError(400, 'Product ID is required'));
    }

  // 2. Validate quantity
  if (!quantity || quantity <= 0) {
    return next(new ApiError(400, 'Quantity must be greater than 0'));
  }

  // 3. Validate product exists
  const product = await ProductsRepo.findById(productId);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  // 4. Business rule: check stock against what's already in the cart
  let existingCart = await CartRepo.getCartDocumentByUserId(userId);
  if (!existingCart) {
    existingCart = await CartRepo.createCart(userId);
  }

  const existingItem = existingCart?.items.find(
    item => item.productId.toString() === productId.toString()
  );
  const combinedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (combinedQuantity > product.stock) {
    return next(new ApiError(400, `Requested quantity exceeds available stock (${product.stock} left)`));
  }

  // 5. Add item via repo
  const plainItems = existingCart.items.map(item => ({
    _id: item._id,
    productId: item.productId,
    quantity: item.productId.toString() === productId.toString() ? combinedQuantity : item.quantity
  }));
  
  if (!existingItem) {
    plainItems.push({ productId, quantity });
  }

  const cart = await CartRepo.updateCart(existingCart._id, plainItems);

  if (req.session) {
    req.session.cartId = cart._id;
    req.session.cartItems = cart.items;
  }

  return sendSuccess(res, cart, 'Item added to cart', existingItem ? 200 : 201);
  })
];

const updateCartItemQuantity = [
  validateObjectId(['id'], 'user'),
  validateObjectId(['itemId'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;

    if (!quantity || quantity <= 0) {
      return next(new ApiError(400, 'Quantity must be greater than 0'));
    }

    let existingCart = await CartRepo.getCartDocumentByUserId(userId);
    if (!existingCart) {
      existingCart = await CartRepo.createCart(userId);
    }

    const item = existingCart.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return next(new ApiError(404, 'Item not found in cart'));
    }

    const product = await ProductsRepo.findById(item.productId);
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    if (quantity > product.stock) {
      return next(new ApiError(400, `Requested quantity exceeds available stock (${product.stock} left)`));
    }

    const plainItems = existingCart.items.map(i => ({
      _id: i._id,
      productId: i.productId,
      quantity: i._id.toString() === itemId ? quantity : i.quantity
    }));

    const cart = await CartRepo.updateCart(existingCart._id, plainItems);
    
    if (req.session) {
      req.session.cartId = cart._id;
      req.session.cartItems = cart.items;
    }
    
    return sendSuccess(res, cart, 'Item quantity updated');
  })
];

const removeItemFromCart = [
  validateObjectId(['id'], 'user'),
  validateObjectId(['itemId'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;
    const userId = req.user?.id;

    let existingCart = await CartRepo.getCartDocumentByUserId(userId);
    if (!existingCart) {
      existingCart = await CartRepo.createCart(userId);
    }

    const itemExists = existingCart.items.some(i => i._id.toString() === itemId);
    if (!itemExists) {
      return next(new ApiError(404, 'Item not found in cart'));
    }

    const plainItems = existingCart.items
      .filter(i => i._id.toString() !== itemId)
      .map(i => ({
        _id: i._id,
        productId: i.productId,
        quantity: i.quantity
      }));

    const cart = await CartRepo.updateCart(existingCart._id, plainItems);
    
    if (req.session) {
      req.session.cartId = cart._id;
      req.session.cartItems = cart.items;
    }
    
    return sendSuccess(res, cart, 'Item removed from cart');
  })
];

const clearCart = [
  validateObjectId(['id'], 'user'),
  asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;

    let existingCart = await CartRepo.getCartDocumentByUserId(userId);
    if (!existingCart) {
      existingCart = await CartRepo.createCart(userId);
    }

    const cart = await CartRepo.updateCart(existingCart._id, []);
    
    if (req.session) {
      req.session.cartId = cart._id;
      req.session.cartItems = cart.items;
    }
    
    return sendSuccess(res, cart, 'Cart cleared successfully');
  })
];

module.exports = { 
  getCart, 
  addItemToCart, 
  updateCartItemQuantity, 
  removeItemFromCart, 
  clearCart 
};