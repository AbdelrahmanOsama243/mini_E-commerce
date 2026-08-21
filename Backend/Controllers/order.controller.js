const OrdersRepository = require("../Repos/orders.Repo");
const CartsRepository = require("../Repos/Carts.Repo");
const ProductsRepository = require("../Repos/Products.Repo");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const { sendSuccess } = require("../Utils/response");
const { validateObjectId } = require("../Middlewares/validateObjectId");
const { addOrderJob } = require("../Jobs/order.queue");

const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress } = req.body;
  const userId = req.user?.id;
  if (!userId) {
    return next(new ApiError(401, "Unauthorized"));
  }

  // Fetch cart directly from DB
  const cart = await CartsRepository.getCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    return next(new ApiError(400, "Cart is empty"));
  }

  const cartItems = cart.items;

  // Remove synchronous stock validation and deduction
  // This will be handled asynchronously by the worker


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
  const userId = req.user?.id;
  let result;

  if (req.query.all === "true" && req.user?.role === "admin") {
    // Admin gets all orders
    result = await OrdersRepository.findAll({}, { populate: "userId items.productId", limit: 1000 });
  } else {
    // User gets their own orders
    result = await OrdersRepository.findAll({ userId }, { populate: "items.productId", limit: 1000 });
  }

  return sendSuccess(res, result.items);
});

const getOrderById = [
  validateObjectId(['id'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const order = await OrdersRepository.findById(id, { populate: "userId items.productId" });

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    if (order.userId._id.toString() !== req.user?.id && req.user?.role !== "admin") {
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

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };