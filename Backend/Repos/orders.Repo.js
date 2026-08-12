const BaseRepo = require('./BaseRepo');
const Order = require('../Models/orders.Model');
const redisRepo = require('./Redis.Repo');

class OrdersRepository extends BaseRepo {
  constructor() {
    super(Order);
    this.allowedUpdates = ['status', 'shippingAddress'];
    this.allowedPopulates = ['items.productId'];
  }

  async findAll(filter = {}, options = {}) {
    const cacheKey = `orders:history:${JSON.stringify(filter)}:${JSON.stringify(options)}`;
    const cachedHistory = await redisRepo.get(cacheKey);
    if (cachedHistory) {
      return cachedHistory;
    }
    const history = await super.findAll(filter, options);
    await redisRepo.set(cacheKey, history, 3600); // Cache for 1 hour
    return history;
  }

  async findById(id, options = {}) {
    const cacheKey = `order:${id}:${JSON.stringify(options)}`;
    const cachedOrder = await redisRepo.get(cacheKey);
    if (cachedOrder) {
      return cachedOrder;
    }
    const order = await super.findById(id, options);
    if (order) {
      await redisRepo.set(cacheKey, order, 3600);
    }
    return order;
  }

  // Shadow methods (createOrder, getOrders, getOrderById) have been removed.
  // Callers should use the generic methods from BaseRepo:
  // this.create(), this.findAll(filter, { populate: 'items.productId' }), this.findById(id, { populate: 'items.productId' })
}

module.exports = new OrdersRepository();
