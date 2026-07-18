const BaseRepo = require('./BaseRepo');
const Order = require('../Models/orders.Model');

class OrdersRepository extends BaseRepo {
  constructor() {
    super(Order);
    this.allowedUpdates = ['status', 'shippingAddress'];
  }

  async createOrder(orderData) {
    return await this.create(orderData);
  }

  async getOrders(filter = {}) {
    return await this.model.find(filter).populate('items.productId');
  }

  async getOrderById(id) {
    return await this.model.findById(id).populate('items.productId');
  }
}

module.exports = new OrdersRepository();
