const mongoose = require('mongoose');
const CartRepo = require('../Repositories/Cart.Repository');
const Product = require('../Models/Product.Model');

const getCart = async (req, res, next) => {
  try {
    const cart = await CartRepo.getCartByUserId(req.user.id);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    return res.status(200).json({ cart });
  } catch (error) {
    return next(error);
  }
};

const addItemToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // 1. Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Valid Product ID is required' });
    }

    // 2. Validate quantity
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // 3. Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 4. Business rule: check stock against what's already in the cart
    const existingCart = await CartRepo.getCartDocumentByUserId(userId);
    const existingItem = existingCart?.items.find(
      item => item.productId.toString() === productId.toString()
    );
    const combinedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (combinedQuantity > product.stock) {
      return res.status(400).json({
        message: `Requested quantity exceeds available stock (${product.stock} left)`
      });
    }

    // 5. Add item via repo
    const cart = await CartRepo.addItemToCart(userId, productId, quantity);

    return res.status(existingItem ? 200 : 201).json({ message: 'Item added to cart', cart });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getCart, addItemToCart };