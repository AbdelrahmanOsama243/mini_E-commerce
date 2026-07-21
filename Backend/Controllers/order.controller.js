const OrdersRepository = require("../Repos/orders.Repo");
const CartsRepository = require("../Repos/Carts.Repo");
const ProductsRepository = require("../Repos/Products.Repo");
const asyncHandler = require("../Utils/asyncHandler");
const ApiError = require("../Utils/ApiError");
const { sendSuccess } = require("../Utils/response");
const { validateObjectId } = require("../Middlewares/validateObjectId");

const createOrder = asyncHandler(async (req, res, next) => {
  const { shippingAddress } = req.body;
  if (!shippingAddress || shippingAddress.trim() === "") {
    return next(new ApiError(400, "Shipping address is required"));
  }

  const userId = req.user?.id;
  if (!userId) {
    return next(new ApiError(401, "Unauthorized"));
  }

  // Get cart
  const cart = await CartsRepository.getCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    return next(new ApiError(400, "Cart is empty"));
  }

  // Validate stock
  for (const item of cart.items) {
    if (!item.productId) {
      return next(new ApiError(404, "Product in cart not found"));
    }
    if (item.quantity > item.productId.stock) {
      return next(new ApiError(400, `Insufficient stock for ${item.productId.name}`));
    }
  }

  // Deduct stock
  for (const item of cart.items) {
    await ProductsRepository.update(item.productId._id, {
      stock: item.productId.stock - item.quantity,
    });
  }

  // Create order items array
  const orderItems = cart.items.map((item) => ({
    productId: item.productId._id,
    quantity: item.quantity,
    priceAtPurchase: item.productId.price,
  }));

  // Calculate total price
  const totalPrice = cart.items.reduce((total, item) => {
    return total + item.quantity * item.productId.price;
  }, 0);

  // Create order
  const order = await OrdersRepository.create({
    userId,
    items: orderItems,
    shippingAddress,
    totalPrice,
    status: "pending",
  });

  // Clear cart
  await CartsRepository.updateCart(cart._id, []);

  return sendSuccess(res, order, "Order created successfully", 201);
});

const getOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  let orders;

  if (req.query.all === "true" && req.user?.role === "admin") {
    // Admin gets all orders
    orders = await OrdersRepository.findAll({}, { populate: "userId items.productId" });
  } else {
    // User gets their own orders
    orders = await OrdersRepository.findAll({ userId }, { populate: "items.productId" });
  }

  return sendSuccess(res, orders);
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

    const validStatus = ["pending", "processing", "shipped", "delivered"];

    if (!validStatus.includes(status)) {
      return next(new ApiError(400, "Invalid status"));
    }

    const { id } = req.params;
    const order = await OrdersRepository.update(id, { status });

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    return sendSuccess(res, order, "Order status updated successfully");
  })
];

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };