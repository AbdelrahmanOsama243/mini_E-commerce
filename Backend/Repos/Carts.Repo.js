const BaseRepo = require('./BaseRepo');
const Cart = require('../Models/Carts.Model');

class CartsRepository extends BaseRepo {
  constructor() {
    super(Cart);
    this.allowedUpdates = ['items'];
  }

  async getCartByUserId(userId) {
    return await this.model.findOne({ userId }).populate('items.productId');
  }

  async getCartDocumentByUserId(userId) {
    return await this.findOne({ userId });
  }

  async createCart(userId) {
    const cart = await this.findOne({ userId });
    if (cart) {
      return cart;
    }
    return await this.create({ userId, items: [] });
  }

  async updateCart(cartId, items) {
    return await this.model.findByIdAndUpdate(
      cartId,
      { items },
      { new: true, runValidators: true }
    ).populate('items.productId');
  }

  async saveCart(cart) {
    return await cart.save();
  }
}

module.exports = new CartsRepository();
