const BaseRepo = require('./BaseRepo');
const Order = require('../Models/orders.Model');

class OrdersRepository extends BaseRepo {
  constructor() {
    super(Order);
    this.allowedUpdates = ['status', 'shippingAddress'];
  }

  // Shadow methods (createOrder, getOrders, getOrderById) have been removed.
  // Callers should use the generic methods from BaseRepo:
  // this.create(), this.findAll(filter, { populate: 'items.productId' }), this.findById(id, { populate: 'items.productId' })
}

module.exports = new OrdersRepository();
