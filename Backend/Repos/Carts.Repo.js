const BaseRepo = require('./BaseRepo');
const Cart = require('../Models/Carts.Model');

class CartsRepository extends BaseRepo {
  constructor() {
    super(Cart);
    this.allowedUpdates = ['items'];
  }

  async getCartByUserId(userId) {
    let cart = await this.findOne({ userId }, { populate: 'items.productId' });
    if (!cart) {
      cart = await this.createCart(userId);
      cart = await this.findOne({ userId }, { populate: 'items.productId' });
    }
    return cart;
  }

  async getCartDocumentByUserId(userId) {
    let cart = await this.findOne({ userId });
    if (!cart) {
      cart = await this.createCart(userId);
    }
    return cart;
  }

  async createCart(userId) {
    try {
      return await this.create({ userId, items: [] });
    } catch (error) {
      if (error.code === 11000) {
        return await this.findOne({ userId });
      }
      throw error;
    }
  }

  async updateCart(cartId, items) {
    const updated = await this.update(cartId, { items });
    return await this.model.populate(updated, { path: 'items.productId' });
  }

  async addItemToCart(userId, productId, quantity) {
    let cart = await this.getCartDocumentByUserId(userId);

    const existingIndex = cart.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    return await this.model.populate(cart, { path: 'items.productId' });
  }

  async removeItemFromCart(userId, productId) {
    let cart = await this.getCartDocumentByUserId(userId);
    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId.toString()
    );
    await cart.save();
    return await this.model.populate(cart, { path: 'items.productId' });
  }

  async updateItemQuantity(userId, productId, quantity) {
    let cart = await this.getCartDocumentByUserId(userId);
    const item = cart.items.find(
      item => item.productId.toString() === productId.toString()
    );

    if (item) {
      item.quantity = quantity;
      await cart.save();
    }
    return await this.model.populate(cart, { path: 'items.productId' });
  }

  async clearCart(userId) {
    let cart = await this.getCartDocumentByUserId(userId);
    cart.items = [];
    await cart.save();
    return cart;
  }
}

module.exports = new CartsRepository();
