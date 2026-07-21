const BaseRepo = require('./BaseRepo');
const Order = require('../Models/orders.Model');

class OrdersRepository extends BaseRepo {
  constructor() {
    super(Order);
    this.allowedUpdates = ['status', 'shippingAddress'];
  }

  async getUserOrders(userId) {
    return await this.findAll(
      { userId },
      { populate: 'items.productId', sort: { createdAt: -1 } }
    );
  }

  async getOrderById(orderId) {
    return await this.findById(orderId, { populate: 'items.productId' });
  }

  async createOrder(orderData, options = {}) {
    return await this.create(orderData, options);
  }
}

module.exports = new OrdersRepository();
