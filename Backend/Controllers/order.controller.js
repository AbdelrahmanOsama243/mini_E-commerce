const OrdersRepository = require("../Repos/orders.Repo");
const CartsRepository = require("../Repos/Carts.Repo");
const ProductsRepository = require("../Repos/Products.Repo");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const { sendSuccess } = require("../Utils/response");
const { validateObjectId } = require("../Middlewares/validateObjectId");
const { addOrderJob } = require("../Jobs/order.queue");

const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress, paymentMethod = 'cod' } = req.body;
  const userId = req.user?._id;
  if (!userId) {
    return next(new ApiError(401, "Unauthorized"));
  }

  // Fetch cart directly from DB
  const cart = await CartsRepository.getCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    return next(new ApiError(400, "Cart is empty"));
  }

  const cartItems = cart.items;

  // Pre-validate stock availability before creating order
  for (const item of cartItems) {
    const product = item.productId;
    if (!product) {
      return next(new ApiError(400, "One or more products in your cart are no longer available"));
    }
    if (item.quantity > product.stock) {
      return next(new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`));
    }
  }


  // Create order items array
  const orderItems = cartItems.map((item) => ({
    productId: item.productId._id || item.productId, // Fallback if not fully populated
    quantity: item.quantity,
    priceAtPurchase: item.productId.price || 0, // Should be populated for price
  }));

  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) => {
    return total + item.quantity * (item.productId.price || 0);
  }, 0);

  // Create pending order
  const order = await OrdersRepository.create({
    userId,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    totalPrice,
    status: "pending",
  });

  // Clear cart in DB immediately so user can continue shopping
  await CartsRepository.updateCart(cart._id, []);

  // Enqueue job for background processing
  const queueData = {
    orderId: order._id,
    userId,
    cartItems: orderItems // send formatted items with productId
  };
  await addOrderJob(queueData);

  return sendSuccess(res, order, "Order received successfully and is being processed", 201);
});

const getOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  let result;

  if (req.query.all === "true" && req.user?.role === "admin") {
    // Admin gets all orders
    result = await OrdersRepository.findAll({}, { populate: "userId items.productId", page, limit });
  } else {
    // User gets their own orders
    result = await OrdersRepository.findAll({ userId }, { populate: "items.productId", page, limit });
  }

  return sendSuccess(res, { items: result.items, total: result.total, page: result.page, limit: result.limit });
});

const getOrderById = [
  validateObjectId(['id'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const order = await OrdersRepository.findById(id, { populate: "userId items.productId" });

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    const orderUserId = (order.userId?._id || order.userId)?.toString();
    const currentUserId = (req.user?._id || req.user?.id || req.user)?.toString();

    if (orderUserId !== currentUserId && req.user?.role !== "admin") {
      return next(new ApiError(403, "Forbidden"));
    }

    return sendSuccess(res, order);
  })
];

const updateOrderStatus = [
  validateObjectId(['id'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { status } = req.body;

    const { id } = req.params;
    const order = await OrdersRepository.update(id, { status });

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    return sendSuccess(res, order, "Order status updated successfully");
  })
];

const cancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const order = await OrdersRepository.findById(id);

  if (!order) {
    return next(new ApiError(404, "Order not found"));
  }

  const orderUserId = (order.userId?._id || order.userId)?.toString();
  const currentUserId = (req.user?._id || req.user?.id || req.user)?.toString();

  if (orderUserId !== currentUserId && req.user?.role !== "admin") {
    return next(new ApiError(403, "Forbidden"));
  }

  // Can only cancel if order is pending, paid, or payment_failed
  if (!["pending", "paid", "payment_failed"].includes(order.status)) {
    return next(new ApiError(400, `Cannot cancel an order with status "${order.status}"`));
  }

  // If order was already paid, restore stock
  if (order.paymentStatus === "paid") {
    for (const item of order.items) {
      await ProductsRepository.model.findOneAndUpdate(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
        { new: true }
      );
    }
  }

  const updated = await OrdersRepository.update(id, {
    status: "cancelled",
    paymentStatus: order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
  });

  return sendSuccess(res, updated, "Order cancelled successfully");
});

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder };