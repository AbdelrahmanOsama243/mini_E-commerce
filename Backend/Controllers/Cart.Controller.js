const CartRepo = require('../Repos/Carts.Repo');
const ProductsRepo = require('../Repos/Products.Repo');
const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const { sendSuccess } = require('../Utils/response');

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const cart = await CartRepo.getCartByUserId(userId);
  return sendSuccess(res, cart, 'Cart retrieved successfully');
});

const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id || req.user._id;

  // 1. Validate product exists and check stock
  const product = await ProductsRepo.findById(productId);
  if (!product) {
    throw new ApiError(404, `Product with ID '${productId}' not found`);
  }

  // 2. Business rule: check stock against what's already in the cart
  const existingCart = await CartRepo.getCartDocumentByUserId(userId);
  const existingItem = existingCart?.items.find(
    item => item.productId.toString() === productId.toString()
  );
  const combinedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (combinedQuantity > product.stock) {
    throw new ApiError(400, `Requested quantity (${combinedQuantity}) exceeds available product stock (${product.stock})`);
  }

  // 3. Add item via repo
  const cart = await CartRepo.addItemToCart(userId, productId, quantity);

  return sendSuccess(
    res,
    cart,
    existingItem ? 'Cart item quantity updated' : 'Item added to cart',
    existingItem ? 200 : 201
  );
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id || req.user._id;

  const product = await ProductsRepo.findById(productId);
  if (!product) {
    throw new ApiError(404, `Product with ID '${productId}' not found`);
  }

  if (quantity > product.stock) {
    throw new ApiError(400, `Requested quantity (${quantity}) exceeds available product stock (${product.stock})`);
  }

  const cart = await CartRepo.updateItemQuantity(userId, productId, quantity);
  return sendSuccess(res, cart, 'Cart item updated successfully');
});

const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id || req.user._id;

  const cart = await CartRepo.removeItemFromCart(userId, productId);
  return sendSuccess(res, cart, 'Item removed from cart successfully');
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const cart = await CartRepo.clearCart(userId);
  return sendSuccess(res, cart, 'Cart cleared successfully');
});

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart
};