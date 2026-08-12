const BaseRepo = require('./BaseRepo');
const Cart = require('../Models/Carts.Model');

class CartsRepository extends BaseRepo {
  constructor() {
    super(Cart);
    this.allowedUpdates = ['items'];
    this.allowedPopulates = ['items.productId'];
  }

  async getCartByUserId(userId) {
    return await this.findOne({ userId }, { populate: this.allowedPopulates });
  }

  async getCartDocumentByUserId(userId) {
    return await this.findOne({ userId });
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
    return await this.model.populate(updated, { path: this.allowedPopulates });
  }
}

module.exports = new CartsRepository();
