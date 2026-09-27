const mongoose = require('mongoose');
const CartRepo = require('../Repos/Carts.Repo');
const ProductsRepo = require('../Repos/Products.Repo');
const asyncHandler = require('../Utils/asyncHandler');
const { sendSuccess } = require('../Utils/response');
const ApiError = require('../Utils/ApiError');

const getCart = [
  asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;

    if (userId) {
      // Authenticated User Flow
      let cart = await CartRepo.getCartByUserId(userId);
      if (!cart) {
        await CartRepo.createCart(userId);
        cart = await CartRepo.getCartByUserId(userId);
      }
      return sendSuccess(res, cart);
    } else {
      // Guest User Flow
      const sessionItems = req.session?.cartItems || [];
      // Populate product details for session items
      const populatedItems = [];
      for (const item of sessionItems) {
        const product = await ProductsRepo.findById(item.productId);
        if (product) {
          populatedItems.push({ ...item, productId: product });
        }
      }
      
      const guestCart = {
        _id: 'guest_cart',
        userId: null,
        items: populatedItems
      };
      return sendSuccess(res, guestCart);
    }
  })
];

const addItemToCart = [
  asyncHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user?._id;

    const product = await ProductsRepo.findById(productId);
    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    if (userId) {
      // Authenticated Flow
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

      const plainItems = existingCart.items.map(item => ({
        _id: item._id,
        productId: item.productId,
        quantity: item.productId.toString() === productId.toString() ? combinedQuantity : item.quantity
      }));
      
      if (!existingItem) {
        plainItems.push({ productId, quantity });
      }

      const cart = await CartRepo.updateCart(existingCart._id, plainItems);
      return sendSuccess(res, cart, 'Item added to cart', existingItem ? 200 : 201);
    } else {
      // Guest Flow
      if (!req.session) {
        return next(new ApiError(500, 'Session is not initialized for guest cart'));
      }
      
      const sessionItems = req.session.cartItems || [];
      const existingItem = sessionItems.find(item => item.productId.toString() === productId.toString());
      const combinedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

      if (combinedQuantity > product.stock) {
        return next(new ApiError(400, `Requested quantity exceeds available stock (${product.stock} left)`));
      }

      if (existingItem) {
        existingItem.quantity = combinedQuantity;
      } else {
        sessionItems.push({ _id: new mongoose.Types.ObjectId().toString(), productId, quantity });
      }
      
      req.session.cartItems = sessionItems;
      return sendSuccess(res, { items: sessionItems }, 'Item added to guest cart', existingItem ? 200 : 201);
    }
  })
];

const updateCartItemQuantity = [
  asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?._id;

    if (userId) {
      // Authenticated Flow
      let existingCart = await CartRepo.getCartDocumentByUserId(userId);
      if (!existingCart) return next(new ApiError(404, 'Cart not found'));

      const item = existingCart.items.find(i => i._id.toString() === itemId);
      if (!item) return next(new ApiError(404, 'Item not found in cart'));

      const product = await ProductsRepo.findById(item.productId);
      if (!product) return next(new ApiError(404, 'Product not found'));

      if (quantity > product.stock) {
        return next(new ApiError(400, `Requested quantity exceeds available stock (${product.stock} left)`));
      }

      const plainItems = existingCart.items.map(i => ({
        _id: i._id,
        productId: i.productId,
        quantity: i._id.toString() === itemId ? quantity : i.quantity
      }));

      const cart = await CartRepo.updateCart(existingCart._id, plainItems);
      return sendSuccess(res, cart, 'Item quantity updated');
    } else {
      // Guest Flow
      const sessionItems = req.session?.cartItems || [];
      const item = sessionItems.find(i => i._id === itemId || i.productId.toString() === itemId);
      if (!item) return next(new ApiError(404, 'Item not found in guest cart'));

      const product = await ProductsRepo.findById(item.productId);
      if (!product) return next(new ApiError(404, 'Product not found'));
      if (quantity > product.stock) {
        return next(new ApiError(400, `Requested quantity exceeds available stock (${product.stock} left)`));
      }

      item.quantity = quantity;
      req.session.cartItems = sessionItems;
      return sendSuccess(res, { items: sessionItems }, 'Guest item quantity updated');
    }
  })
];

const removeItemFromCart = [
  asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;
    const userId = req.user?._id;

    if (userId) {
      // Authenticated Flow
      let existingCart = await CartRepo.getCartDocumentByUserId(userId);
      if (!existingCart) return next(new ApiError(404, 'Cart not found'));

      const plainItems = existingCart.items
        .filter(i => i._id.toString() !== itemId)
        .map(i => ({
          _id: i._id,
          productId: i.productId,
          quantity: i.quantity
        }));

      const cart = await CartRepo.updateCart(existingCart._id, plainItems);
      return sendSuccess(res, cart, 'Item removed from cart');
    } else {
      // Guest Flow
      if (req.session && req.session.cartItems) {
        req.session.cartItems = req.session.cartItems.filter(i => i._id !== itemId && i.productId.toString() !== itemId);
      }
      return sendSuccess(res, { items: req.session?.cartItems || [] }, 'Item removed from guest cart');
    }
  })
];

const clearCart = [
  asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;

    if (userId) {
      let existingCart = await CartRepo.getCartDocumentByUserId(userId);
      if (existingCart) {
        const cart = await CartRepo.updateCart(existingCart._id, []);
        return sendSuccess(res, cart, 'Cart cleared successfully');
      }
    } else {
      if (req.session) {
        req.session.cartItems = [];
      }
      return sendSuccess(res, { items: [] }, 'Guest cart cleared');
    }
  })
];

const mergeCart = [
  asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;
    const { items: guestItems } = req.body;

    let existingCart = await CartRepo.getCartDocumentByUserId(userId);
    if (!existingCart) {
      existingCart = await CartRepo.createCart(userId);
    }

    // Map existing items for easy lookup
    const cartMap = new Map();
    existingCart.items.forEach(item => {
      cartMap.set(item.productId.toString(), item.quantity);
    });

    for (const guestItem of guestItems) {
      const { productId, quantity } = guestItem;
      if (!productId || !quantity || quantity <= 0) continue;

      const product = await ProductsRepo.findById(productId);
      if (!product) continue;

      const existingQuantity = cartMap.get(productId.toString()) || 0;
      const combinedQuantity = existingQuantity + quantity;

      // Cap at product stock
      const finalQuantity = Math.min(combinedQuantity, product.stock);
      cartMap.set(productId.toString(), finalQuantity);
    }

    // Convert map back to array format
    const plainItems = Array.from(cartMap, ([productId, quantity]) => ({
      productId,
      quantity
    }));

    const cart = await CartRepo.updateCart(existingCart._id, plainItems);

    return sendSuccess(res, cart, 'Cart merged successfully');
  })
];

module.exports = { 
  getCart, 
  addItemToCart, 
  updateCartItemQuantity, 
  removeItemFromCart, 
  clearCart,
  mergeCart
};